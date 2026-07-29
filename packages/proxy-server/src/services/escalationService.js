/**
 * Escalation Service
 * Resolves who a complaint escalates to next, based on the category's
 * escalation chain (and variant, e.g. lecturer/supervisor for report-staff)
 * and the org unit the chain is scoped to (department/faculty/office/university).
 */
class EscalationService {
  constructor(supabase) {
    this.client = supabase;
  }

  /**
   * @param {Object} complaint - complaint row (must include category, complaint_type_id,
   *   current_level, chain_variant, filed_by)
   * @returns {Promise<{ nextLevel: number, roleId: string, assignedProfileId: string|null } | null>}
   *   null if there is no next step (chain exhausted or no chain configured for this category)
   */
  async resolveNextAssignee(complaint) {
    const categoryKey = await this._resolveCategoryKey(complaint);
    if (!categoryKey) return null;

    const chain = await this._findChain(categoryKey, complaint.chain_variant || null);
    if (!chain) return null;

    const nextLevel = (complaint.current_level || 1) + 1;
    const step = await this._findNextStep(chain.id, nextLevel);
    if (!step) return null;

    const orgUnitId = await this._resolveOrgUnit(chain.scope_type, categoryKey, complaint);
    const assignedProfileId = await this._resolveRoleHolderProfile(
      step.role_id,
      chain.scope_type,
      orgUnitId
    );

    return {
      nextLevel: step.step_order,
      roleId: step.role_id,
      assignedProfileId,
    };
  }

  async _resolveCategoryKey(complaint) {
    if (complaint.complaint_type_id) {
      const { data } = await this.client
        .from('complaint_types')
        .select('key')
        .eq('id', complaint.complaint_type_id)
        .maybeSingle();
      if (data?.key) return data.key;
    }
    return complaint.category || null;
  }

  async _findChain(categoryKey, variant) {
    let query = this.client
      .from('escalation_chains')
      .select('id, scope_type')
      .eq('category_key', categoryKey);

    query = variant ? query.eq('variant', variant) : query.is('variant', null);

    const { data } = await query.maybeSingle();
    return data || null;
  }

  async _findNextStep(chainId, minStepOrder) {
    const { data } = await this.client
      .from('escalation_chain_steps')
      .select('id, step_order, role_id')
      .eq('chain_id', chainId)
      .eq('active', true)
      .gte('step_order', minStepOrder)
      .order('step_order', { ascending: true })
      .limit(1);

    return data?.[0] || null;
  }

  async _resolveOrgUnit(scopeType, categoryKey, complaint) {
    if (scopeType === 'university') return null;

    const { data: profile } = await this.client
      .from('profiles')
      .select('department, faculty, campus')
      .eq('id', complaint.filed_by)
      .maybeSingle();

    if (!profile) return null;

    if (scopeType === 'department' && profile.department) {
      const { data } = await this.client
        .from('departments')
        .select('id')
        .eq('name', profile.department)
        .maybeSingle();
      return data?.id || null;
    }

    if (scopeType === 'faculty' && profile.faculty) {
      const { data } = await this.client
        .from('faculties')
        .select('id')
        .eq('name', profile.faculty)
        .maybeSingle();
      return data?.id || null;
    }

    if (scopeType === 'office' && profile.campus) {
      const { data: campusRow } = await this.client
        .from('campuses')
        .select('id')
        .eq('name', profile.campus)
        .maybeSingle();
      if (!campusRow) return null;

      const { data: officeRow } = await this.client
        .from('offices')
        .select('id')
        .eq('category_key', categoryKey)
        .eq('campus_id', campusRow.id)
        .maybeSingle();
      return officeRow?.id || null;
    }

    return null;
  }

  async _resolveRoleHolderProfile(roleId, orgUnitType, orgUnitId) {
    let query = this.client
      .from('role_holders')
      .select('staff_id')
      .eq('role_id', roleId)
      .eq('org_unit_type', orgUnitType)
      .eq('is_primary', true)
      .is('end_date', null);

    query = orgUnitId ? query.eq('org_unit_id', orgUnitId) : query.is('org_unit_id', null);

    const { data: holders } = await query.limit(1);
    const staffId = holders?.[0]?.staff_id;
    if (!staffId) return null;

    const { data: staffRow } = await this.client
      .from('staff')
      .select('cognito_sub')
      .eq('id', staffId)
      .maybeSingle();
    if (!staffRow?.cognito_sub) return null;

    const { data: profileRow } = await this.client
      .from('profiles')
      .select('id')
      .eq('cognito_sub', staffRow.cognito_sub)
      .maybeSingle();

    return profileRow?.id || null;
  }
}

module.exports = EscalationService;
