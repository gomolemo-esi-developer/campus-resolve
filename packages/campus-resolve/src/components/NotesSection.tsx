import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { AddNoteModal } from "@/components/AddNoteModal";
import { EditNoteModal } from "@/components/EditNoteModal";
import { UserCard } from "@/components/UserCard";
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

interface Note {
  id: string;
  subject: string;
  description: string;
}

export const NotesSection = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const handleAddNote = (subject: string, content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      subject,
      description: content,
    };
    setNotes([newNote, ...notes]);
    toast({
      title: "Note added",
      description: "Your note has been saved successfully.",
    });
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (subject: string, content: string) => {
    if (editingNote) {
      setNotes(notes.map(note => 
        note.id === editingNote.id 
          ? { ...note, subject, description: content }
          : note
      ));
      toast({
        title: "Note updated",
        description: "Your changes have been saved successfully.",
      });
      setEditingNote(null);
    }
  };

  const handleDeleteNote = () => {
    if (deleteNoteId) {
      setNotes(notes.filter(note => note.id !== deleteNoteId));
      toast({
        title: "Note deleted",
        description: "The note has been removed.",
      });
      setDeleteNoteId(null);
    }
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Quick Notes Header */}
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-2xl font-bold text-foreground">Quick Notes</h2>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      <AddNoteModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={handleAddNote}
      />

      <EditNoteModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={handleSaveEdit}
        initialSubject={editingNote?.subject || ""}
        initialContent={editingNote?.description || ""}
      />

      <AlertDialog open={deleteNoteId !== null} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Note</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="transition-all duration-200 hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all duration-200"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.map((note) => (
          <div 
            key={note.id} 
            className="flex items-start gap-4 p-5 bg-background border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in"
          >
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-foreground">{note.subject}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{note.description}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="icon" 
                onClick={() => handleEditNote(note)}
                className="bg-foreground hover:bg-foreground/90 text-background rounded-lg h-10 w-10 transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                onClick={() => setDeleteNoteId(note.id)}
                className="bg-foreground hover:bg-foreground/90 text-background rounded-lg h-10 w-10 transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
