interface UserCardProps {
  name: string;
  studentId: string;
  department: string;
  location: string;
  initials: string;
}

export const UserCard = ({ name, studentId, department, location, initials }: UserCardProps) => {
  return (
    <div className="bg-background p-6 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-lg bg-foreground text-background flex items-center justify-center text-2xl font-bold shadow-sm">
          {initials}
        </div>

        {/* User Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 flex-1">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-light">Full Name</p>
            <p className="text-base font-normal text-foreground">{name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-light">Student Number</p>
            <p className="text-base font-normal text-foreground">{studentId}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-light">Module Name</p>
            <p className="text-base font-normal text-foreground">{department}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-light">Campus</p>
            <p className="text-base font-normal text-foreground">{location}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
