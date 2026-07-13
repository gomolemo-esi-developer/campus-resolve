import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
interface MessageButtonProps {
  hasNotification?: boolean;
}
export const MessageButton = ({
  hasNotification = true
}: MessageButtonProps) => {
  const navigate = useNavigate();
  return <Button onClick={() => navigate("/messages")} className="fixed bottom-6 right-6 bg-foreground text-background hover:bg-foreground/90 shadow-2xl rounded-full h-14 px-6 z-50 transition-all hover:scale-105">
      <MessageCircle className="mr-2 h-5 w-5" />
      Messages
      {hasNotification && <span className="absolute -top-1 -right-1 h-4 w-4 bg-notification rounded-full border-2 border-background animate-pulse text-[#FA6400]" />}
    </Button>;
};