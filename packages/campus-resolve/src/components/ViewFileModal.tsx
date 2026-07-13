import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, ExternalLink } from "lucide-react";
import { useState } from "react";

interface ViewFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  fileType: "image" | "pdf" | "excel" | "word" | "document";
  thumbnail?: string;
  date: string;
  fileId?: string;
  onDownload?: (fileId: string) => Promise<unknown>;
}

export const ViewFileModal = ({
  open,
  onOpenChange,
  name,
  fileType,
  thumbnail,
  date,
  fileId,
  onDownload,
}: ViewFileModalProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const getFileIcon = () => {
    switch (fileType) {
      case "pdf":
        return (
          <div className="w-24 h-24 bg-accent rounded-lg flex items-center justify-center text-background font-bold text-2xl">
            PDF
          </div>
        );
      case "excel":
        return (
          <div className="w-24 h-24 bg-green-600 rounded-lg flex items-center justify-center text-background">
            <FileText className="w-12 h-12" />
          </div>
        );
      case "word":
        return (
          <div className="w-24 h-24 bg-blue-600 rounded-lg flex items-center justify-center text-background">
            <FileText className="w-12 h-12" />
          </div>
        );
      case "document":
        return (
          <div className="w-24 h-24 bg-gray-600 rounded-lg flex items-center justify-center text-background">
            <FileText className="w-12 h-12" />
          </div>
        );
      default:
        return (
          <div className="w-24 h-24 bg-gray-600 rounded-lg flex items-center justify-center text-background">
            <FileText className="w-12 h-12" />
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl animate-scale-in">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold text-foreground break-words">
            {name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{date}</p>
        </DialogHeader>

        <div className="mt-4">
          {fileType === "image" && thumbnail ? (
            <div className="relative rounded-lg overflow-hidden bg-muted/30 border border-border/50">
              <img
                src={thumbnail}
                alt={name}
                className="w-full max-h-[60vh] object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-muted/30 rounded-lg border border-border/50">
              {getFileIcon()}
              <p className="mt-4 text-foreground font-medium text-center">{name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {fileType === "pdf" ? "PDF Document" : 
                 fileType === "excel" ? "Excel Spreadsheet" : 
                 fileType === "word" ? "Word Document" : 
                 "Document"}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          {fileType === "image" && thumbnail && (
            <Button
              variant="outline"
              onClick={() => window.open(thumbnail, "_blank")}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Full Size
            </Button>
          )}
          <Button
            className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            disabled={isDownloading}
            onClick={async () => {
              // Use the download API for proper S3 presigned URLs
              if (fileId && onDownload) {
                setIsDownloading(true);
                try {
                  const result = await onDownload(fileId) as { downloadUrl?: string } | null;
                  if (result?.downloadUrl) {
                    const link = document.createElement("a");
                    link.href = result.downloadUrl;
                    link.download = name;
                    link.click();
                  }
                } catch (error) {
                  console.error("Download failed:", error);
                } finally {
                  setIsDownloading(false);
                }
              }
            }}
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
