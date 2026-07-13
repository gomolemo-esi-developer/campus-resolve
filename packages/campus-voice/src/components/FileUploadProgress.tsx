import { useState } from "react";
import { FileText, Image, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { uploadFileToS3, type UploadResult } from "../lib/attachmentUpload";

interface UploadingFile {
   file: File;
   name: string;
   size: string;
   sizeBytes: number;
   type: 'pdf' | 'image' | 'document';
   progress: number;
   complete: boolean;
   error?: string;
   storageKey?: string;
   attachment?: Record<string, unknown>;
   s3Url?: string;
 }

export interface CompletedUploadFile {
   name: string;
   size: string;
   sizeBytes: number;
   type: 'pdf' | 'image' | 'document';
   url: string | null;
   storageKey?: string;
   attachment?: Record<string, unknown>;
   s3Url?: string;
  }

interface FileUploadProgressProps {
  files: UploadingFile[];
  onRemove: (index: number) => void;
}

export const FileUploadProgress = ({ files, onRemove }: FileUploadProgressProps) => {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2 pt-2">
      <p className="text-sm text-muted-foreground">Attachments ({files.length})</p>
      <div className="space-y-2">
        {files.map((file, index) => (
          <div 
            key={index}
            className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2"
          >
            {file.type === 'pdf' ? (
              <FileText className="h-5 w-5 text-destructive shrink-0" />
            ) : file.type === 'image' ? (
              <Image className="h-5 w-5 text-primary shrink-0" />
            ) : (
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-foreground truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{file.size}</span>
              </div>
              {!file.complete && (
                <div className="mt-1.5 flex items-center gap-2">
                  <Progress value={file.progress} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground w-8">{file.progress}%</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="hover:bg-muted rounded p-0.5 shrink-0"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const useFileUpload = (context: 'complaint' | 'note' | '' = '', contextId: string = '') => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileType = (file: File): 'pdf' | 'image' | 'document' => {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    return 'document';
  };

const performUpload = async (file: File, index: number) => {
      if (!context || !contextId) {
        setUploadingFiles(prev =>
          prev.map((f, i) => i === index ? { ...f, error: 'Waiting for context...' } : f)
        );
        return;
      }
      try {
        const result = await uploadFileToS3(file, context as 'complaint' | 'note', contextId, {
          onProgress: (progress) => {
            setUploadingFiles(prev =>
              prev.map((f, i) => i === index ? { ...f, progress } : f)
            );
          },
        });
        setUploadingFiles(prev =>
          prev.map((f, i) =>
            i === index
              ? { ...f, progress: 100, complete: true, storageKey: result.key, attachment: result.attachment, s3Url: result.s3Url }
              : f
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setUploadingFiles(prev =>
          prev.map((f, i) => i === index ? { ...f, error: message } : f)
        );
      }
    };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const startIndex = uploadingFiles.length;
      const newFiles: UploadingFile[] = Array.from(files).map(file => ({
        file,
        name: file.name,
        size: formatFileSize(file.size),
        sizeBytes: file.size,
        type: getFileType(file),
        progress: 0,
        complete: false,
      }));
      
      setUploadingFiles(prev => [...prev, ...newFiles]);
      
      // Trigger real S3 uploads (they will handle missing context gracefully)
      newFiles.forEach((newFile, idx) => {
        performUpload(newFile.file, startIndex + idx);
      });
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setUploadingFiles([]);
  };

const getCompletedFiles = () => {
      return uploadingFiles.filter(f => f.complete).map(f => ({
        name: f.name,
        size: f.size,
        sizeBytes: f.sizeBytes,
        type: f.type,
        url: f.s3Url || null, // Only use s3Url, not blob URLs
        storageKey: f.storageKey,
        attachment: f.attachment,
        s3Url: f.s3Url,
      })) as CompletedUploadFile[];
    };

  return {
    uploadingFiles,
    handleFileUpload,
    removeFile,
    clearFiles,
    getCompletedFiles,
  };
};
