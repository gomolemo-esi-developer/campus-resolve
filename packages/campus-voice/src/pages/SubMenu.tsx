import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MessageButton } from "@/components/MessageButton";
import { ChevronRight, AlertCircle, Flag, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";

const subMenuItems: Record<string, Array<{ title: string; subtitle: string; icon: any }>> = {
  "student-services": [
    { title: "Financial Aid", subtitle: "Bursary and funding queries", icon: AlertCircle },
    { title: "Registration", subtitle: "Registration issues", icon: Flag },
    { title: "General Inquiry", subtitle: "Other student services", icon: MessageSquare },
  ],
  "campus-facilities": [
    { title: "Library", subtitle: "Library-related issues", icon: AlertCircle },
    { title: "IT Services", subtitle: "Technology problems", icon: Flag },
    { title: "Security", subtitle: "Campus safety concerns", icon: MessageSquare },
  ],
  "course-complaints": [
    { title: "Lecturer Issue", subtitle: "Report lecturer concerns", icon: AlertCircle },
    { title: "Course Content", subtitle: "Curriculum feedback", icon: Flag },
    { title: "Assessment", subtitle: "Assignment and test issues", icon: MessageSquare },
  ],
  examination: [
    { title: "Exam Timetable", subtitle: "Schedule conflicts", icon: AlertCircle },
    { title: "Special Requirements", subtitle: "Accommodation requests", icon: Flag },
    { title: "Results Query", subtitle: "Mark disputes", icon: MessageSquare },
  ],
};

const SubMenu = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const items = category ? subMenuItems[category] || [] : [];

  return (
    <div className="min-h-screen bg-background">
      <Header title="Choose Category" />

      <div className="p-6 space-y-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.title}
              onClick={() => navigate("/complaint")}
              className="p-4 cursor-pointer bg-card hover:bg-accent/5 transition-colors border border-border"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Icon className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          );
        })}
      </div>

      <MessageButton />
    </div>
  );
};

export default SubMenu;
