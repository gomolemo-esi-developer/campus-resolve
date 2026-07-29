import { BookOpen, Users, LucideIcon } from "lucide-react";

export interface MenuSubcategory {
  title: string;
  path: string;
  param: string;
  icon: LucideIcon;
}

export interface MenuCategory {
  category: string;
  subtitle: string;
  icon: LucideIcon;
  subcategories: MenuSubcategory[];
}

export const menuItems: MenuCategory[] = [
  {
    category: "General",
    subtitle: "Student & Campus",
    icon: Users,
    subcategories: [
      { title: "Student Services", path: "/complaint", param: "student-services", icon: Users },
      { title: "Campus Facilities", path: "/complaint", param: "campus-facilities", icon: Users },
    ],
  },
  {
    category: "Academic",
    subtitle: "Courses & Learning",
    icon: BookOpen,
    subcategories: [
      { title: "Course Complaint", path: "/complaint", param: "course-complaint", icon: BookOpen },
      { title: "Timetable", path: "/complaint", param: "timetable", icon: BookOpen },
      { title: "Lecture Hall | Lab", path: "/complaint", param: "lecture-hall-lab", icon: BookOpen },
      { title: "Report Staff", path: "/complaint", param: "report-staff", icon: BookOpen },
    ],
  },
];
