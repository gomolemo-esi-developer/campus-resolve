import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, X, Link2, ExternalLink } from "lucide-react";

interface NoteLink {
  id: string;
  label: string;
  url: string;
}

interface ViewNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  content: string;
  date: string;
  links?: NoteLink[];
  onEdit: () => void;
}

export const ViewNoteModal = ({
  open,
  onOpenChange,
  subject,
  content,
  date,
  links = [],
  onEdit,
}: ViewNoteModalProps) => {
  const handleEdit = () => {
    onOpenChange(false);
    onEdit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg animate-scale-in">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold text-foreground break-words">
                {subject}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{date}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleEdit}
              className="flex-shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Content Section */}
        {content && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          </div>
        )}

        {/* Embedded Links Section */}
        {links.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Link2 className="w-3 h-3" />
              Attached Links
            </p>
            <div className="space-y-2">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <Link2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-primary hover:underline break-all flex-1">
                    {link.label || link.url}
                  </span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
