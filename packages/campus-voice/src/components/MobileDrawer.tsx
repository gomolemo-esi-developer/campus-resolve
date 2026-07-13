import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, BookOpen, Users, ChevronDown, ChevronRight, GraduationCap, LogOut, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@shared/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const menuItems = [{
  category: "General",
  subtitle: "Student & Campus",
  icon: Users,
  subcategories: [{
    title: "Student Services",
    path: "/complaint",
    param: "student-services",
    icon: Users
  }, {
    title: "Campus Facilities",
    path: "/complaint",
    param: "campus-facilities",
    icon: Users
  }]
}, {
  category: "Academic",
  subtitle: "Courses & Learning",
  icon: BookOpen,
  subcategories: [{
    title: "Course Complaint",
    path: "/complaint",
    param: "course-complaint",
    icon: BookOpen
  }, {
    title: "Timetable",
    path: "/complaint",
    param: "timetable",
    icon: BookOpen
  }, {
    title: "Lecture Hall | Lab",
    path: "/complaint",
    param: "lecture-hall-lab",
    icon: BookOpen
  }, {
    title: "Report Lecturer",
    path: "/complaint",
    param: "report-lecturer",
    icon: BookOpen
  }]
}];

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileDrawer = ({ open, onOpenChange }: MobileDrawerProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setActiveCategory(activeCategory === category ? null : category);
  };

  const handleLogout = async () => {
    onOpenChange(false);
    try {
      await logout();
      toast.success("Logged out successfully");
    } finally {
      navigate("/");
    }
  };

  const handleNavigate = (path: string, param: string) => {
    onOpenChange(false);
    navigate(`${path}?category=${param}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full p-0 bg-card flex flex-col" style={{
        '--radius': '0.5rem',
      } as any}>
        <style>{`
          [role="dialog"] .absolute.right-4 {
            width: 32px;
            height: 32px;
          }
          [role="dialog"] .absolute.right-4 svg {
            color: #000000;
            width: 24px;
            height: 24px;
          }
        `}</style>
        <SheetHeader className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <GraduationCap className="h-8 w-8 text-foreground flex-shrink-0 mt-1" />
              <div>
                <SheetTitle className="text-2xl font-bold text-foreground text-left">StudentSync</SheetTitle>
                <p className="text-sm text-muted-foreground/60">complaint portal</p>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">

          {/* Menu Categories */}
          {menuItems.map(section => {
            const Icon = section.icon;
            const isActive = activeCategory === section.category;
            return (
              <div key={section.category} className="space-y-2">
                <div 
                  onClick={() => toggleCategory(section.category)} 
                  className={`p-4 cursor-pointer rounded-2xl transition-all duration-300 group ${isActive ? "menu-glossy menu-active-shadow text-menu-active-foreground" : "text-foreground hover:menu-glossy hover:menu-active-shadow hover:text-menu-active-foreground"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <Icon className={`h-7 w-7 transition-colors ${isActive ? "text-menu-active-foreground" : "text-menu-inactive-icon group-hover:text-white"}`} />
                         <div>
                        <h3 className="text-lg font-semibold">{section.category}</h3>
                        <p className={`text-xs ${isActive ? "text-white" : "text-muted-foreground/60 group-hover:text-white"}`}>{section.subtitle}</p>
                       </div>
                    </div>
                    {isActive ? <ChevronDown className="h-5 w-5 transition-colors" /> : <ChevronRight className="h-5 w-5 text-menu-inactive-icon transition-colors group-hover:text-white" />}
                  </div>
                </div>
                {isActive && (
                  <div className="ml-6 space-y-2 mt-1">
                    {section.subcategories.map(sub => (
                      <div 
                        key={sub.title} 
                        onClick={() => handleNavigate(sub.path, sub.param)} 
                        className="p-3 cursor-pointer text-foreground hover:bg-[#E8E8E8] rounded-lg transition-all flex items-center gap-3"
                      >
                        {sub.icon && <sub.icon className="h-5 w-5 text-menu-inactive-icon hover:text-white transition-colors" />}
                        <span className="text-sm font-semibold">{sub.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Messages & Profile - Below Categories */}
          <div className="space-y-2">
            <div
              onClick={() => { onOpenChange(false); navigate("/messages"); }}
              className="p-4 cursor-pointer rounded-2xl transition-all duration-300 text-foreground hover:menu-glossy hover:menu-active-shadow hover:text-menu-active-foreground"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-menu-inactive-icon hover:text-white transition-colors" />
                <h3 className="text-lg font-semibold">Messages</h3>
              </div>
            </div>

            <div
              onClick={() => { onOpenChange(false); navigate("/profile"); }}
              className="p-4 cursor-pointer rounded-2xl transition-all duration-300 text-foreground hover:menu-glossy hover:menu-active-shadow hover:text-menu-active-foreground"
            >
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-menu-inactive-icon hover:text-white transition-colors" />
                <h3 className="text-lg font-semibold">Profile</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card">
          <button
            onClick={handleLogout}
            className="w-auto px-4 py-2 cursor-pointer rounded-md transition-all duration-300 bg-card-dark text-card-dark-foreground hover:bg-card-dark/80 flex items-center gap-2 text-sm"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
