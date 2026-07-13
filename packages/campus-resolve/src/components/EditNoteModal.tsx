import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link2, Trash2 } from "lucide-react";

interface NoteLinkInput {
  id: string;
  label: string;
  url: string;
}

interface EditNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (subject: string, content: string, links: NoteLinkInput[]) => void;
  initialSubject: string;
  initialContent: string;
  initialLinks?: NoteLinkInput[];
}

export const EditNoteModal = ({
  open,
  onOpenChange,
  onSave,
  initialSubject,
  initialContent,
  initialLinks = [],
}: EditNoteModalProps) => {
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState(initialContent);
  const [links, setLinks] = useState<NoteLinkInput[]>(initialLinks);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    if (open) {
      setSubject(initialSubject);
      setContent(initialContent);
      setLinks(initialLinks);
      setLinkLabel("");
      setLinkUrl("");
    }
  }, [open, initialSubject, initialContent, initialLinks]);

  const handleSave = () => {
    if (subject.trim()) {
      onSave(subject, content, links);
      onOpenChange(false);
    }
  };

  const addLink = () => {
    if (!linkUrl.trim()) return;
    
    const normalized = linkUrl.startsWith('http://') || linkUrl.startsWith('https://')
      ? linkUrl
      : `https://${linkUrl}`;

    setLinks((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: linkLabel.trim() || normalized,
        url: normalized,
      },
    ]);
    setLinkLabel("");
    setLinkUrl("");
  };

  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent default only for specific shortcuts, not regular typing
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && subject.trim()) {
      e.preventDefault();
      handleSave();
    }
  };

  const isValid = subject.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Edit Note</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto" onKeyDown={handleKeyDown}>
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-semibold text-foreground">
              Subject Line <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="transition-all duration-200 focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-semibold text-foreground">
              Note Content
            </Label>
            <Textarea
              id="content"
              placeholder="Write your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] transition-all duration-200 focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Embedded Links
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                placeholder="Label (optional)"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-ring"
              />
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={addLink} disabled={!linkUrl.trim()}>
                Add Link
              </Button>
            </div>

            {links.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-auto rounded-md border p-2">
                {links.map((link) => (
                  <div 
                    key={link.id} 
                    className="flex items-center justify-between gap-2 text-sm p-2 bg-muted/30 rounded"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{link.label}</p>
                      <p className="text-muted-foreground truncate text-xs">{link.url}</p>
                    </div>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => removeLink(link.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="transition-all duration-200 hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
