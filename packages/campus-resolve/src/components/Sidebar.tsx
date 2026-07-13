import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, MessageCircle, User, StickyNote, Menu, X, AlertCircle, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@shared/contexts/AuthContext";

const menuItems = [
  { title: "Complaints", icon: AlertCircle, url: "/complaints" },
  { title: "Profile", icon: User, url: "/profile" },
  { title: "Quick Notes", icon: StickyNote, url: "/notes" },
];

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout();
    } finally {
      navigate("/");
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-background/80 backdrop-blur-sm shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-72 bg-[#FFFFFF] flex flex-col fixed left-0 top-0 h-screen z-50 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Close Button - Mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 lg:hidden"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Logo/Brand */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
            <Flame className="w-6 h-6 text-secondary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Reception Portal</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 relative">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.url} className="relative">
                <NavLink
                  to={item.url}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-full text-foreground/70 hover:bg-muted/50 transition-colors relative"
                  activeClassName="bg-secondary text-background hover:bg-secondary font-medium before:content-[''] before:absolute before:left-[-16px] before:top-0 before:bottom-0 before:w-1 before:bg-secondary before:rounded-r-full"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button - Bottom of Sidebar */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-foreground/70 hover:bg-muted/50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
