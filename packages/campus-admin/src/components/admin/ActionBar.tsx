import { Button } from "@/components/ui/button";
import { X, Pencil, Trash2 } from "lucide-react";

interface ActionBarProps {
    selectedCount: number;
    onClear: () => void;
    onEdit?: () => void;
    onDelete: () => void;
    canEdit?: boolean;
}

export function ActionBar({
    selectedCount,
    onClear,
    onEdit,
    onDelete,
    canEdit = selectedCount === 1,
}: ActionBarProps) {
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-in slide-in-from-bottom-4">
            <div className="bg-foreground text-background rounded-full px-6 py-4 flex items-center gap-4 shadow-2xl">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full hover:bg-background/10 text-background"
                    onClick={onClear}
                    aria-label="Clear selection"
                >
                    <X className="h-5 w-5" />
                </Button>

                {canEdit && onEdit && (
                    <Button
                        variant="ghost"
                        className="h-10 px-6 rounded-full hover:bg-background/10 text-background gap-2"
                        onClick={onEdit}
                    >
                        <Pencil className="h-4 w-4" />
                        Edit
                    </Button>
                )}

                <Button
                    className="h-10 px-6 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4" />
                    Delete
                </Button>
            </div>
        </div>
    );
}
