import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const getUserInitials = (username: string) => {
    return username
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 bg-card border-b border-border/50 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-primary rounded-sm" />
        <h1 className="text-xl font-semibold tracking-wide">ADMIN PORTAL</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {user?.username || "Admin"}, <span className="font-semibold text-foreground">Department Admin</span>
          </p>
        </div>
        <Avatar className="h-10 w-10">
          <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" alt={user?.username} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium border-2 border-primary">
            {user?.username ? getUserInitials(user.username) : "AD"}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
