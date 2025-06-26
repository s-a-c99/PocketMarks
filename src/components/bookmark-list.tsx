"use client";

import { useState, useMemo, useTransition, Fragment } from "react";
import { Plus, Folder as FolderIcon } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import type { Bookmark, BookmarkItem, Folder } from "@/types";
import { BookmarkCard } from "./bookmark-card";
import { AddBookmarkDialog } from "./add-bookmark-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { deleteBookmarkAction, saveBookmarkAction } from "@/lib/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "./ui/card";

function filterItems(items: BookmarkItem[], term: string): BookmarkItem[] {
    if (!term) return items;

    const lowerCaseTerm = term.toLowerCase();

    return items.reduce((acc, item) => {
        if (item.title.toLowerCase().includes(lowerCaseTerm)) {
            acc.push(item);
            return acc;
        }

        if (item.type === 'folder') {
            const matchingChildren = filterItems(item.children, term);
            if (matchingChildren.length > 0) {
                acc.push({ ...item, children: matchingChildren });
            }
        } else if (item.type === 'bookmark' && item.url.toLowerCase().includes(lowerCaseTerm)) {
            acc.push(item);
        }

        return acc;
    }, [] as BookmarkItem[]);
}


export function BookmarkList({ initialItems }: { initialItems: BookmarkItem[] }) {
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
        toast({ title: "Item deleted", description: "The item has been removed." });
      });
    });
  };

  const handleSaveBookmark = (values: Omit<Bookmark, 'id' | 'type'>) => {
    const isEditing = !!bookmarkToEdit;
    
    const bookmarkToSave: Bookmark = {
        id: bookmarkToEdit?.id || uuidv4(),
        type: 'bookmark',
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

  const filteredItems = useMemo(() => filterItems(initialItems, searchTerm), [initialItems, searchTerm]);

  const renderItems = (items: BookmarkItem[]) => {
    const folders = items.filter(item => item.type === 'folder') as Folder[];
    const bookmarks = items.filter(item => item.type === 'bookmark') as Bookmark[];

    return (
      <>
        <Accordion type="multiple" className="w-full space-y-4">
          {folders.map(folder => (
            <AccordionItem key={folder.id} value={folder.id} className="border-none">
              <Card>
                <AccordionTrigger className="p-4 font-headline text-lg hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-5 w-5 text-primary" />
                    {folder.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-4">
                      {folder.children.map(item => (
                          <Fragment key={item.id}>
                              {item.type === 'bookmark' && <BookmarkCard bookmark={item} onEdit={handleEdit} onDelete={handleDelete} />}
                              {/* Recursive rendering for nested folders could be added here */}
                          </Fragment>
                      ))}
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-9 gap-4 mt-4">
            {bookmarks.map((bookmark) => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
        </div>
      </>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Input
            placeholder="Search bookmarks and folders..."
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
      
      {filteredItems.length > 0 ? (
        renderItems(filteredItems)
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold text-muted-foreground font-headline">No Items Found</h3>
            <p className="mt-2 text-muted-foreground">
                {searchTerm ? "Try a different search term or " : "You haven't added any bookmarks or folders yet. "}
                <button onClick={handleAddNew} className="text-primary hover:underline font-semibold">add a bookmark now</button>.
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
