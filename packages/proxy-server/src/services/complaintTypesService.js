class ComplaintTypesService {
  constructor(supabase) {
    this.client = supabase;
  }

  async getComplaintTypes() {
    const { data, error } = await this.client
      .from('complaint_types')
      .select('*')
      .eq('is_active', true)
      .order('label', { ascending: true });

    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      key: row.key,
      label: row.label,
      description: row.description || '',
      isActive: Boolean(row.is_active),
    }));
  }
}

module.exports = ComplaintTypesService;
