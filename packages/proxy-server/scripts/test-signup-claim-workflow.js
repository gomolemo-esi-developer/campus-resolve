/**
 * Workflow test (not a unit test): exercises the real end-to-end path from
 * "Admin pre-creates a student record" through "new user signs up, gets
 * claimed against that record, logs in, and sees their populated Profile
 * page" — the exact flow the Campus Voice / Campus Resolve Profile fix
 * depends on.
 *
 * Steps (all real HTTP calls against the live local backends + live AWS
 * Cognito user pool + live Supabase project — nothing is mocked):
 *   1. POST /api/admin/students   - admin creates an "unclaimed" student record
 *   2. POST /api/auth/cognito/signup - a new user signs up matching that record
 *      (server auto-confirms via AdminConfirmSignUp and claims the record)
 *   3. POST /api/auth/cognito/signin - the new user logs in
 *   4. GET  /api/voice/profile    - Profile page fetch, asserted against what
 *      was created in step 1
 *   5. Cleanup: delete the Supabase row and the Cognito user, so the test
 *      leaves no residue.
 *
 * Requires the proxy-server backends already running:
 *   backend-admin.js  (port 8087)
 *   backend-server.js (port 8085, Campus Voice)
 * Run from packages/proxy-server:  node scripts/test-signup-claim-workflow.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const ADMIN_BASE = 'http://localhost:8087/api/admin';
const VOICE_BASE = 'http://localhost:8085/api/voice';
const AUTH_BASE = 'http://localhost:8085/api/auth/cognito';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const cognito = new CognitoIdentityProviderClient({ region: process.env.COGNITO_REGION || 'us-east-2' });

const stamp = Date.now();
const testStudent = {
  student_id: `QATEST${stamp}`,
  first_name: 'Workflow',
  last_name: `Test${stamp}`,
  email: `qa.workflow.test+${stamp}@campus.edu`,
  faculty: 'Faculty of Information & Communication Technology',
  department: 'Computer Science',
  campus: 'Pretoria',
  course: 'Bachelor of Computer Science',
  residence: 'Commuter',
  extracurricular: 'Chess Club',
};
const testPassword = 'TestClaim123';

let createdStudentDbId = null;
let cognitoUsername = null;
const results = [];

function record(step, pass, detail) {
  results.push({ step, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${step}${detail ? ' - ' + detail : ''}`);
}

async function main() {
  // Step 1: Admin pre-creates an unclaimed student record
  const createRes = await fetch(`${ADMIN_BASE}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer qa-workflow-test' },
    body: JSON.stringify(testStudent),
  });
  const createBody = await createRes.json();
  if (!createRes.ok || !createBody.success) {
    record('1. Admin creates unclaimed student record', false, JSON.stringify(createBody));
    return finish();
  }
  createdStudentDbId = createBody.data.id;
  record('1. Admin creates unclaimed student record', true, `id=${createdStudentDbId}, student_id=${testStudent.student_id}`);

  const { data: rawRow } = await supabase.from('students').select('cognito_sub').eq('id', createdStudentDbId).single();
  record('1b. Record is unclaimed (cognito_sub IS NULL)', rawRow && rawRow.cognito_sub === null, `cognito_sub=${rawRow && rawRow.cognito_sub}`);

  // Step 2: New user signs up matching the pre-created record
  const signupRes = await fetch(`${AUTH_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testStudent.email,
      password: testPassword,
      student_number: testStudent.student_id,
      role: 'student',
      portal: 'voice',
    }),
  });
  const signupBody = await signupRes.json();
  if (!signupRes.ok || !signupBody.success) {
    record('2. New user signs up and gets claimed', false, JSON.stringify(signupBody));
    return finish();
  }
  cognitoUsername = testStudent.email;
  record('2. New user signs up and gets claimed', true, signupBody.message || '');

  const { data: claimedRow } = await supabase.from('students').select('cognito_sub').eq('id', createdStudentDbId).single();
  record('2b. Record is now claimed (cognito_sub set)', !!(claimedRow && claimedRow.cognito_sub), `cognito_sub=${claimedRow && claimedRow.cognito_sub}`);

  // Step 3: User logs in
  const signinRes = await fetch(`${AUTH_BASE}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testStudent.email, password: testPassword }),
  });
  const signinBody = await signinRes.json();
  if (!signinRes.ok || !signinBody.success || !signinBody.idToken) {
    record('3. New user logs in', false, JSON.stringify(signinBody));
    return finish();
  }
  record('3. New user logs in', true, 'received idToken');

  // Step 4: Profile page fetch, asserted against the admin-created record
  const profileRes = await fetch(`${VOICE_BASE}/profile`, {
    headers: { Authorization: `Bearer ${signinBody.idToken}` },
  });
  const profileBody = await profileRes.json();
  if (!profileRes.ok || !profileBody.success) {
    record('4. Profile page returns data', false, JSON.stringify(profileBody));
    return finish();
  }
  const p = profileBody.data;
  const checks = [
    ['firstName', p.firstName === testStudent.first_name],
    ['lastName', p.lastName === testStudent.last_name],
    ['email', p.email === testStudent.email],
    ['studentNumber', p.studentNumber === testStudent.student_id],
    ['faculty', p.faculty === testStudent.faculty],
    ['department', p.department === testStudent.department],
    ['campus', p.campus === testStudent.campus],
    ['course', p.course === testStudent.course],
    ['residence', p.residence === testStudent.residence],
    ['extracurricular', p.extracurricular === testStudent.extracurricular],
  ];
  const allMatch = checks.every(([, ok]) => ok);
  record(
    '4. Profile page reflects the admin-created record field-for-field',
    allMatch,
    checks.filter(([, ok]) => !ok).map(([f]) => `${f} mismatch (got "${p[f]}")`).join('; ') || 'all fields match'
  );

  await finish();
}

async function finish() {
  console.log('\nCleaning up...');
  if (createdStudentDbId) {
    const { error } = await supabase.from('students').delete().eq('id', createdStudentDbId);
    console.log(error ? `  Supabase row cleanup FAILED: ${error.message}` : '  Supabase row deleted');
  }
  if (cognitoUsername && process.env.COGNITO_USER_POOL_ID) {
    try {
      await cognito.send(new AdminDeleteUserCommand({ UserPoolId: process.env.COGNITO_USER_POOL_ID, Username: cognitoUsername }));
      console.log('  Cognito user deleted');
    } catch (e) {
      console.log(`  Cognito user cleanup FAILED: ${e.message}`);
    }
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} steps passed.`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Workflow test crashed:', err);
  finish();
});
