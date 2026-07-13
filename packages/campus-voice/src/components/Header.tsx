import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showProfile?: boolean;
}

export const Header = ({ title, showBack = true, showProfile = true }: HeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <header className="flex items-center justify-between p-4 bg-background">
      <div className="flex items-center gap-4">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground hover:bg-[#E8E8E8]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        {title && <h1 className="text-lg font-semibold text-foreground">{title}</h1>}
      </div>
      {showProfile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/profile")}
          className="text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <User className="h-5 w-5" />
        </Button>
      )}
    </header>
  );
};
