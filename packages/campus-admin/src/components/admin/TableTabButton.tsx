interface TableTabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function TableTabButton({
  label,
  isActive,
  onClick,
  onKeyDown,
}: TableTabButtonProps) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${label}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`
        px-4 py-3 text-sm font-semibold whitespace-nowrap
        rounded-t-2xl relative transition-all duration-200 ease-out
        ${
          isActive
            ? "bg-primary text-primary-foreground shadow-lg -mb-[1px] z-10 scale-105"
            : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:scale-[1.02] hover:-translate-y-0.5"
        }
        before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[1px] before:transition-colors before:duration-200
        ${isActive ? "before:bg-primary" : "before:bg-transparent"}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
      `}
      style={{
        boxShadow: isActive
          ? "0 -4px 12px -2px rgba(255, 87, 34, 0.2), 0 -2px 4px -1px rgba(255, 87, 34, 0.1)"
          : "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      {label}
    </button>
  );
}
