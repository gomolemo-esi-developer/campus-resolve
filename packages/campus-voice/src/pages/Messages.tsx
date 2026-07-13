import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMessageStore } from "@/stores/messageStore";
import { useComplaints } from "@/hooks/useComplaints";
import { toast } from "sonner";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileDrawer } from "@/components/MobileDrawer";

const filters = ["All", "open", "in_progress", "resolved", "closed"];

const Messages = () => {
  const navigate = useNavigate();
  const { deleteMessage } = useMessageStore();
  const { complaints, loading, fetchComplaints, searchComplaints } = useComplaints();
  
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [displayComplaints, setDisplayComplaints] = useState(complaints);

  // Load complaints when filter or search changes
  useEffect(() => {
    let cancelled = false;
    const loadComplaints = async () => {
      if (searchQuery.trim().length >= 2) {
        const searchResults = await searchComplaints(searchQuery.trim());
        if (searchResults && !cancelled) {
          const filteredByStatus =
            activeFilter === "All"
              ? searchResults
              : searchResults.filter((complaint) => complaint.status === activeFilter);
          setDisplayComplaints(filteredByStatus);
        }
        return;
      }

      const statusFilters = activeFilter === "All" ? undefined : { status: activeFilter };
      const result = await fetchComplaints(statusFilters);
      if (result && !cancelled) {
        setDisplayComplaints(result);
      }
    };
    loadComplaints();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, searchQuery]);

  // Filter and search
  const filteredMessages = displayComplaints.filter((complaint) => {
    const matchesSearch =
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDelete = () => {
    if (deleteMessageId) {
      const parsedStoreId = Number(deleteMessageId);
      if (Number.isFinite(parsedStoreId)) {
        deleteMessage(parsedStoreId);
      }
      setDisplayComplaints((prev) => prev.filter((complaint) => complaint.id !== deleteMessageId));
      setDeleteMessageId(null);
      toast.success("Message deleted successfully");
    }
  };

  return (
    <MainLayout>
      <div className="py-6">
        {/* Navigation Bar */}
        <MobileHeader 
          title="Messages" 
          onMenuClick={() => setMobileMenuOpen(true)} 
        />

        {/* Mobile Drawer */}
        <MobileDrawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

        {/* Content */}
        <div className="space-y-6">
        
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={activeFilter === filter ? "bg-primary" : "hover:bg-[#E8E8E8] hover:text-gray-600"}
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading complaints...</span>
          </div>
        )}

        {/* Messages */}
         <div className="space-y-4">
           {!loading && filteredMessages.length === 0 ? (
             <div className="text-center py-12">
               <p className="text-muted-foreground">No messages found</p>
             </div>
           ) : (
             !loading && filteredMessages.map((complaint) => (
               <Card
                 key={complaint.id}
                 className={`transition-all rounded !border-0 bg-card hover:shadow`}
               >
                  <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                   {/* Mobile Layout */}
                   <div className="md:hidden space-y-3">
                     <div 
                       className="cursor-pointer space-y-2"
                       onClick={() => navigate(`/messages/${complaint.id}`)}
                     >
                       <p className={`text-sm text-primary font-medium`}>
                         {complaint.status}
                       </p>
                       <h3 className={`text-base font-semibold text-foreground`}>
                         {complaint.title}
                       </h3>
                       <p className={`text-sm text-muted-foreground line-clamp-2`}>{complaint.description}</p>
                        
                        {/* Date at top right */}
                        <div className={`text-xs text-muted-foreground/60`}>
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </div>
                     </div>
                    
                    {/* Mobile Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        size="sm"
                        className="h-10 px-6 text-sm bg-card-dark text-card-dark-foreground hover:bg-card-dark/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/messages/${complaint.id}`);
                        }}
                      >
                        View
                      </Button>
                      </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:block">
                      {/* Header Row */}
                      <div 
                      className="cursor-pointer space-y-1"
                      onClick={() => navigate(`/messages/${complaint.id}`)}
                      >
                      <div className="flex justify-between items-start">
                        <p className={`text-sm text-primary font-medium`}>
                          {complaint.status}
                        </p>
                        <p className={`text-xs text-muted-foreground/60`}>{new Date(complaint.created_at).toLocaleDateString()}</p>
                      </div>
                      <h3 className={`font-semibold text-foreground`}>
                        {complaint.title}
                      </h3>
                      <p className={`text-sm text-muted-foreground`}>{complaint.description}</p>
                      </div>

                      {/* Desktop Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4">
                      <Button
                        size="sm"
                        className="h-9 px-6 bg-card-dark text-card-dark-foreground hover:bg-card-dark/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/messages/${complaint.id}`);
                        }}
                      >
                        View
                      </Button>
                      </div>
                      </div>
                      </div>

                      {/* Status & Category Section */}
                      {expandedMessageId === complaint.id && (
                      <div className="bg-card-dark text-card-dark-foreground border-t border-border p-4 md:p-6">
                      <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-light">Details</h3>
                      <button
                        onClick={() => setExpandedMessageId(null)}
                        className="hover:bg-muted/20 rounded-lg transition-colors p-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      </div>
                      <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground/60 font-light">Category</p>
                        <p className="text-sm text-card-dark-foreground font-light">{complaint.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground/60 font-light">Priority</p>
                        <p className="text-sm text-card-dark-foreground font-light">{complaint.priority}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground/60 font-light">Status</p>
                        <p className="text-sm text-card-dark-foreground font-light capitalize">{complaint.status}</p>
                      </div>
                      </div>
                      </div>
                      )}
                      </Card>
                      ))
                      )}
                      </div>

        {/* Delete Confirmation Modal */}
        <AlertDialog open={!!deleteMessageId} onOpenChange={(open) => !open && setDeleteMessageId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Message</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this message? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="!flex !flex-row !justify-center !items-center !gap-3">
              <AlertDialogCancel className="!h-10 !px-6 !py-0 !m-0 text-sm hover:bg-muted hover:text-muted-foreground">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="!h-10 !px-6 !py-0 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>
    </MainLayout>
  );
};

export default Messages;
