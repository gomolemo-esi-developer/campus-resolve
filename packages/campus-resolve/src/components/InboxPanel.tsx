import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Inbox, X, MessageCircle, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useConversations, type Conversation } from "@/contexts/ConversationsContext";
import { Badge } from "@/components/ui/badge";

const PRIORITY_STYLES: Record<Conversation["priority"], { label: string; chip: string }> = {
  urgent: { label: "Urgent", chip: "bg-[#EF3125]/10 text-[#EF3125]" },
  emergency: { label: "Emergency", chip: "bg-[#F9B229]/20 text-[#8A5A00]" },
  normal: { label: "Normal", chip: "bg-gray-100 text-gray-500" },
};

const STATUS_STYLES: Record<NonNullable<Conversation["status"]>, { label: string; chip: string }> = {
  open: { label: "Open", chip: "bg-secondary/15 text-secondary" },
  in_progress: { label: "In progress", chip: "bg-[#F9B229]/20 text-[#8A5A00]" },
  escalated: { label: "Escalated", chip: "bg-[#EF3125]/10 text-[#EF3125]" },
  resolved: { label: "Resolved", chip: "bg-emerald-500/10 text-emerald-600" },
  closed: { label: "Closed", chip: "bg-gray-100 text-gray-500" },
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDateDisplay = (dateString: string): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(dateString);

  const isToday = messageDate.toDateString() === today.toDateString();
  const isYesterday = messageDate.toDateString() === yesterday.toDateString();

  if (isToday) return "today";
  if (isYesterday) return "yesterday";

  const daysDifference = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDifference > 0 && daysDifference <= 7) return "last week";

  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  return messageDate.toLocaleDateString("en-US", options);
};

interface InboxPanelProps {
  onSelectConversation?: (conversation: Conversation) => void;
}

export const InboxPanel = ({ onSelectConversation }: InboxPanelProps) => {
  const navigate = useNavigate();
  const { conversations, selectedConversation, setSelectedConversation, markAsRead, unreadCount } = useConversations();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredConversations = conversations
    .filter(conv => conv.type === "complaint")
    .filter(conv =>
      conv.sender.toLowerCase().includes(search.toLowerCase()) ||
      conv.subject.toLowerCase().includes(search.toLowerCase())
    );

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    markAsRead(conversation.id);
    onSelectConversation?.(conversation);
    navigate("/complaints");
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 xl:hidden bg-background/80 backdrop-blur-sm shadow-sm"
      >
        <Inbox className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-secondary-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "w-full sm:w-[420px] bg-[#FFFFFF] flex flex-col fixed right-0 top-0 h-screen z-50 transition-transform duration-300 ease-in-out",
        "xl:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full xl:translate-x-0"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 xl:hidden"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Inbox</h2>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                {unreadCount} new
              </Badge>
            )}
          </div>

          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black stroke-[2.5]" />
            <Input
              type="text"
              placeholder="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-[#F8F8F8] border-0 text-muted-foreground placeholder:text-muted-foreground/60 rounded-[25px] !focus-visible:ring-0 !focus-visible:outline-none !ring-offset-0"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <Inbox className="h-7 w-7 text-gray-300" strokeWidth={1.6} />
                <p className="text-sm font-medium text-foreground">No conversations yet</p>
                <p className="text-xs text-gray-400">Complaints assigned to you will show up here.</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const isSelected = selectedConversation?.id === conversation.id;
                const priorityStyle = PRIORITY_STYLES[conversation.priority];
                const statusStyle = conversation.status ? STATUS_STYLES[conversation.status] : null;
                const replyCount = conversation.messages.length;
                const attachmentCount = conversation.messages.reduce(
                  (total, message) => total + (message.attachments?.length || 0),
                  0
                );

                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className="group mb-2 cursor-pointer"
                  >
                    <div
                      className={cn(
                        "flex gap-3 rounded-2xl border bg-white p-4 transition-all",
                        isSelected
                          ? "border-secondary bg-secondary/5 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        {/* Identity + timestamp */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="bg-secondary/15 text-[11px] font-semibold text-secondary">
                                {getInitials(conversation.sender)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 items-center gap-1.5">
                              {conversation.unread && (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                              )}
                              <span
                                className={cn(
                                  "truncate text-sm",
                                  conversation.unread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                                )}
                              >
                                {conversation.sender}
                              </span>
                            </div>
                          </div>
                          <span className="shrink-0 text-xs text-gray-400">
                            {formatDateDisplay(conversation.date)}
                          </span>
                        </div>

                        {/* Priority / status / category chips */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", priorityStyle.chip)}>
                            {priorityStyle.label}
                          </span>
                          {statusStyle && (
                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", statusStyle.chip)}>
                              {statusStyle.label}
                            </span>
                          )}
                          {conversation.category && (
                            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                              {conversation.category}
                            </span>
                          )}
                        </div>

                        {/* Subject + preview */}
                        <h3
                          className={cn(
                            "mt-2 truncate text-sm",
                            conversation.unread ? "font-semibold text-foreground" : "font-medium text-foreground"
                          )}
                        >
                          {conversation.subject}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-gray-500">{conversation.preview}</p>

                        {/* Footer */}
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {replyCount}
                            </span>
                            {attachmentCount > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Paperclip className="h-3.5 w-3.5" />
                                {attachmentCount}
                              </span>
                            )}
                          </div>
                          {conversation.unread && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(conversation.id);
                              }}
                              className="text-xs font-medium text-secondary opacity-0 transition-opacity hover:underline group-hover:opacity-100"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        </aside>
    </>
  );
};
