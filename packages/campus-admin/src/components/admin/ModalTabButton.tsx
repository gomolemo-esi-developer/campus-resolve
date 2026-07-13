interface ModalTabButtonProps {
    label?: string;
    qualType?: string;
    isActive: boolean;
    onClick: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    disabled?: boolean;
}

export function ModalTabButton({ label, qualType, isActive, onClick, onKeyDown, disabled = false }: ModalTabButtonProps) {
    const displayText = label || qualType;
    return (
        <button
            role="tab"
            id={`tab-${displayText}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${displayText}`}
            tabIndex={isActive ? 0 : -1}
            onClick={onClick}
            onKeyDown={onKeyDown}
            disabled={disabled}
            className={`
        px-4 py-3 font-medium transition-all duration-300 ease-out relative
        rounded-t-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${isActive
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
        >
            <span className="whitespace-nowrap text-sm">{displayText}</span>
            {isActive && (
                <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-300 ease-out"
                    style={{
                        animation: "scaleInX 0.3s ease-out forwards",
                        transformOrigin: "left"
                    }}
                />
            )}
        </button>
    );
}
