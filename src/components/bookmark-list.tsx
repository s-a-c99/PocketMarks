"use client";

import { useState, useMemo, useTransition } from "react";
import { Plus } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import type { Bookmark } from "@/types";
import { BookmarkCard } from "./bookmark-card";
import { AddBookmarkDialog } from "./add-bookmark-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { deleteBookmarkAction, saveBookmarkAction } from "@/lib/actions";

export function BookmarkList({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookmarkToEdit, setBookmarkToEdit] = useState<Bookmark | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleAddNew = () => {
    setBookmarkToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (bookmark: Bookmark) => {
    setBookmarkToEdit(bookmark);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      deleteBookmarkAction(id).then(() => {
        toast({ title: "Bookmark deleted", description: "The bookmark has been removed." });
      });
    });
  };

  const handleSaveBookmark = (values: Omit<Bookmark, 'id'>) => {
    const isEditing = !!bookmarkToEdit;
    
    const bookmarkToSave: Bookmark = {
        id: bookmarkToEdit?.id || uuidv4(),
        ...values,
    };

    startTransition(() => {
        saveBookmarkAction(bookmarkToSave).then(() => {
             toast({
                title: `Bookmark ${isEditing ? 'updated' : 'added'}`,
                description: `"${bookmarkToSave.title}" has been saved.`
            });
        });
    });
  };

  const filteredBookmarks = useMemo(() => {
    if (!searchTerm) return initialBookmarks;
    return initialBookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.url.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [initialBookmarks, searchTerm]);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Input
            placeholder="Search bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={isPending}
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <div className="flex gap-4">
            <Button onClick={handleAddNew} className="font-headline w-full md:w-auto" disabled={isPending}>
                <Plus className="mr-2 h-4 w-4" /> Add Bookmark
            </Button>
            {/* Placeholder for Import/Export */}
            <Button variant="outline" className="font-headline hidden md:inline-flex" disabled={isPending}>Import</Button>
            <Button variant="outline" className="font-headline hidden md:inline-flex" disabled={isPending}>Export</Button>
        </div>
      </div>
      
      {filteredBookmarks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-9 gap-4">
          {filteredBookmarks.map((bookmark) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold text-muted-foreground font-headline">No Bookmarks Found</h3>
            <p className="mt-2 text-muted-foreground">
                {searchTerm ? "Try a different search term or " : "You haven't added any bookmarks yet. "}
                <button onClick={handleAddNew} className="text-primary hover:underline font-semibold">add one now</button>.
            </p>
        </div>
      )}

      <AddBookmarkDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onBookmarkSaved={handleSaveBookmark}
        bookmarkToEdit={bookmarkToEdit}
      />
    </div>
  );
}
