/**
 * Pre-Registration Lookup Service
 * Matches a signup attempt (email + student/staff number) against the
 * admin-created records in the `students`/`staff` tables, and marks a
 * matched record as claimed once a Cognito account has been created for it.
 */

const { createClient } = require('@supabase/supabase-js');

const PORTAL_CONFIG = {
  voice: { table: 'students', numberColumn: 'student_id', role: 'student' },
  resolve: { table: 'staff', numberColumn: 'staff_id', role: 'staff' },
};

class PreRegistrationService {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    this.enabled = Boolean(supabaseUrl && supabaseKey);
    this.client = this.enabled ? createClient(supabaseUrl, supabaseKey) : null;
  }

  isEnabled() {
    return this.enabled && Boolean(this.client);
  }

  getPortalConfig(portal) {
    return PORTAL_CONFIG[portal] || null;
  }

  /**
   * Look up a pre-registered students/staff row by exact email + number match.
   * @returns {Promise<{status: 'not_found'|'ambiguous'|'already_claimed'|'matched', record?, table?, role?}>}
   */
  async findRecord({ email, number, portal }) {
    const config = this.getPortalConfig(portal);
    if (!config) {
      throw new Error(`Unsupported portal for pre-registration lookup: ${portal}`);
    }
    if (!this.isEnabled()) {
      throw new Error('Pre-registration lookup is not enabled (missing Supabase credentials)');
    }

    const { data, error } = await this.client
      .from(config.table)
      .select('*')
      .ilike('email', String(email || '').trim())
      .eq(config.numberColumn, String(number || '').trim());

    if (error) throw error;

    if (!data || data.length === 0) {
      return { status: 'not_found' };
    }
    if (data.length > 1) {
      return { status: 'ambiguous' };
    }

    const record = data[0];
    if (record.cognito_sub) {
      return { status: 'already_claimed' };
    }

    return { status: 'matched', record, table: config.table, role: config.role };
  }

  /**
   * Mark a pre-registered row as claimed by a new Cognito user.
   * Conditional on the row still being unclaimed, to guard against a race
   * between two signup attempts for the same record.
   */
  async claimRecord(table, id, cognitoSub) {
    const { data, error } = await this.client
      .from(table)
      .update({ cognito_sub: cognitoSub, updated_at: new Date().toISOString() })
      .eq('id', id)
      .is('cognito_sub', null)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const err = new Error('Record was already claimed by another account');
      err.statusCode = 409;
      throw err;
    }

    return data;
  }
}

module.exports = new PreRegistrationService();
