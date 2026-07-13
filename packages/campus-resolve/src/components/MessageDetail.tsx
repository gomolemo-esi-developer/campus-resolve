import { FileText, Image, Download } from "lucide-react";
import { getDownloadUrl } from "../lib/attachmentUpload";
import type { MessageAttachment } from "@/contexts/ConversationsContext";
import { useState } from "react";

interface MessageDetailProps {
   subject: string;
   date: string;
   time: string;
   content: string;
   attachments?: MessageAttachment[];
   isSent?: boolean;
 }

 export const MessageDetail = ({ subject, date, time, content, attachments, isSent = false }: MessageDetailProps) => {
   const [loadingAttachmentId, setLoadingAttachmentId] = useState<string | null>(null);

    const handleDownload = async (attachment: MessageAttachment) => {
      try {
        let downloadUrl = attachment.url;

        const isValidHttpUrl = (url: string) => {
          try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
          } catch {
            return false;
          }
        };

        if (downloadUrl && !isValidHttpUrl(downloadUrl)) {
          downloadUrl = null;
        }

        if (!downloadUrl && (attachment.storageKey && !attachment.storageKey.startsWith('blob:') && !attachment.storageKey.startsWith('data:')) && attachment.id) {
          setLoadingAttachmentId(String(attachment.id));
          downloadUrl = await getDownloadUrl(String(attachment.id));
        }

        if (!downloadUrl && attachment.id) {
          setLoadingAttachmentId(String(attachment.id));
          downloadUrl = await getDownloadUrl(String(attachment.id));
        }

        if (downloadUrl) {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = attachment.name;
          link.click();
        } else {
          console.error('No valid download URL available for attachment:', attachment.name);
        }
      } catch (error) {
        console.error('Failed to download attachment:', error);
      } finally {
        setLoadingAttachmentId(null);
      }
    };

  return (
    <div className={`${isSent ? 'bg-[#E8F0FE]' : 'bg-[#FFFFFF]'} p-6 rounded-lg space-y-4 shadow-sm`}>
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-bold text-foreground">{subject}</h2>
        <span className="text-secondary font-medium text-sm">{date} {time}</span>
      </div>
      <p className="text-[#5F5F5F] leading-relaxed text-sm">{content}</p>

      {attachments && attachments.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-border">
          {attachments.map((attachment, index) => {
            const isLoading = loadingAttachmentId === String(attachment.id);
            
            return (
              <div
                key={index}
                className="flex items-center gap-3 text-foreground cursor-pointer hover:bg-secondary/5 rounded p-2 transition-colors"
                onClick={() => handleDownload(attachment)}
              >
                <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
                  {attachment.type === "pdf" ? (
                    <FileText className="w-4 h-4 text-background" />
                  ) : attachment.type === "image" ? (
                    <Image className="w-4 h-4 text-background" />
                  ) : (
                    <FileText className="w-4 h-4 text-background" />
                  )}
                </div>
                <span className="text-sm flex-1 truncate">{attachment.name}</span>
                {isLoading ? (
                  <span className="text-xs text-secondary">Loading...</span>
                ) : (
                  <Download className="w-4 h-4 text-secondary" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
