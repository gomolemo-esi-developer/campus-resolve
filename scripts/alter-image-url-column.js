const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pigwuxkwnhrpbmbcdgje.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZ3d1eGt3bmhycGJtYmNkZ2plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI3NTc1MSwiZXhwIjoyMDg4ODUxNzUxfQ.DgcR4maiZ8uYtOtbSkoXTWy6DicxwlZzz6zBdeGsbQ0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function alterColumns() {
  console.log('Altering staff.image_url column...');
  const { error: staffError } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE staff ALTER COLUMN image_url TYPE VARCHAR(2000);`
  });

  if (staffError) {
    console.error('Staff alter error (may be expected if no RPC):', staffError);
  } else {
    console.log('✅ staff.image_url altered to VARCHAR(2000)');
  }

  console.log('Altering students.image_url column...');
  const { error: studentError } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE students ALTER COLUMN image_url TYPE VARCHAR(2000);`
  });

  if (studentError) {
    console.error('Students alter error:', studentError);
  } else {
    console.log('✅ students.image_url altered to VARCHAR(2000)');
  }

  console.log('Creating index on staff.image_url...');
  const { error: idxError } = await supabase.rpc('exec_sql', {
    sql: `CREATE INDEX IF NOT EXISTS idx_staff_image_url ON staff(image_url) WHERE image_url IS NOT NULL;`
  });
  if (idxError) console.error('Index error:', idxError);
  else console.log('✅ Index created on staff.image_url');
}

alterColumns().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
