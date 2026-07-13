import { useState, useEffect, useCallback, useRef } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, FileText, Image, Download } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useMessages, useComplaints } from "@/hooks";
import type { AttachmentPayload } from "@/hooks/useMessages";
import { FileUploadProgress, useFileUpload } from "@/components/FileUploadProgress";
import { toast } from "sonner";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileDrawer } from "@/components/MobileDrawer";
import { Spinner } from "@/components/ui/spinner";
import { getDownloadUrl, getDownloadUrlByKey } from "@/lib/attachmentUpload";

interface Attachment {
   name: string;
   size: string | number;
   type: string;
   url?: string | null;
   id?: string | number;
   storageKey?: string;
   s3Url?: string;
 }

interface LooseAttachment {
  [key: string]: unknown;
}

const asAttachmentRecord = (value: unknown): LooseAttachment => {
  return value && typeof value === 'object' ? (value as LooseAttachment) : {};
};

const MessageDetail = () => {
   const navigate = useNavigate();
   const { id } = useParams();
   const { fetchComplaint, currentComplaint, loading: complaintsLoading } = useComplaints();
   const { fetchThread, messages, addReply, loading: messagesLoading } = useMessages();
   const [replyText, setReplyText] = useState("");
   const [replySubject, setReplySubject] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [uploadContextId, setUploadContextId] = useState(id || '');
    
    // Update upload context when complaint ID becomes available
    useEffect(() => {
      if (id) setUploadContextId(id);
    }, [id]);
    
    const { uploadingFiles, handleFileUpload, removeFile, clearFiles, getCompletedFiles } = useFileUpload('complaint', uploadContextId);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
    const [downloadUrlsByKey, setDownloadUrlsByKey] = useState<Record<string, string>>({});
    const [loadingUrls, setLoadingUrls] = useState(false);

  // Load complaint and messages on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (id) {
        await fetchComplaint(id);
        if (!cancelled) {
          await fetchThread(id);
        }
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Validation function
  const validateReply = (): boolean => {
    const errors: Record<string, string> = {};

    if (!replyText.trim()) {
      errors.replyText = "Reply message is required";
    } else if (replyText.trim().length < 10) {
      errors.replyText = "Reply must be at least 10 characters";
    } else if (replyText.trim().length > 5000) {
      errors.replyText = "Reply must be less than 5000 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

   // Fetch download URLs for attachments that have IDs but no URLs
    const processedIdsRef = useRef(new Set<string>());
    const processedKeysRef = useRef(new Set<string>());

    function isBlobUrl(value: string | null | undefined): boolean {
      if (!value) return true;
      if (value.startsWith('blob:') || value.startsWith('data:')) return true;
      // Storage keys don't start with http/https - they're internal references
      if (!value.startsWith('http://') && !value.startsWith('https://')) return true;
      return false;
    }

    const normalizeAttachment = (attachment: LooseAttachment): Attachment => ({
      name: String(attachment.name ?? attachment.file_name ?? 'Attachment'),
      size: typeof attachment.size === 'number' || typeof attachment.size === 'string'
        ? attachment.size
        : Number(attachment.file_size ?? 0),
      type: String(attachment.type ?? attachment.file_type ?? 'document'),
      url: attachment.url || attachment.file_path
        ? String(attachment.url ?? attachment.file_path)
        : null,
      id: attachment.id as string | number | undefined,
      storageKey: attachment.storageKey || attachment.storage_key
        ? String(attachment.storageKey ?? attachment.storage_key)
        : undefined,
      s3Url: attachment.s3Url || attachment.url
        ? String(attachment.s3Url ?? attachment.url)
        : undefined,
    });

    const fetchAttachmentUrls = useCallback(async (attachments: Attachment[]) => {
      // Attachments needing download URL by ID
      const attachmentsNeedingUrlsById = attachments.filter(
        (att) => att.id && !downloadUrls[String(att.id)] && !processedIdsRef.current.has(String(att.id))
      );

      // Attachments needing download URL by storage key (only if URL is blob or missing)
      const attachmentsNeedingUrlsByKey = attachments.filter(
        (att) => att.storageKey && isBlobUrl(att.url) && !downloadUrlsByKey[String(att.storageKey)] && !processedKeysRef.current.has(String(att.storageKey))
      );

      if (attachmentsNeedingUrlsById.length === 0 && attachmentsNeedingUrlsByKey.length === 0) return;

      setLoadingUrls(true);
      try {
        const newUrlsById: Record<string, string> = {};
        const newUrlsByKey: Record<string, string> = {};
        
        // Fetch URLs by attachment ID
        for (const att of attachmentsNeedingUrlsById) {
          if (att.id) {
            processedIdsRef.current.add(String(att.id));
            try {
              const url = await getDownloadUrl(String(att.id));
              if (url) {
                newUrlsById[String(att.id)] = url;
              }
            } catch (error) {
              console.warn('Could not fetch download URL for attachment:', att.name, error);
            }
          }
        }
        
        // Fetch URLs by storage key
        for (const att of attachmentsNeedingUrlsByKey) {
          if (att.storageKey) {
            processedKeysRef.current.add(String(att.storageKey));
            try {
              const url = await getDownloadUrlByKey(att.storageKey);
              if (url) {
                newUrlsByKey[String(att.storageKey)] = url;
              }
            } catch (error) {
              console.warn('Could not fetch download URL by key for attachment:', att.name, error);
            }
          }
        }
        
        setDownloadUrls((prev) => ({ ...prev, ...newUrlsById }));
        setDownloadUrlsByKey((prev) => ({ ...prev, ...newUrlsByKey }));
      } finally {
        setLoadingUrls(false);
      }
    }, [downloadUrls, downloadUrlsByKey]);

  // Effect to fetch download URLs when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      const allAttachments: Attachment[] = [];
      messages.forEach((msg) => {
        if (msg.attachments) {
          const normalized = msg.attachments.map((att) => 
            normalizeAttachment(asAttachmentRecord(att))
          );
          allAttachments.push(...normalized);
        }
      });
      fetchAttachmentUrls(allAttachments);
    }
  }, [messages, fetchAttachmentUrls]);

  // Also fetch URLs for initial complaint attachments
  useEffect(() => {
    if (currentComplaint && currentComplaint.attachments && currentComplaint.attachments.length > 0) {
      const normalized = currentComplaint.attachments.map((att) => 
        normalizeAttachment(asAttachmentRecord(att))
      );
      fetchAttachmentUrls(normalized);
    }
  }, [currentComplaint, fetchAttachmentUrls]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateReply()) {
      toast.error("Please fix the validation errors");
      return;
    }

    // Check if any files are still uploading
    const stillUploading = uploadingFiles.some(f => !f.complete);
    if (stillUploading) {
      toast.error("Please wait for all files to finish uploading");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call API to add reply
      if (id) {
        const completedFiles = getCompletedFiles();
        const attachments: AttachmentPayload[] = completedFiles.map((file) => ({
          name: file.name,
          fileType: file.type,
          sizeBytes: file.sizeBytes,
          url: file.url,
          storageKey: file.storageKey,
        }));

        const response = await addReply(id, replyText.trim(), {
          subject: replySubject.trim() || undefined,
          attachments,
        });

        if (response) {
          // Reset form
          setReplyText("");
          setReplySubject("");
          clearFiles();
          setValidationErrors({});

          // Refresh messages
          await fetchThread(id);

          toast.success("Reply sent successfully!");
        } else {
          toast.error("Failed to send reply. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast.error("An error occurred while sending your reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (complaintsLoading || messagesLoading) {
    return (
      <MainLayout>
        <div className="py-6">
          <MobileHeader 
            title="Loading..." 
            onMenuClick={() => setMobileMenuOpen(true)} 
          />
          <MobileDrawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
          <div className="text-center py-12">
            <Spinner className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading message details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error if complaint not found
  if (!currentComplaint) {
    return (
      <MainLayout>
        <div className="py-6">
          <MobileHeader 
            title="Message Not Found" 
            onMenuClick={() => setMobileMenuOpen(true)} 
          />
          <MobileDrawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
          <div className="text-center py-12">
            <p className="text-muted-foreground">This message could not be found.</p>
            <Button onClick={() => navigate("/messages")} className="mt-4">
              Back to Messages
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

// Use currentComplaint and messages from hooks
  const message = currentComplaint;
  const responseItems = (message.responses && message.responses.length > 0)
    ? message.responses
    : messages
        .filter((threadMessage) => threadMessage.message_type !== 'initial')
        .map((threadMessage) => ({
          sender: threadMessage.sender_id === message.filed_by ? 'user' : 'staff',
          text: threadMessage.subject || '',
          content: threadMessage.content,
          attachments: (threadMessage.attachments || []).map((attachment) =>
            normalizeAttachment(asAttachmentRecord(attachment))
          ),
          time: threadMessage.created_at
            ? new Date(threadMessage.created_at).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })
            : '',
          date: threadMessage.created_at
            ? new Date(threadMessage.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : '',
        }));

  const renderAttachment = (attachment: Attachment, index: number) => {
    const isImage = attachment.type === 'image';
    
    // Use presigned download URL if available, otherwise fall back to original URL
    const downloadUrl = attachment.id ? downloadUrls[String(attachment.id)] : null;
    const downloadUrlByKey = attachment.storageKey ? downloadUrlsByKey[String(attachment.storageKey)] : null;
    const effectiveUrl = downloadUrl || downloadUrlByKey || attachment.url;
    
    return (
      <div key={index} className="space-y-2">
        {isImage && effectiveUrl ? (
          <div className="rounded-lg overflow-hidden max-w-sm">
            <img 
              src={effectiveUrl} 
              alt={attachment.name}
              className="w-full h-auto object-cover"
            />
          </div>
        ) : null}
        <div
          className="bg-muted/50 rounded-lg p-3 flex items-center gap-3 hover:bg-muted/70 transition-colors cursor-pointer max-w-sm"
          onClick={() => {
            if (effectiveUrl) {
              const link = document.createElement('a');
              link.href = effectiveUrl;
              link.download = attachment.name;
              link.click();
            }
          }}
        >
          {attachment.type === 'pdf' ? (
            <div className="w-10 h-10 bg-destructive rounded flex items-center justify-center text-destructive-foreground text-xs font-bold">
              PDF
            </div>
          ) : attachment.type === 'image' ? (
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <Image className="w-5 h-5 text-primary-foreground" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{attachment.name}</p>
            <p className="text-xs text-muted-foreground">{attachment.size}</p>
          </div>
          <Download className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    );
  };

  const renderResponseAttachment = (attachment: Attachment, index: number) => {
    // Use presigned download URL if available, otherwise fall back to original URL
    const downloadUrl = attachment.id ? downloadUrls[String(attachment.id)] : null;
    const downloadUrlByKey = attachment.storageKey ? downloadUrlsByKey[String(attachment.storageKey)] : null;
    const effectiveUrl = downloadUrl || downloadUrlByKey || attachment.url;
    
    return (
      <div
        key={index}
        className="bg-white/10 rounded-lg p-3 flex items-center gap-3 hover:bg-white/20 transition-colors cursor-pointer"
        onClick={() => {
          if (effectiveUrl) {
            const link = document.createElement('a');
            link.href = effectiveUrl;
            link.download = attachment.name;
            link.click();
          }
        }}
      >
        {attachment.type === 'pdf' ? (
          <div className="w-10 h-10 bg-destructive rounded flex items-center justify-center text-destructive-foreground text-xs font-bold">
            PDF
          </div>
        ) : attachment.type === 'image' ? (
          <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
            <Image className="w-5 h-5 text-primary-foreground" />
          </div>
        ) : (
          <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center">
            <FileText className="w-5 h-5 text-card-dark-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-card-dark-foreground truncate">{attachment.name}</p>
          <p className="text-xs text-card-dark-foreground/60">{attachment.size}</p>
        </div>
        <Download className="w-4 h-4 text-card-dark-foreground/60" />
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="py-6">
        {/* Navigation Bar */}
        <MobileHeader 
          title="Message Details" 
          onMenuClick={() => setMobileMenuOpen(true)} 
        />

        {/* Mobile Drawer */}
        <MobileDrawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

        {/* Content */}
        <div className="space-y-6">

        {/* Original Complaint Message - Student (Black) */}
        <div className="flex justify-end">
          <div className="max-w-[80%] space-y-3">
            <div className="bg-card-dark rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-lg font-normal text-card-dark-foreground">{message.title}</h2>
                  <p className="text-sm text-card-dark-foreground/60 font-light">{message.professor}</p>
                </div>
                <span className="text-sm font-medium text-primary">Level {message.level || message.current_level}</span>
              </div>

              <p className="text-card-dark-foreground leading-relaxed font-light">
                {message.fullText || message.description}
              </p>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium text-card-dark-foreground/60">
                    Attachments ({message.attachments.length})
                  </p>
                  <div className="space-y-3">
                    {message.attachments.map((attachment, index) => 
                      renderResponseAttachment(normalizeAttachment(asAttachmentRecord(attachment)), index)
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-card-dark-foreground/60 pt-2 border-t border-white/10 font-light">
                <span>{message.time || ''}</span>
                <span>•</span>
                <span>{message.date || new Date(message.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}</span>
                <span>•</span>
                <span className="text-primary">{message.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Responses - Student (user) = black, Educator (admin) = white */}
        {responseItems.map((response, index) => {
          const isStudent = response.sender === "user";
          return (
            <div key={index} className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] space-y-3">
                <div className={`rounded-lg p-4 space-y-3 ${isStudent ? 'bg-card-dark' : 'bg-card border border-border'}`}>
                  {response.text && (
                    <h3 className={`font-medium ${isStudent ? 'text-card-dark-foreground' : 'text-foreground'}`}>{response.text}</h3>
                  )}
                  <p className={`leading-relaxed ${isStudent ? 'text-card-dark-foreground' : 'text-foreground'}`}>
                    {response.content}
                  </p>
                  {response.attachments && response.attachments.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {response.attachments.map((attachment, idx) =>
                        isStudent
                          ? renderResponseAttachment(normalizeAttachment(asAttachmentRecord(attachment)), idx)
                          : renderAttachment(normalizeAttachment(asAttachmentRecord(attachment)), idx)
                      )}
                    </div>
                  )}
                </div>
                <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isStudent ? 'justify-end' : 'justify-start'}`}>
                  <span>{response.time}</span>
                  <span>•</span>
                  <span>{response.date}</span>
                </div>
              </div>
            </div>
          );
        })}

        </div>

        {/* Reply Form - matches Complaint page styling */}
        <form onSubmit={handleReplySubmit} className="mt-8 bg-card rounded-lg p-4 md:p-8 space-y-2 md:space-y-6 shadow-sm shadow-white">
          <div className="space-y-2">
            <input
              type="text"
              value={replySubject}
              onChange={(e) => setReplySubject(e.target.value)}
              placeholder="Write Your Subject Here (optional)"
              className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 placeholder:font-light text-base pb-4 border-b border-border focus:border-primary transition-colors font-normal"
            />
          </div>

          <div className="flex justify-end">
            <span className="text-sm text-muted-foreground/60 font-light">
              {new Date().toLocaleString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit', 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
          </div>

          <div className="space-y-2">
            <textarea
              value={replyText}
              onChange={(e) => {
                setReplyText(e.target.value);
                if (validationErrors.replyText) {
                  setValidationErrors(prev => ({ ...prev, replyText: '' }));
                }
              }}
              placeholder="Compose your reply here"
              className={`w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 text-base min-h-[200px] resize-none font-light border border-border rounded-md p-3 transition-colors ${
                validationErrors.replyText ? 'border-destructive focus:border-destructive' : 'focus:border-primary'
              }`}
              required
            />
            {validationErrors.replyText && (
              <p className="text-xs text-destructive">{validationErrors.replyText}</p>
            )}
            <p className="text-xs text-muted-foreground text-right">{replyText.length}/5000 characters</p>
          </div>

          {/* File Upload Progress */}
          <FileUploadProgress files={uploadingFiles} onRemove={removeFile} />

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <label className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Paperclip className="h-5 w-5" />
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                disabled={isSubmitting || messagesLoading}
              />
            </label>
            <Button
              type="submit"
              disabled={isSubmitting || messagesLoading || Object.keys(validationErrors).length > 0}
              className="bg-card-dark text-card-dark-foreground hover:bg-card-dark/90 px-6 disabled:opacity-50"
            >
              {isSubmitting || messagesLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Sending...
                </>
              ) : (
                <>
                  Send
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default MessageDetail;