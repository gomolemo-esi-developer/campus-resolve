import { useState } from "react";
import { cn } from "@/lib/utils";

interface Level {
  level: number;
  roles: {
    research?: string;
    undergraduate?: string;
    nonAcademic?: string;
  };
}

const escalationLevels: Level[] = [
  {
    level: 1,
    roles: {
      research: "Supervisor",
      undergraduate: "Lecturer",
      nonAcademic: "Facilitator/Secretary"
    }
  },
  {
    level: 2,
    roles: {
      research: "Departmental Research Chair",
      undergraduate: "Cluster Group Leader",
      nonAcademic: "Director/Manager"
    }
  },
  {
    level: 3,
    roles: {
      research: "Section Head",
      undergraduate: "Department Admin",
      nonAcademic: "Department Admin"
    }
  },
  {
    level: 4,
    roles: {
      research: "Head of Department",
      undergraduate: "Head of Department",
      nonAcademic: "Head of Department"
    }
  },
  {
    level: 5,
    roles: {
      research: "Research Officer",
      undergraduate: "Research Officer",
      nonAcademic: "Research Officer"
    }
  },
  {
    level: 6,
    roles: {
      research: "Assistant Dean",
      undergraduate: "Assistant Dean",
      nonAcademic: "Assistant Dean"
    }
  },
  {
    level: 7,
    roles: {
      research: "Executive Dean",
      undergraduate: "Executive Dean",
      nonAcademic: "Executive Dean"
    }
  }
];

type ComplaintType = "research" | "undergraduate" | "nonAcademic";

const EscalationHierarchy = () => {
  const [activeType, setActiveType] = useState<ComplaintType>("research");

  const typeLabels: Record<ComplaintType, string> = {
    research: "Research (Academic)",
    undergraduate: "Undergraduate (Academic)",
    nonAcademic: "Non-Academic"
  };

  const getRole = (level: Level) => {
    return level.roles[activeType] || "unknown";
  };

  return (
    <section id="escalation" className="py-24 px-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <p className="text-label mb-3">Escalation Process</p>
          <h2 className="text-headline text-3xl md:text-4xl text-foreground mb-4">
            Clear Hierarchy for Accountability
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Complaints follow a structured 7-level escalation path at TUT, ensuring issues reach the right authority.
          </p>
        </div>

        {/* Type Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-16">
          {(Object.keys(typeLabels) as ComplaintType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border",
                activeType === type
                  ? "bg-foreground text-background border-foreground shadow-lg"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>

        {/* Escalation Visual - Flowing Node Design */}
        <div className="relative px-2 md:px-0">
          {/* Central flowing line with gradient - desktop only */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/80 via-foreground/40 to-primary/30" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot opacity-80" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-foreground/60 animate-pulse-dot" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-2/3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-foreground/40 animate-pulse-dot" style={{ animationDelay: '1s' }} />
          </div>

          {/* Levels */}
          <div className="space-y-2 md:space-y-3">
            {escalationLevels.map((level, index) => {
              const isEven = index % 2 === 0;
              return (
                <div
                  key={level.level}
                  className="relative flex items-center gap-4 md:grid md:grid-cols-[1fr,auto,1fr] md:gap-6 py-1 md:py-2"
                >
                  {/* Left content (even items - desktop only) */}
                  <div className={cn("hidden md:flex md:justify-end", !isEven && "md:invisible")}>
                    <div 
                      className="inline-flex items-center gap-3 bg-card rounded-2xl px-5 py-3 shadow-sm border border-border/40 transition-all duration-300 hover:shadow-md hover:border-foreground/20 hover:-translate-x-1 group animate-fade-in opacity-0"
                      style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'forwards' }}
                    >
                      <span className="text-foreground font-medium group-hover:text-foreground/80 transition-colors">
                        {getRole(level)}
                      </span>
                      <div className="w-6 h-px bg-gradient-to-r from-transparent to-foreground/30" />
                    </div>
                  </div>

                  {/* Center node */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    {/* Connector line to card (desktop) */}
                    <div className={cn(
                      "hidden md:block absolute top-1/2 -translate-y-1/2 h-px w-6 bg-gradient-to-r",
                      isEven ? "right-[calc(50%+20px)] from-foreground/20 to-foreground/40" : "left-[calc(50%+20px)] from-foreground/40 to-foreground/20"
                    )} />
                    
                    {/* Main node */}
                    <div 
                      className={cn(
                        "relative w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer group",
                        "bg-gradient-to-br from-foreground to-foreground/80 text-background",
                        "hover:scale-110 hover:shadow-lg hover:shadow-foreground/20",
                        "ring-3 md:ring-4 ring-background shadow-sm"
                      )}
                    >
                      <span className="font-bold text-xs md:text-sm">{level.level}</span>
                      <div className="absolute inset-0 rounded-full border-2 border-primary/0 group-hover:border-primary/40 group-hover:scale-125 transition-all duration-500" />
                    </div>
                    
                    {/* Small connector dots between levels */}
                    {index < escalationLevels.length - 1 && (
                      <div className="hidden md:flex flex-col items-center gap-1.5 py-2">
                        <span className="w-1 h-1 rounded-full bg-foreground/30" />
                        <span className="w-0.5 h-0.5 rounded-full bg-foreground/20" />
                      </div>
                    )}
                  </div>

                  {/* Right content (odd items - desktop) / All items (mobile) */}
                  <div className={cn("flex-1 md:flex", isEven && "md:invisible")}>
                    <div 
                      className="inline-flex items-center gap-3 bg-card rounded-xl md:rounded-2xl px-4 py-2.5 md:px-5 md:py-3 shadow-sm border border-border/40 transition-all duration-300 hover:shadow-md hover:border-foreground/20 md:hover:translate-x-1 group animate-fade-in opacity-0"
                      style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'forwards' }}
                    >
                      <div className="hidden md:block w-6 h-px bg-gradient-to-r from-foreground/30 to-transparent" />
                      <span className="text-foreground text-sm md:text-base font-medium group-hover:text-foreground/80 transition-colors">
                        {getRole(level)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Final Resolution indicator */}
          <div className="flex justify-center mt-12">
            <div className="relative">
              {/* Connecting line from last node */}
              <div className="absolute left-1/2 -top-6 w-px h-6 bg-gradient-to-b from-foreground/30 to-primary/50 -translate-x-1/2" />
              
              <div className="flex items-center gap-4 bg-gradient-to-r from-foreground/5 via-primary/10 to-foreground/5 backdrop-blur-sm px-6 py-3 rounded-full border border-primary/20 shadow-sm">
                <div className="flex gap-1.5">
                  {[...Array(3)].map((_, i) => (
                    <span 
                      key={i} 
                      className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce-dot"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="font-semibold text-foreground">Final Resolution</span>
                <div className="w-3 h-3 rounded-full bg-primary shadow-sm shadow-primary/30 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EscalationHierarchy;
