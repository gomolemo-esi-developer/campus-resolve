function formatDate(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

class ResolveConversationsService {
  constructor(supabase, parentService) {
    this.client = supabase;
    this.parentService = parentService;
  }

  async listDirectConversations(authUser) {
    await this.parentService._getOrCreateProfile(authUser, 'admin-resolve');

    const { data: complaints, error } = await this.client
      .from('complaints')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(100);
    if (error) throw error;

    const result = [];
    for (const complaint of complaints || []) {
      const { data: messages } = await this.client
        .from('complaint_messages')
        .select('*, profiles:sender_id(first_name,last_name,cognito_sub)')
        .eq('complaint_id', complaint.id)
        .order('created_at', { ascending: true });

      const { data: filerProfile } = await this.client
        .from('profiles')
        .select('first_name,last_name,cognito_sub')
        .eq('id', complaint.filed_by)
        .maybeSingle();

      const lastMessage = (messages || [])[Math.max((messages || []).length - 1, 0)];

      const mappedMessages = (messages || []).map((m) => ({
        id: m.id,
        subject: m.subject || complaint.title,
        date: formatDate(m.created_at),
        time: formatTime(m.created_at),
        content: m.content,
        isSent: m.profiles?.cognito_sub === authUser.id,
      }));

      result.push({
        id: complaint.id,
        sender: `${filerProfile?.first_name || ''} ${filerProfile?.last_name || ''}`.trim() || 'Student',
        type: 'direct',
        subject: complaint.title,
        date: formatDate(complaint.updated_at || complaint.created_at),
        time: formatTime(complaint.updated_at || complaint.created_at),
        relativeTime: 'Just now',
        priority: complaint.priority || 'normal',
        preview: lastMessage?.content ? String(lastMessage.content).slice(0, 80) : complaint.description,
        unread: false,
        complaintId: complaint.id,
        complaintTitle: complaint.title,
        messages: mappedMessages,
      });
    }

    return result;
  }

  async getDirectConversation(authUser, conversationId) {
    const conversations = await this.listDirectConversations(authUser);
    return conversations.find((c) => c.id === conversationId) || null;
  }

  async addDirectMessage(authUser, conversationId, payload) {
    const message = await this.parentService.addReply(authUser, conversationId, {
      subject: payload.subject,
      content: payload.content,
      attachments: payload.attachments || [],
    });

    // Build proper attachment objects from the returned data (which includes IDs and storage keys)
    const attachments = (message.attachments || []).map((att) => ({
      id: att.id,
      name: att.name,
      size: att.size,
      type: att.type,
      url: att.url || null,
      storageKey: att.storageKey || att.storage_key || null,
    }));

    return {
      id: message.id,
      subject: message.subject || '',
      date: formatDate(message.created_at),
      time: formatTime(message.created_at),
      content: message.content,
      attachments: attachments,
      isSent: true,
    };
  }
}

module.exports = ResolveConversationsService;
