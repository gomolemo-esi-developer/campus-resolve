import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, FileText } from "lucide-react";
import { AttachFileModal } from "@/components/AttachFileModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface FileItem {
  id: string;
  name: string;
  title?: string;
  type: "image" | "pdf" | "excel";
  thumbnail?: string;
}

export const FilesSection = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);

  const handleUploadFiles = (uploadedFiles: Array<{ file: File; title?: string }>) => {
    const newFiles: FileItem[] = uploadedFiles.map((fileData) => {
      let type: "image" | "pdf" | "excel" = "pdf";
      
      if (fileData.file.type.startsWith("image/")) {
        type = "image";
      } else if (fileData.file.type.includes("sheet") || fileData.file.type.includes("excel")) {
        type = "excel";
      }

      return {
        id: Date.now().toString() + Math.random(),
        name: fileData.file.name,
        title: fileData.title,
        type,
        thumbnail: type === "image" ? URL.createObjectURL(fileData.file) : undefined,
      };
    });

    setFiles([...newFiles, ...files]);
    toast({
      title: `${uploadedFiles.length} file(s) uploaded`,
      description: "Your files have been attached successfully.",
    });
  };

  const handleDeleteFile = () => {
    if (deleteFileId) {
      setFiles(files.filter(file => file.id !== deleteFileId));
      toast({
        title: "File deleted",
        description: "The file has been removed.",
      });
      setDeleteFileId(null);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <div className="w-12 h-12 bg-accent rounded flex items-center justify-center text-background font-bold text-xs">PDF</div>;
      case "excel":
        return <div className="w-12 h-12 bg-green-600 rounded flex items-center justify-center text-background">
          <FileText className="w-6 h-6" />
        </div>;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Files</h2>
        <Button 
          onClick={() => setIsAttachModalOpen(true)}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add File
        </Button>
      </div>

      <AttachFileModal
        open={isAttachModalOpen}
        onOpenChange={setIsAttachModalOpen}
        onUpload={handleUploadFiles}
      />

      <AlertDialog open={deleteFileId !== null} onOpenChange={() => setDeleteFileId(null)}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete File</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="transition-all duration-200 hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFile}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all duration-200"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Files List */}
      <div className="space-y-3">
        {files.map((file) => (
          <div 
            key={file.id} 
            className="flex items-center gap-4 p-4 bg-background border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in"
          >
            <div className="flex-shrink-0">
              {file.type === "image" ? (
                <img src={file.thumbnail} alt={file.name} className="w-12 h-12 object-cover rounded shadow-sm" />
              ) : (
                getFileIcon(file.type)
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">{file.title || file.name}</p>
              {file.title && (
                <p className="text-xs text-muted-foreground truncate">{file.name}</p>
              )}
            </div>
            <Button 
              size="icon" 
              onClick={() => setDeleteFileId(file.id)}
              className="bg-foreground hover:bg-foreground/90 text-background rounded-lg h-10 w-10 transition-all duration-200 hover:scale-105 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
