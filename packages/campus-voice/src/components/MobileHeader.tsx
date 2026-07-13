import { Menu, User, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
  showBackOnDesktop?: boolean;
}

export const MobileHeader = ({ title, onMenuClick, showBackOnDesktop = true }: MobileHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-background py-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile: Hamburger menu only */}
          <button
            onClick={onMenuClick}
            className="md:hidden hover:bg-[#E8E8E8] rounded-lg transition-colors p-2"
          >
            <Menu className="w-6 h-6 text-muted-foreground" />
          </button>
          
          {/* Desktop: Back arrow */}
          {showBackOnDesktop && (
            <button
              onClick={() => navigate(-1)}
              className="hidden md:block hover:bg-[#E8E8E8] rounded-lg transition-colors p-2"
            >
              <ArrowLeft className="w-6 h-6 text-muted-foreground" />
            </button>
          )}
          
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="hover:bg-[#E8E8E8] rounded-lg transition-colors p-2"
        >
          <User className="w-6 h-6 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};
