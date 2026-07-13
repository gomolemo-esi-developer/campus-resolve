import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Inbox, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useConversations, type Conversation } from "@/contexts/ConversationsContext";
import { Badge } from "@/components/ui/badge";

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
              <div className="p-8 text-center text-muted-foreground">
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Start a new conversation to see it here</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const isSelected = selectedConversation?.id === conversation.id;
                const barColor = conversation.priority === "urgent" ? "bg-[#EF3125]" : conversation.priority === "emergency" ? "bg-[#F9B229]" : "bg-[#E8E8E8]";
                const borderColor = conversation.priority === "urgent" ? "border-[#EF3125]" : conversation.priority === "emergency" ? "border-[#F9B229]" : "border-[#E8E8E8]";
                const bgColor = conversation.priority === "urgent" ? "bg-[#EF3125]/10" : conversation.priority === "emergency" ? "bg-[#F9B229]/10" : "bg-white";
                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className="mb-2 cursor-pointer transition-all"
                  >
                    <div
                      className={cn(
                        "flex items-stretch gap-4 p-4 rounded-lg transition-all",
                        isSelected ? "bg-[#F8F8F8]" : cn("border", bgColor, borderColor),
                        !isSelected ? "hover:bg-gray-50" : ""
                      )}
                    >
                      {!isSelected && (
                        <div className={cn(
                          "w-1 rounded-full flex-shrink-0",
                          barColor
                        )} />
                      )}

                      <div className="flex items-stretch justify-between gap-4 flex-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-foreground mt-0.5">{conversation.subject}</h3>
                          <p className="text-xs text-gray-500 truncate mt-1">{conversation.preview}</p>
                        </div>

                        <div className="text-right min-w-fit flex flex-col justify-center">
                          <p className="text-xs text-gray-500">{formatDateDisplay(conversation.date)}</p>
                        </div>
                      </div>

                      {conversation.unread && (
                        <div className="absolute top-4 left-6 w-2 h-2 bg-primary rounded-full animate-pulse" />
                      )}
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
