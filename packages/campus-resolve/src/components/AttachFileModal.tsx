import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileWithPreview {
  file: File;
  preview?: string;
  id: string;
  title?: string;
}

interface AttachFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: Array<{ file: File; title?: string }>) => void;
}

export const AttachFileModal = ({ open, onOpenChange, onUpload }: AttachFileModalProps) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="w-8 h-8 text-primary" />;
    } else if (type.includes("pdf")) {
      return <div className="w-10 h-10 bg-accent rounded flex items-center justify-center text-accent-foreground font-bold text-xs">PDF</div>;
    } else if (type.includes("sheet") || type.includes("excel")) {
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
    }
    return <FileText className="w-8 h-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: FileWithPreview[] = Array.from(fileList).map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const updateFileTitle = (id: string, title: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, title } : f))
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    // Simulate upload delay
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      
      setTimeout(() => {
        onUpload(files.map((f) => ({ file: f.file, title: f.title || undefined })));
        handleCancel();
      }, 500);
    }, 1500);
  };

  const handleCancel = () => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setUploadProgress(0);
    setIsUploading(false);
    onOpenChange(false);
  };

  const isValid = files.length > 0 && !isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Attach File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
              isDragging
                ? "border-foreground bg-foreground/5 scale-[1.02]"
                : "border-gray-200 hover:border-foreground/40 hover:bg-gray-50"
            )}
          >
            <Upload className={cn(
              "w-12 h-12 mx-auto mb-4 transition-colors duration-200",
              isDragging ? "text-foreground" : "text-gray-400"
            )} />
            <p className="text-sm font-medium text-foreground mb-1">
              Drag and drop files here
            </p>
            <p className="text-xs text-gray-400">
              or click to browse (images, PDFs, Excel, etc.)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            accept="image/*,.pdf,.xls,.xlsx,.doc,.docx"
          />

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {files.map((fileItem) => (
                <>
                  {/* Title Input - Outside the file container */}
                  <div className="w-full" key={`${fileItem.id}-title`}>
                    <Label className="text-sm font-semibold text-foreground">
                      Title
                    </Label>
                    <Input
                      placeholder="Title (optional)"
                      value={fileItem.title || ''}
                      onChange={(e) => {
                        updateFileTitle(fileItem.id, e.target.value);
                      }}
                      className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  
                  {/* File Item Container */}
                  <div key={`${fileItem.id}-file`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                    {fileItem.preview ? (
                      <img
                        src={fileItem.preview}
                        alt={fileItem.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="flex-shrink-0">
                        {getFileIcon(fileItem.file.type)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileItem.id);
                      }}
                      className="flex-shrink-0 h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Uploading...</span>
                <span className="text-foreground font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
            className="border-foreground/25 text-foreground transition-all duration-200 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!isValid}
            className="bg-foreground hover:bg-foreground/90 text-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload {files.length > 0 && `(${files.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
