import { createContext, useContext, useState, ReactNode } from "react";

export type MessageType = "direct" | "complaint";

export interface MessageAttachment {
   id?: string;
   type: "pdf" | "image" | "excel" | "word" | "document";
   name: string;
   url?: string;
   storageKey?: string;
   size?: number;
   mimeType?: string;
   s3_url?: string;
 }

export interface Message {
  id: string;
  subject: string;
  date: string;
  time: string;
  content: string;
  attachments?: MessageAttachment[];
  isSent?: boolean;
}

export interface Conversation {
  id: string;
  sender: string;
  subject: string;
  date: string;
  time: string;
  relativeTime: string;
  priority: "normal" | "urgent" | "emergency";
  messages: Message[];
  preview: string;
  type: MessageType;
  unread: boolean;
}

interface ConversationsContextType {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  selectedConversation: Conversation | null;
  setSelectedConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
  addMessage: (conversationId: string, message: Message) => void;
  createConversation: (conversation: Omit<Conversation, "id">) => Conversation;
  markAsRead: (conversationId: string) => void;
  unreadCount: number;
  unreadDirectCount: number;
  unreadComplaintCount: number;
}

const ConversationsContext = createContext<ConversationsContextType | null>(null);

const initialConversations: Conversation[] = [];

export const ConversationsProvider = ({ children }: { children: ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const addMessage = (conversationId: string, message: Message) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { 
            ...conv, 
            messages: [...conv.messages, message],
            preview: message.content.substring(0, 50) + "...",
            date: message.date,
            time: message.time,
            relativeTime: "Just now"
          }
        : conv
    ));
    
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, message]
      } : null);
    }
  };

  const createConversation = (conversationData: Omit<Conversation, "id">) => {
    const newConversation: Conversation = {
      ...conversationData,
      id: Date.now().toString(),
    };
    setConversations(prev => [newConversation, ...prev]);
    return newConversation;
  };

  const markAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, unread: false } : conv
    ));
  };

  const unreadCount = conversations.filter(c => c.unread).length;
  const unreadDirectCount = conversations.filter(c => c.unread && c.type === "direct").length;
  const unreadComplaintCount = conversations.filter(c => c.unread && c.type === "complaint").length;

  return (
    <ConversationsContext.Provider value={{
      conversations,
      setConversations,
      selectedConversation,
      setSelectedConversation,
      addMessage,
      createConversation,
      markAsRead,
      unreadCount,
      unreadDirectCount,
      unreadComplaintCount,
    }}>
      {children}
    </ConversationsContext.Provider>
  );
};

export const useConversations = () => {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error("useConversations must be used within a ConversationsProvider");
  }
  return context;
};
