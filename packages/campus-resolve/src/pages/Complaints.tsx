import { useState, useRef, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { InboxPanel } from "@/components/InboxPanel";
import { MessageDetail } from "@/components/MessageDetail";
import { ComposeArea } from "@/components/ComposeArea";
import { Button } from "@/components/ui/button";
import { PenLine, X, MessageSquare, ChevronLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useConversations as useConversationsContext,
  type Message,
  type Conversation,
  type MessageAttachment,
} from "@/contexts/ConversationsContext";
import { useConversations, useNotes, useComplaints } from "@/hooks";

const Complaints = () => {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const composeRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contextConversations = useConversationsContext();
  const { selectedConversation, setSelectedConversation, setConversations } =
    contextConversations;

  const { addMessage: addMessageAPI } = useConversations();
  const { fetchNotes, notes } = useNotes();
  const {
    complaints,
    fetchAssignedComplaints,
    fetchComplaint,
    addComplaintMessage,
  } = useComplaints();

// Convert complaints to conversations format
  useEffect(() => {
    if (complaints.length > 0) {
      const complaintConversations: Conversation[] = complaints.map(
        (complaint) => {
          // Normalize attachments with storageKey support
          const normalizeAttachments = (atts: any[] | undefined): MessageAttachment[] | undefined => {
            if (!Array.isArray(atts)) return undefined;
            return atts.map((att) => ({
              type:
                att?.file_type === "image"
                  ? "image"
                  : att?.file_type === "pdf"
                    ? "pdf"
                    : att?.file_type === "excel"
                      ? "excel"
                      : att?.file_type === "word"
                        ? "word"
                        : att?.type === "pdf"
                          ? "pdf"
                          : att?.type === "image"
                            ? "image"
                            : att?.type === "excel"
                              ? "excel"
                              : att?.type === "word"
                                ? "word"
                                : "document",
              name: att?.name || att?.file_name || "Attachment",
              url: att?.url || att?.file_path || undefined,
              storageKey: att?.storage_key || undefined,
              id: att?.id || undefined,
              size: att?.size || att?.file_size || undefined,
              mimeType: att?.mimeType || att?.mime_type || undefined,
            }));
          };

          return {
            id: complaint.id,
            sender: complaint.student_name || "Student",
            subject: complaint.title,
            date: new Date(complaint.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            time: new Date(complaint.created_at).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            relativeTime: "Complaint",
            priority: complaint.priority as "normal" | "urgent" | "emergency",
            preview: complaint.description.substring(0, 50) + "...",
            messages: (complaint.messages || []).map((msg) => ({
              id: msg.id,
              subject: msg.subject || complaint.title,
              date: new Date(msg.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
              time: new Date(msg.created_at).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
              content: msg.content,
              isSent: msg.sender_type === "staff",
              attachments: normalizeAttachments(msg.attachments),
            })),
            type: "complaint" as const,
            unread: complaint.status === "open",
          };
        },
      );

      setConversations((prev) => {
        const existingIds = new Set(
          prev.filter((c) => c.type === "complaint").map((c) => c.id),
        );
        const newComplaints = complaintConversations.filter(
          (c) => !existingIds.has(c.id),
        );
        return [
          ...prev.filter((c) => c.type !== "complaint"),
          ...newComplaints,
        ];
      });
    }
  }, [complaints, setConversations]);

  useEffect(() => {
    fetchNotes();
    fetchAssignedComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

useEffect(() => {
     if (selectedConversation?.type === "complaint") {
       fetchComplaint(selectedConversation.id).then((fullComplaint) => {
         if (fullComplaint) {
           // Normalize attachments with storageKey support
           const normalizeAttachments = (atts: any[] | undefined): MessageAttachment[] | undefined => {
             if (!Array.isArray(atts)) return undefined;
             return atts.map((att) => ({
               type:
                 att?.file_type === "image"
                   ? "image"
                   : att?.file_type === "pdf"
                     ? "pdf"
                     : att?.file_type === "excel"
                       ? "excel"
                       : att?.file_type === "word"
                         ? "word"
                         : att?.type === "pdf"
                           ? "pdf"
                           : att?.type === "image"
                             ? "image"
                             : att?.type === "excel"
                               ? "excel"
                               : att?.type === "word"
                                 ? "word"
                                 : "document",
               name: att?.name || att?.file_name || "Attachment",
               url: att?.url || att?.file_path || undefined,
               storageKey: att?.storage_key || undefined,
               id: att?.id || undefined,
               size: att?.size || att?.file_size || undefined,
               mimeType: att?.mimeType || att?.mime_type || undefined,
             }));
           };

           const updatedMessages = (fullComplaint.messages || []).map((msg) => ({
            id: msg.id,
            subject: msg.subject || fullComplaint.title,
            date: new Date(msg.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            time: new Date(msg.created_at).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            content: msg.content,
            isSent: msg.sender_type === "staff",
            attachments: normalizeAttachments(msg.attachments),
          }));

          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === fullComplaint.id
                ? { ...conv, messages: updatedMessages }
                : conv,
            ),
          );

          setSelectedConversation((prev) =>
            prev && prev.id === fullComplaint.id
              ? { ...prev, messages: updatedMessages }
              : prev,
          );
        }
      });
    }
  }, [
    selectedConversation?.id,
    selectedConversation?.type,
    fetchComplaint,
    setConversations,
    setSelectedConversation,
  ]);

  const quickNotes = useMemo(
    () =>
      notes
        .filter((n) => n.type === "note")
        .map(({ id, subject, description }) => ({ id, subject, description })),
    [notes],
  );
  const quickFiles = useMemo(
    () =>
      notes
        .filter((n) => n.type === "file")
        .map(({ id, name, fileType, storage_key, size, thumbnail, s3_url }) => ({
          id,
          name,
          type: fileType,
          storageKey: storage_key,
          size,
          thumbnail,
          s3_url,
        })),
    [notes],
  );

  useEffect(() => {
    if (isComposeOpen && composeRef.current) {
      composeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isComposeOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation?.messages]);

const handleSendMessage = async (message: {
    subject: string;
    content: string;
    attachments: Array<{
      type: "pdf" | "image" | "excel" | "word" | "document";
      name: string;
      url?: string;
      storageKey?: string;
      size?: number;
      s3_url?: string;
      id?: string;
    }>;
  }) => {
    const now = new Date();
    const newMessage: Message = {
      id: Date.now().toString(),
      subject: message.subject || "Subject Line",
      date: now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      time: now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      content: message.content,
      attachments:
        message.attachments && message.attachments.length > 0
          ? message.attachments.map((att) => ({
              type: att.type,
              name: att.name,
              url: att.url,
              storageKey: att.storageKey,
              size: att.size,
            }))
          : undefined,
      isSent: true,
    };

    if (selectedConversation) {
      if (selectedConversation.type === "complaint") {
        await addComplaintMessage(selectedConversation.id, {
          subject: message.subject,
          content: message.content,
          attachments: message.attachments,
        });
        contextConversations.addMessage(selectedConversation.id, newMessage);
      } else {
        await addMessageAPI(
          selectedConversation.id,
          selectedConversation.type,
          {
            subject: message.subject,
            content: message.content,
            attachments: message.attachments,
            date: newMessage.date,
            time: newMessage.time,
          },
        );
        contextConversations.addMessage(selectedConversation.id, newMessage);
      }
    } else {
      const newConversation = await contextConversations.createConversation({
        sender: "Antonie Smith",
        subject: message.subject || "New Complaint",
        date: newMessage.date,
        time: newMessage.time,
        relativeTime: "Just now",
        priority: "normal",
        preview: message.content.substring(0, 50) + "...",
        messages: [newMessage],
        type: "complaint",
        unread: false,
      });
      setSelectedConversation(newConversation);
    }
    setIsComposeOpen(false);
  };

  const handleBackToLanding = () => {
    setSelectedConversation(null);
    setIsComposeOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />

      {/* Main Content */}
      <main className="relative flex-1 bg-[#F8F8F8] lg:ml-72 xl:mr-[420px] h-screen flex flex-col pt-16 lg:pt-0">
        <div className="flex-1 flex flex-col mx-auto w-full max-w-5xl">
          {!selectedConversation ? (
            // Landing Page
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
              <div className="w-full max-w-2xl text-center space-y-6 md:space-y-8">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Complaints
                </h1>
                <div className="space-y-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto">
                    <MessageSquare className="w-7 h-7 md:w-8 md:h-8 text-secondary" />
                  </div>
                  <p className="text-lg md:text-xl text-[#5F5F5F] px-4">
                    Select a complaint from your inbox
                  </p>
                  <p className="text-sm text-[#5F5F5F]">
                    Choose from the list on the right to view details
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Conversation View
            <div className="flex-1 flex flex-col h-screen bg-[#F8F8F8]">
              <ScrollArea className="flex-1">
                <div className="p-4 md:p-8 min-h-full bg-[#F8F8F8]">
                  <div className="w-full space-y-4 md:space-y-6 pb-24">
                    {/* Header */}
                    <div className="flex items-center gap-3 md:gap-4">
                      <Button
                        variant="ghost"
                        onClick={handleBackToLanding}
                        className="text-foreground hover:text-foreground hover:bg-[#F0F0F0] h-12 w-12 p-0 flex items-center justify-center [&_svg]:!size-8"
                      >
                        <ChevronLeft className="w-8 h-8" />
                      </Button>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                          {selectedConversation.subject}
                        </h1>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-4 md:space-y-6">
                      {selectedConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div className="w-[70%]">
                            <MessageDetail
                              subject={message.subject}
                              date={message.date}
                              time={message.time}
                              content={message.content}
                              attachments={message.attachments}
                              isSent={message.isSent}
                            />
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Compose Area - Always at bottom, centered */}
              <div className="p-4 md:p-6 bg-[#F8F8F8]">
                <div className="max-w-5xl mx-auto">
                  {!isComposeOpen ? (
                    <Button
                      onClick={() => setIsComposeOpen(true)}
                      className="bg-white hover:bg-white text-[#FA6400] font-normal shadow-md hover:shadow-lg transition-all duration-200 gap-2 px-6 py-5 rounded-lg min-h-[52px] text-base border border-gray-200 w-full md:w-auto"
                      size="lg"
                    >
                      <PenLine className="w-5 h-5" />
                      Reply
                    </Button>
                  ) : (
                    <div
                      ref={composeRef}
                      className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      <div className="relative p-4 md:p-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsComposeOpen(false)}
                          className="absolute top-4 right-4 text-muted-foreground hover:text-secondary hover:bg-secondary/10"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                        <ComposeArea
                          complaintId={selectedConversation?.id}
                          onSendMessage={handleSendMessage}
                          quickNotes={quickNotes}
                          quickFiles={quickFiles}
                        />
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </div>
          )}
        </div>
      </main>

      <InboxPanel />
    </div>
  );
};

export default Complaints;
