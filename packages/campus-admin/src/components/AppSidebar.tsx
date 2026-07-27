import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Briefcase,
  School,
  Trophy,
  Shield,
  Users,
  Home,
  Book,
  GraduationCap,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    title: "Campus",
    icon: Building2,
    path: "/campus",
  },
  {
    title: "Course",
    icon: BookOpen,
    path: "/course",
  },
  {
    title: "Department",
    icon: Briefcase,
    path: "/department",
  },
  {
    title: "Faculty",
    icon: School,
    path: "/faculty",
  },
  {
    title: "Module",
    icon: Book,
    path: "/module",
  },
  {
    title: "Extracurricular",
    icon: Trophy,
    path: "/extracurricular",
  },
  {
    title: "Roles",
    icon: Shield,
    path: "/roles",
  },
  {
    title: "Staff",
    icon: Users,
    path: "/staff",
  },
  {
    title: "Students",
    icon: GraduationCap,
    path: "/students",
  },
  {
    title: "Residence",
    icon: Home,
    path: "/residence",
  },
];

export function AppSidebar() {
  return (
    <aside className="w-[270px] bg-sidebar border-r border-sidebar-border/50 flex-shrink-0 h-screen sticky top-0">
      <nav className="py-6 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.path}
            end={item.path === "/"}
            className="relative flex items-center gap-3 pl-6 pr-5 py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-0 after:w-1 after:rounded-l-full after:bg-sidebar-primary after:transition-all"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold hover:bg-sidebar-accent hover:text-sidebar-primary after:h-8"
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-[15px]">{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
