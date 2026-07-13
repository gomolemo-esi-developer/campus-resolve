import { create } from 'zustand';

export interface Attachment {
  name: string;
  size: string;
  type: 'pdf' | 'image' | 'document';
  url?: string;
}

export interface Response {
  sender: string;
  text: string;
  content: string;
  attachments: Attachment[];
  time: string;
  date: string;
}

export interface Message {
  id: number;
  professor: string;
  title: string;
  preview: string;
  time: string;
  duration: string;
  category: string;
  level: string;
  isRead: boolean;
  fullText: string;
  date: string;
  attachments: Attachment[];
  responses: Response[];
}

interface MessageStore {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id'>) => number;
  getMessageById: (id: number) => Message | undefined;
  deleteMessage: (id: number) => void;
  addResponse: (messageId: number, response: Response) => void;
}

const initialMessages: Message[] = [];

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: initialMessages,
  
  addMessage: (message) => {
    const newId = Math.max(...get().messages.map(m => m.id), 0) + 1;
    const newMessage: Message = { ...message, id: newId };
    set((state) => ({
      messages: [newMessage, ...state.messages],
    }));
    return newId;
  },
  
  getMessageById: (id) => {
    return get().messages.find(m => m.id === id);
  },
  
  deleteMessage: (id) => {
    set((state) => ({
      messages: state.messages.filter(m => m.id !== id),
    }));
  },

  addResponse: (messageId, response) => {
    set((state) => ({
      messages: state.messages.map(m => 
        m.id === messageId 
          ? { ...m, responses: [...m.responses, response] }
          : m
      ),
    }));
  },
}));
