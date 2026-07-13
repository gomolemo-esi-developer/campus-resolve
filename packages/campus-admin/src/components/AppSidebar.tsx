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
      <nav className="py-6">
        {menuItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.path}
            end={item.path === "/"}
            className="flex items-center gap-3 px-6 py-3 text-sidebar-foreground hover:text-foreground transition-colors rounded-none"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-[15px]">{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
