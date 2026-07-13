import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip, Plus, Send, X, FileText, StickyNote } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uploadFileToS3, getDownloadUrl } from "../lib/attachmentUpload";

interface FileAttachment {
   name: string;
   size?: number;
   type: 'pdf' | 'image' | 'excel' | 'word' | 'document';
   progress: number;
   storageKey?: string;
   id?: string;
   error?: string;
   url?: string;
   s3_url?: string;
  }

interface ComposeAreaProps {
    complaintId?: string;
    quickNotes?: Array<{
      id: string;
      subject: string;
      description: string;
    }>;
     quickFiles?: Array<{
       id: string;
       name: string;
       type: "image" | "pdf" | "excel" | "word" | "document";
       storageKey?: string;
       size?: number;
       thumbnail?: string;
       s3_url?: string;
     }>;
onSendMessage: (message: {
       subject: string;
       content: string;
       attachments: Array<{ type: "pdf" | "image" | "excel" | "word" | "document" ; name: string; url?: string; storageKey?: string; size?: number; s3_url?: string; id?: string }>;
     }) => void;
  }

export const ComposeArea = ({ 
   complaintId,
   quickNotes = [],
   quickFiles = [],
   onSendMessage
 }: ComposeAreaProps) => {
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNoteSelect = (noteText: string) => {
    setMessageText(prev => prev + (prev ? "\n\n" : "") + noteText);
    setIsPopoverOpen(false);
    textareaRef.current?.focus();
  };

  const handleFileSelect = (file: { name: string; type: string; storageKey?: string; size?: number; thumbnail?: string; id?: string; s3_url?: string }) => {
    const fileType = file.type === 'image' ? 'image' : file.type === 'pdf' ? 'pdf' : file.type === 'excel' ? 'excel' : file.type === 'word' ? 'word' : 'document';
    setAttachments(prev => [...prev, {
      name: file.name,
      type: fileType,
      size: file.size,
      progress: 100,
      storageKey: file.storageKey,
      id: file.id,
      url: file.s3_url || file.thumbnail,
      s3_url: file.s3_url,
    }]);
    setIsPopoverOpen(false);
  };

const getFileCategory = (file: File): 'pdf' | 'image' | 'excel' | 'word' | 'document' => {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.includes('sheet') || file.type.includes('excel')) return 'excel';
    if (file.type.includes('word') || file.type === 'application/msword') return 'word';
    return 'document';
  };

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
   const files = e.target.files;
   if (!files) return;

   Array.from(files).forEach(async (file) => {
     const fileType = getFileCategory(file);
     const newAttachment: FileAttachment = {
       name: file.name,
       type: fileType,
       size: file.size,
       progress: 0
     };
     
     setAttachments(prev => [...prev, newAttachment]);

     try {
       const result = await uploadFileToS3(file, 'complaint', complaintId || 'unknown', {
         onProgress: (progress) => {
           setAttachments(prev => 
             prev.map(att => 
               att.name === file.name && !att.storageKey ? { ...att, progress } : att
             )
           );
         },
       });

setAttachments(prev => 
          prev.map(att => 
            att.name === file.name ? { 
              ...att, 
              progress: 100,
              storageKey: result.key,
              url: result.s3Url || (result.attachment?.file_path as string | undefined),
              id: result.attachment?.id as string | undefined,
            } : att
          )
        );
     } catch (error) {
       console.error('Upload failed:', error);
       setAttachments(prev => 
         prev.map(att => 
           att.name === file.name ? { ...att, progress: 0, error: 'Upload failed' } : att
         )
       );
     }
   });

   if (fileInputRef.current) {
     fileInputRef.current.value = '';
   }
 };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

