import { useState } from "react";
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

interface AddNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (subject: string, content: string, links: NoteLinkInput[]) => void;
}

export const AddNoteModal = ({ open, onOpenChange, onSave }: AddNoteModalProps) => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [links, setLinks] = useState<NoteLinkInput[]>([]);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const handleSave = () => {
    // Allow save if:
    // 1. Subject is provided, OR
    // 2. At least one link is added
    const canSave = subject.trim() || links.length > 0;
    
    if (canSave) {
      onSave(subject, content, links);
      resetForm();
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setSubject("");
    setContent("");
    setLinks([]);
    setLinkLabel("");
    setLinkUrl("");
  };

  const addLink = () => {
    if (!linkUrl.trim()) return;
    
    // Normalize URL to ensure it has protocol
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const canSave = subject.trim() || links.length > 0;
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canSave) {
      handleSave();
    }
  };

  const canSave = subject.trim() || links.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Add Note</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto" onKeyDown={handleKeyDown}>
          {/* Subject Line */}
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

          {/* Note Content */}
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

          {/* Embedded Links Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Embedded Links
            </Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              <Button 
                type="button" 
                variant="outline" 
                onClick={addLink} 
                disabled={!linkUrl.trim()}
              >
                Add Link
              </Button>
            </div>

            {/* Links List */}
            {links.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto rounded-md border p-2">
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
            className="border-foreground/25 text-foreground transition-all duration-200 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="bg-foreground hover:bg-foreground/90 text-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
