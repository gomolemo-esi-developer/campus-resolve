interface LevelDividerProps {
  label: string;
  note?: string;
}

export function LevelDivider({ label, note }: LevelDividerProps) {
  return (
    <div className="py-2 space-y-1.5 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-semibold tracking-wide text-gray-400 whitespace-nowrap">
          {label}
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      {note && (
        <p className="text-center text-xs text-muted-foreground">{note}</p>
      )}
    </div>
  );
}
