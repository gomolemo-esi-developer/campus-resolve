import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, Trash2, Plus, FileText, StickyNote, Paperclip, Search, Link2 } from "lucide-react";
import { AddNoteModal } from "@/components/AddNoteModal";
import { EditNoteModal } from "@/components/EditNoteModal";
import { ViewNoteModal } from "@/components/ViewNoteModal";
import { ViewFileModal } from "@/components/ViewFileModal";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useNotes, NoteItem, FileItem, Note } from "@/hooks";

// Extend types to include fields used in this page
interface ExtendedNoteItem extends NoteItem {
  type: "note";
  storage_key?: string;
  size?: number;
  links?: Array<{ id: string; label: string; url: string }>;
}

interface ExtendedFileItem extends FileItem {
  type: "file";
  storage_key?: string;
  size?: number;
}

interface ExtendedLinkItem {
  id: string;
  type: "link";
  title: string;
  link_url: string;
  link_label?: string;
  createdAt: Date;
  content_type?: string;
}

type QuickItem = ExtendedNoteItem | ExtendedFileItem | ExtendedLinkItem;

type FilterType = 'all' | 'note' | 'file' | 'link';

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════

const QuickNotes = () => {
  // API hook
  const { fetchNotes, createNote, createLink, updateNote, deleteNote, uploadFile, notes, downloadFile } = useNotes();
  
  // Local state
  const [items, setItems] = useState<QuickItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Modal state
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isViewFileModalOpen, setIsViewFileModalOpen] = useState(false);
  
  // Item state
  const [editingItem, setEditingItem] = useState<QuickItem | null>(null);
  const [viewingItem, setViewingItem] = useState<QuickItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Fetch items on mount and filter change
  useEffect(() => {
    const loadItems = async () => {
      await fetchNotes(activeFilter === 'all' ? undefined : activeFilter);
    };
    loadItems();
  }, [activeFilter]);

  // Update items when notes from API change
  useEffect(() => {
    setItems(notes as QuickItem[]);
  }, [notes]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      if (item.type === "note") {
        return item.subject.toLowerCase().includes(query) || 
               (item.description?.toLowerCase().includes(query) ?? false);
      }
      if (item.type === "link") {
        return item.title.toLowerCase().includes(query) || 
               item.link_url.toLowerCase().includes(query);
      }
      if (item.type === "file") {
        const fileItem = item as FileItem;
        const displayTitle = fileItem.title || fileItem.name;
        return displayTitle.toLowerCase().includes(query);
      }
      // Fallback for any other case
      return true;
    });
  }, [items, searchQuery]);

  // Handlers
  const handleAddNote = async (subject: string, content: string, links: any[]) => {
    const result = await createNote(subject, content, links);
    if (result) {
      toast({
        title: "Note added",
        description: "Your note has been saved successfully.",
      });
    }
  };

  const handleAddLink = async (title: string, url: string, label?: string) => {
    const result = await createLink(title, url, label);
    if (result) {
      toast({
        title: "Link added",
        description: "Your link has been saved successfully.",
      });
    }
  };

  const handleUploadFiles = async (uploadedFiles: Array<{ file: File; title?: string }>) => {
    let uploadedCount = 0;
    
    for (const fileData of uploadedFiles) {
      const result = await uploadFile(fileData.file, undefined, fileData.title);
      if (result) {
        uploadedCount++;
      }
    }

    if (uploadedCount > 0) {
      toast({
        title: `${uploadedCount} file(s) uploaded`,
        description: "Your files have been attached successfully.",
      });
    }
  };

  const handleViewNote = (item: NoteItem) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const handleViewFile = (item: FileItem) => {
    setViewingItem(item);
    setIsViewFileModalOpen(true);
  };

  const handleEditItem = (item: QuickItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (subject: string, content: string, links: any[]) => {
    if (editingItem && editingItem.type === "note") {
      const result = await updateNote(editingItem.id, subject, content, links);
      if (result) {
        toast({
          title: "Note updated",
          description: "Your changes have been saved successfully.",
        });
        setEditingItem(null);
      } else {
        toast({
          title: "Update failed",
          description: "Unable to save your changes. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteItem = async () => {
    if (deleteItemId) {
      const item = items.find(i => i.id === deleteItemId);
      const success = await deleteNote(deleteItemId);
      if (success) {
        toast({
          title: item?.type === "note" ? "Note deleted" : 
                 item?.type === "link" ? "Link deleted" : "File deleted",
          description: item?.type === "note" ? "The note has been removed." :
                      item?.type === "link" ? "The link has been removed." : 
                      "The file has been removed.",
        });
      } else {
        toast({
          title: "Delete failed",
          description: "Unable to delete the item. Please try again.",
          variant: "destructive",
        });
      }
      setDeleteItemId(null);
    }
  };

  // UI Helpers
const getFileIcon = (fileType: string) => {
     switch (fileType) {
       case "pdf":
         return <div className="w-12 h-12 bg-accent rounded flex items-center justify-center text-background font-bold text-xs">PDF</div>;
       case "excel":
         return <div className="w-12 h-12 bg-green-600 rounded flex items-center justify-center text-background">
           <FileText className="w-6 h-6" />
         </div>;
       case "word":
         return <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center text-background">
           <FileText className="w-6 h-6" />
         </div>;
       case "document":
       default:
         return <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
           <FileText className="w-6 h-6 text-muted-foreground" />
         </div>;
     }
   };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 bg-[#F8F8F8] lg:ml-72 h-screen overflow-y-auto pt-16 lg:pt-0">
        <div className="flex justify-center p-4 md:p-8">
          <div className="w-full max-w-4xl">
            {/* Header with Add Actions */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Quick Notes</h1>
              
              {/* Desktop: Show both buttons */}
              <div className="hidden sm:flex gap-2">
                <Button 
                  onClick={() => setIsAddNoteModalOpen(true)}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                >
                  <StickyNote className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
                <Button 
                  onClick={() => setIsAttachModalOpen(true)}
                  variant="outline"
                  className="border-secondary text-secondary hover:bg-secondary/10 transition-all duration-200 hover:scale-105"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Add File
                </Button>
              </div>

              {/* Mobile: Dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="sm:hidden">
                  <Button 
                    size="icon"
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground h-12 w-12 rounded-full shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => setIsAddNoteModalOpen(true)}
                    className="py-3 cursor-pointer"
                  >
                    <StickyNote className="w-4 h-4 mr-3" />
                    Add Note
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setIsAttachModalOpen(true)}
                    className="py-3 cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4 mr-3" />
                    Add File
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Input
                placeholder="Search notes and files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#F8F8F8] border border-[#E8E8E8] rounded-[25px] pl-4 pr-10 h-11 !focus-visible:ring-0 !focus-visible:outline-none !ring-offset-0"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black stroke-[2.5]" />
            </div>

            {/* Filter Tabs */}
            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterType)} className="mb-6">
              <TabsList className="bg-muted/50 w-full justify-start rounded-lg">
                <TabsTrigger value="all" className="flex-1 sm:flex-none">All</TabsTrigger>
                <TabsTrigger value="note" className="flex-1 sm:flex-none">
                  <StickyNote className="w-4 h-4 mr-2" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="link" className="flex-1 sm:flex-none">
                  <Link2 className="w-4 h-4 mr-2" />
                  Links
                </TabsTrigger>
                <TabsTrigger value="file" className="flex-1 sm:flex-none">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Files
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Modals */}
            <AddNoteModal
              open={isAddNoteModalOpen}
              onOpenChange={setIsAddNoteModalOpen}
              onSave={handleAddNote}
            />

<EditNoteModal
               open={isEditModalOpen}
               onOpenChange={setIsEditModalOpen}
               onSave={handleSaveEdit}
               initialSubject={editingItem?.type === "note" ? editingItem.subject : ""}
               initialContent={editingItem?.type === "note" ? editingItem.description : ""}
               initialLinks={editingItem?.type === "note" ? ((editingItem as any).links || (editingItem as any).link_url ? [{
                 id: "existing-link",
                 label: (editingItem as any).link_label || (editingItem as any).link_url,
                 url: (editingItem as any).link_url
               }] : []) : []}
             />

<ViewNoteModal
               open={isViewModalOpen}
               onOpenChange={setIsViewModalOpen}
               subject={viewingItem?.type === "note" ? viewingItem.subject : ""}
               content={viewingItem?.type === "note" ? viewingItem.description : ""}
               date={viewingItem ? formatDate(viewingItem.createdAt) : ""}
               links={viewingItem?.type === "note" ? ((viewingItem as any).links || (viewingItem as any).link_url ? [{
                 id: "view-link",
                 label: (viewingItem as any).link_label || (viewingItem as any).link_url,
                 url: (viewingItem as any).link_url
               }] : []) : []}
               onEdit={() => viewingItem && handleEditItem(viewingItem)}
             />

            <ViewFileModal
              open={isViewFileModalOpen}
              onOpenChange={setIsViewFileModalOpen}
              name={viewingItem?.type === "file" ? viewingItem.name : ""}
              fileType={viewingItem?.type === "file" ? viewingItem.fileType : "pdf"}
              thumbnail={viewingItem?.type === "file" ? (viewingItem.thumbnail || viewingItem.s3_url) : undefined}
              date={viewingItem ? formatDate(viewingItem.createdAt) : ""}
              fileId={viewingItem?.id}
              onDownload={downloadFile}
            />

            <AttachFileModal
              open={isAttachModalOpen}
              onOpenChange={setIsAttachModalOpen}
              onUpload={handleUploadFiles}
            />

            <AlertDialog open={deleteItemId !== null} onOpenChange={() => setDeleteItemId(null)}>
              <AlertDialogContent className="animate-scale-in">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Delete Item</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    Are you sure you want to delete this item? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="transition-all duration-200 hover:bg-muted">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteItem}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Items List */}
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => item.type === "note" ? handleViewNote(item as NoteItem) : 
                             item.type === "file" ? handleViewFile(item as FileItem) : 
                             window.open((item as LinkItem).link_url, '_blank')}
                  className="flex items-start gap-4 p-4 md:p-5 bg-background border border-[#E8E8E8] rounded-lg shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in cursor-pointer"
                >
                  {/* Icon/Thumbnail */}
                  <div className="flex-shrink-0">
                    {item.type === "note" ? (
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <StickyNote className="w-6 h-6 text-primary" />
                      </div>
                    ) : item.type === "link" ? (
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Link2 className="w-6 h-6 text-blue-600" />
                      </div>
                    ) : item.type === "file" && (item as FileItem).fileType === "image" ? (
                      <img src={(item as FileItem).thumbnail || (item as FileItem).s3_url} alt={item.name} className="w-12 h-12 object-cover rounded-lg shadow-sm" />
                    ) : (
                      getFileIcon(item.type === "file" ? (item as FileItem).fileType : 'document')
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {item.type === "note" ? item.subject : 
                         item.type === "link" ? item.title : 
                         ((item as FileItem).title || item.name)}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
{item.type === "note" && (
                       <>
                         <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                           {(item as NoteItem).description}
                         </p>
                         {(((item as any).links && (item as any).links.length > 0) || (item as any).link_url) && (
                           <div className="flex flex-wrap gap-2 mt-1">
                             {((item as any).links || []).map((link: any, idx: number) => (
                               <div key={link.id || idx} className="flex items-center gap-1 text-xs text-blue-600 truncate">
                                 <Link2 className="w-3 h-3" />
                                 <span className="hover:underline">{link.label || link.url}</span>
                               </div>
                             ))}
                             {(item as any).link_url && !(item as any).links?.length && (
                               <div className="flex items-center gap-1 text-xs text-blue-600 truncate">
                                 <Link2 className="w-3 h-3" />
                                 <span className="hover:underline">
                                   {(item as any).link_label || (item as any).link_url}
                                 </span>
                               </div>
                             )}
                           </div>
                         )}
                       </>
                     )}
                    {item.type === "link" && (
                      <p className="text-sm text-blue-600 truncate">
                        {(item as LinkItem).link_url}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {item.type === "note" && (
                      <Button 
                        size="icon" 
                        onClick={() => handleEditItem(item)}
                        className="bg-foreground hover:bg-foreground/90 text-background rounded-lg h-10 w-10 min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-105 shadow-sm"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      size="icon" 
                      onClick={() => setDeleteItemId(item.id)}
                      className="bg-foreground hover:bg-foreground/90 text-background rounded-lg h-10 w-10 min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-105 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredItems.length === 0 && searchQuery && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No results found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              )}

              {items.length === 0 && !searchQuery && (
                <div className="text-center py-12 text-muted-foreground">
                  <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No notes or files yet</p>
                  <p className="text-sm mt-1">Add your first note or file to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuickNotes;