import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useComplaints, useProfile } from "@/hooks";
import { FileUploadProgress, useFileUpload } from "@/components/FileUploadProgress";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileDrawer } from "@/components/MobileDrawer";
import { Spinner } from "@/components/ui/spinner";

const fallbackCategoryLabels: Record<string, string> = {
  "student-services": "Student Services",
  "campus-facilities": "Campus Facilities",
  "course-complaint": "Course Complaint",
  "timetable": "Timetable Issue",
  "lecture-hall-lab": "Lecture Hall | Lab Issue",
  "report-lecturer": "Report Lecturer",
};

const Complaint = () => {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const category = searchParams.get("category") || "";
   const tempId = useRef(`temp-${Date.now()}`).current;

   const {
     createComplaint,
     fetchComplaintTypes,
     complaintTypes,
     loading: complaintsLoading,
   } = useComplaints();
   const { profile } = useProfile();
   const [title, setTitle] = useState("");
   const [message, setMessage] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const { uploadingFiles, handleFileUpload, removeFile, clearFiles, getCompletedFiles } = useFileUpload('complaint', tempId);
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

useEffect(() => {
  void fetchComplaintTypes();
}, []); // Fetch complaint types once on mount

  const selectedComplaintType = complaintTypes.find((item) => item.key === category);
  const categoryLabel = selectedComplaintType?.label || fallbackCategoryLabels[category] || "Complaint";

  // Validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Title is required";
    } else if (title.trim().length < 5) {
      errors.title = "Title must be at least 5 characters";
    } else if (title.trim().length > 200) {
      errors.title = "Title must be less than 200 characters";
    }

    if (!message.trim()) {
      errors.message = "Message is required";
    } else if (message.trim().length < 20) {
      errors.message = "Message must be at least 20 characters";
    } else if (message.trim().length > 5000) {
      errors.message = "Message must be less than 5000 characters";
    }

    if (!category) {
      errors.category = "Category is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
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
      const completedFiles = getCompletedFiles();

// Call API to create complaint
       const response = await createComplaint({
         title: title.trim(),
         description: message.trim(),
         category: category,
         attachments: completedFiles.map((file) => ({
           name: file.name,
           fileType: file.type,
           sizeBytes: file.sizeBytes,
           url: file.s3Url || file.url,
           storageKey: file.storageKey,
         })),
       });

      if (response) {
        // Reset form
        setTitle("");
        setMessage("");
        clearFiles();
        setValidationErrors({});

        // Show success toast and redirect
        toast.success("Complaint submitted successfully!", {
          duration: 4000,
        });

        // Navigate back to messages
        navigate("/messages");
      } else {
        toast.error("Failed to submit complaint. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("An error occurred while submitting your complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="py-6">
        {/* Navigation Bar */}
        <MobileHeader 
          title={categoryLabel} 
          onMenuClick={() => setMobileMenuOpen(true)} 
        />

        {/* Mobile Drawer */}
        <MobileDrawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

        {/* Content */}
        <div className="space-y-8">

        {/* Student Details Card */}
         <div className="bg-card-dark text-card-dark-foreground rounded-sm p-4 md:p-8 space-y-2 md:space-y-6 w-full md:w-[70%]">
          <div className="space-y-2 pb-6 md:pb-8 ">
             <div className="flex gap-16">
               <span className="text-sm text-muted-foreground min-w-[120px] font-light">Title</span>
               <span className="text-sm font-light">{profile?.title || "Mr"}</span>
             </div>
             <div className="flex gap-16">
               <span className="text-sm text-muted-foreground min-w-[120px] font-light">Full Names</span>
               <span className="text-sm font-light">{profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : "Not Set"}</span>
             </div>
             <div className="flex gap-16">
               <span className="text-sm text-muted-foreground min-w-[120px] font-light">Student Number</span>
               <span className="text-sm font-light">{profile?.studentNumber || "Not Set"}</span>
             </div>
           </div>

          <div className="space-y-4">
            {/* Tag Row */}
            <div className="flex gap-3 flex-wrap">
              <span className="px-4 py-2 rounded-md bg-white/5 backdrop-blur-sm text-sm font-light">{profile?.department || "Department"}</span>
              <span className="px-4 py-2 rounded-md bg-white/5 backdrop-blur-sm text-sm font-light">{profile?.faculty || "Faculty"}</span>
              <span className="px-4 py-2 rounded-md bg-white/5 backdrop-blur-sm text-sm font-light">{profile?.campus || "Campus"}</span>
            </div>
             
             <div className="pt-6 border-t border-white/10">
               {/* Level & Section Row */}
               <div className="flex gap-8">
                 <div className="space-y-1">
                   <span className="text-sm text-muted-foreground font-light">Level</span>
                   <div className="text-sm font-light">1</div>
                 </div>
                 <div className="space-y-1">
                   <span className="text-sm text-muted-foreground font-light">Section</span>
                   <div className="text-sm font-light">{categoryLabel}</div>
                 </div>
               </div>
             </div>
           </div>
        </div>

        {/* Message Form */}
         <form onSubmit={handleSubmit} className="bg-card rounded-lg p-4 md:p-8 space-y-2 md:space-y-6 shadow-sm shadow-white">
            <div className="space-y-2">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (validationErrors.title) {
                    setValidationErrors(prev => ({ ...prev, title: '' }));
                  }
                }}
                placeholder="Write Your Title Here"
                className={`w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 placeholder:font-light text-base pb-4 border-b transition-colors font-normal ${
                  validationErrors.title ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
                }`}
                required
              />
              {validationErrors.title && (
                <p className="text-xs text-destructive">{validationErrors.title}</p>
              )}
              <p className="text-xs text-muted-foreground text-right">{title.length}/200 characters</p>
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
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (validationErrors.message) {
                  setValidationErrors(prev => ({ ...prev, message: '' }));
                }
              }}
              placeholder="Compose your message here"
              className={`w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 text-base min-h-[200px] resize-none font-light border border-border rounded-md p-3 transition-colors ${
                validationErrors.message ? 'border-destructive focus:border-destructive' : 'focus:border-primary'
              }`}
              required
            />
            {validationErrors.message && (
              <p className="text-xs text-destructive">{validationErrors.message}</p>
            )}
            <p className="text-xs text-muted-foreground text-right">{message.length}/5000 characters</p>
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
                disabled={isSubmitting || complaintsLoading}
              />
            </label>
            <Button
              type="submit"
              disabled={isSubmitting || complaintsLoading || Object.keys(validationErrors).length > 0}
              className="bg-card-dark text-card-dark-foreground hover:bg-card-dark/90 px-6 disabled:opacity-50"
            >
              {isSubmitting || complaintsLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Submitting...
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
      </div>
    </MainLayout>
  );
};

export default Complaint;