const handleSend = () => {
      // Check if any files are still uploading
      const stillUploading = attachments.some(att => att.progress < 100);
      if (stillUploading) {
        alert('Please wait for all files to finish uploading');
        return;
      }
      
      if (!messageText.trim() && attachments.length === 0) return;

      onSendMessage({
        subject: subject.trim(),
        content: messageText.trim(),
        attachments: attachments.map(att => ({
          type: att.type,
          name: att.name,
          url: att.url,
          storageKey: att.storageKey,
          size: att.size,
          s3_url: att.s3_url,
          id: att.id,
        }))
      });

      // Clear form
      setSubject("");
      setMessageText("");
      setAttachments([]);
    };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <div className="w-10 h-10 bg-accent rounded flex items-center justify-center text-background font-bold text-[10px]">PDF</div>;
      case "excel":
        return <div className="w-10 h-10 bg-green-600 rounded flex items-center justify-center text-background">
          <FileText className="w-5 h-5" />
        </div>;
      case "image":
        return <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-background">
          <FileText className="w-5 h-5" />
        </div>;
      case "word":
        return <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-background">
          <FileText className="w-5 h-5" />
        </div>;
      case "document":
        return <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center text-background">
          <FileText className="w-5 h-5" />
        </div>;
      default:
        return <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center text-background">
          <FileText className="w-5 h-5" />
        </div>;
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + 
           now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="bg-background rounded-lg space-y-4">
      {/* Subject Input with Border and Date */}
      <div className="flex items-center justify-between gap-6">
        <div className="border border-[#E8E8E8] rounded-2xl px-3 flex-1" style={{ borderWidth: "0.25px" }}>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject Line"
            className="w-full text-sm font-medium text-foreground bg-transparent !border-none outline-none placeholder:text-[#5F5F5F] p-0"
          />
        </div>
        <span className="text-secondary font-medium text-sm">{getCurrentDateTime()}</span>
      </div>

        {/* Textarea */}
      <Textarea 
        ref={textareaRef}
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter Message" 
        className="min-h-[120px] text-sm resize-none !border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
      />

      {/* File Attachments */}
      {attachments && attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((file, index) => (
            <div 
              key={index} 
              className="bg-secondary/10 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary/70">{file.name}</span>
                <button 
                  onClick={() => handleRemoveAttachment(index)}
                  className="text-secondary/70 hover:text-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-secondary/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
                <span className="text-xs text-secondary font-medium">{file.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf"
        />
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="text-secondary hover:text-secondary hover:bg-secondary/10"
        >
          <Paperclip className="w-5 h-5" />
        </Button>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-secondary hover:text-secondary hover:bg-secondary/10"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            side="top" 
            align="center"
            className="w-80 p-0 animate-slide-in-bottom !border-none shadow-sm"
            sideOffset={8}
            style={{ boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="p-3">
              <h4 className="font-semibold text-sm text-foreground">Quick Notes & Files</h4>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="p-2 space-y-1">
                {/* Quick Notes */}
                {quickNotes.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Notes</div>
                    {quickNotes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => handleNoteSelect(note.description)}
                        className="w-full flex items-start gap-3 p-2.5 rounded-md hover:bg-secondary/10 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <StickyNote className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">{note.subject}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {note.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* Quick Files */}
                {quickFiles.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2">Files</div>
                    {quickFiles.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => handleFileSelect(file)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-secondary/10 transition-colors text-left group"
                      >
{file.type === "image" && (file.thumbnail || file.s3_url) ? (
                           <img 
                             src={file.thumbnail || file.s3_url} 
                             alt={file.name}
                             className="w-10 h-10 rounded object-cover flex-shrink-0"
                           />
                         ) : (
                           getFileIcon(file.type)
                         )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">{file.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{file.type}</div>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {quickNotes.length === 0 && quickFiles.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No quick notes or files available
                  </div>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
<Button 
           variant="ghost" 
           size="icon"
           onClick={handleSend}
           disabled={(!messageText.trim() && attachments.length === 0) || attachments.some(a => a.progress < 100)}
           className="text-secondary hover:text-secondary hover:bg-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed"
         >
           <Send className="w-5 h-5" />
         </Button>
      </div>
    </div>
  );
};
