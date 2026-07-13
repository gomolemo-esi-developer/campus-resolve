class ParticipantsService {
  constructor(supabase) {
    this.client = supabase;
  }

  async upsertParticipant(complaintId, profileId, role) {
    const { error } = await this.client
      .from('complaint_participants')
      .upsert(
        {
          complaint_id: complaintId,
          profile_id: profileId,
          participant_role: role || 'student',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'complaint_id,profile_id' }
      );

    if (error) throw error;
  }

  async getParticipant(complaintId, profileId) {
    const { data, error } = await this.client
      .from('complaint_participants')
      .select('*')
      .eq('complaint_id', complaintId)
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async isParticipant(complaintId, profileId) {
    const participant = await this.getParticipant(complaintId, profileId);
    return Boolean(participant);
  }
}

module.exports = ParticipantsService;
