"use client";

import { useState, useMemo, useTransition, Fragment, useRef } from "react";
import { Plus, Folder as FolderIcon, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import type { Bookmark, BookmarkItem, Folder } from "@/types";
import { BookmarkCard } from "./bookmark-card";
import { ItemDialog } from "./item-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { deleteItemAction, saveItemAction, importBookmarksAction, exportBookmarksAction } from "@/lib/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "./ui/card";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


function filterItems(items: BookmarkItem[], term: string): BookmarkItem[] {
    if (!term) return items;

    const lowerCaseTerm = term.toLowerCase();

    return items.reduce((acc, item) => {
        if (item.title.toLowerCase().includes(lowerCaseTerm)) {
            if (item.type === 'folder') {
                const allChildren = filterItems(item.children, ""); // return all children if folder name matches
                acc.push({ ...item, children: allChildren });
            } else {
                acc.push(item);
            }
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
  const [itemToEdit, setItemToEdit] = useState<BookmarkItem | null>(null);
  const [dialogParentId, setDialogParentId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BookmarkItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddNewBookmark = () => {
    setItemToEdit(null);
    setDialogParentId(null);
    setIsDialogOpen(true);
  };

  const handleAddNewFolder = () => {
    const folderScaffold = { id: '', type: 'folder' as const, title: '' };
    setItemToEdit(folderScaffold);
    setDialogParentId(null);
    setIsDialogOpen(true);
  };
  
  const handleAddItemToFolder = (parentId: string) => {
    setItemToEdit(null);
    setDialogParentId(parentId);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (item: BookmarkItem, parentId: string | null = null) => {
    setItemToEdit(item);
    setDialogParentId(parentId);
    setIsDialogOpen(true);
  };

  const handleDelete = (item: BookmarkItem) => {
    setItemToDelete(item);
  };
  
  const confirmDelete = () => {
    if (!itemToDelete) return;
    startTransition(() => {
      deleteItemAction(itemToDelete.id).then(() => {
        toast({ title: "Item deleted", description: `"${itemToDelete.title}" has been removed.` });
        setItemToDelete(null);
      });
    });
  };

  const handleSaveItem = (values: Omit<BookmarkItem, 'id' | 'children'>, parentId: string | null) => {
    const isEditing = !!itemToEdit && !!itemToEdit.id;
    
    const itemToSave = {
        id: itemToEdit?.id || uuidv4(),
        ...values,
    };

    if (itemToSave.type === 'folder' && !isEditing) {
        (itemToSave as Folder).children = [];
    }

    startTransition(() => {
        saveItemAction(itemToSave as BookmarkItem, parentId).then(() => {
             toast({
                title: `${itemToSave.type.charAt(0).toUpperCase() + itemToSave.type.slice(1)} ${isEditing ? 'updated' : 'added'}`,
                description: `"${itemToSave.title}" has been saved.`
            });
        });
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      
      const parseNodes = (nodes: NodeListOf<Node>): BookmarkItem[] => {
        const items: BookmarkItem[] = [];
        nodes.forEach(node => {
            if (node.nodeName === 'DT') {
                const anchor = (node as HTMLElement).querySelector('A');
                const header = (node as HTMLElement).querySelector('H3');
                
                if (anchor) {
                    items.push({
                        id: uuidv4(),
                        type: 'bookmark',
                        title: anchor.textContent || '',
                        url: anchor.getAttribute('href') || ''
                    });
                } else if (header) {
                    const nextDl = (node as HTMLElement).nextElementSibling;
                    items.push({
                        id: uuidv4(),
                        type: 'folder',
                        title: header.textContent || '',
                        children: nextDl && nextDl.nodeName === 'DL' ? parseNodes(nextDl.childNodes) : []
                    });
                }
            } else if (node.nodeName === 'DL' || node.nodeName === 'P') {
                 items.push(...parseNodes(node.childNodes));
            }
        });
        return items;
      }
      
      const importedItems = parseNodes(doc.body.childNodes);
      
      startTransition(() => {
        importBookmarksAction(importedItems).then(() => {
          toast({ title: "Import Successful", description: "Your bookmarks have been imported." });
        })
      });

    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };
  
  const handleExport = () => {
    startTransition(async () => {
        const htmlContent = await exportBookmarksAction();
        if (htmlContent) {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pocketmarks_export.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({title: "Export Successful", description: "Your bookmarks have been downloaded."});
        } else {
            toast({variant: "destructive", title: "Export Failed", description: "Could not generate export file."});
        }
    });
  };


  const filteredItems = useMemo(() => filterItems(initialItems, searchTerm), [initialItems, searchTerm]);

  const renderItems = (items: BookmarkItem[], parentId: string | null = null) => {
    const folders = items.filter(item => item.type === 'folder') as Folder[];
    const bookmarks = items.filter(item => item.type === 'bookmark') as Bookmark[];

    return (
      <TooltipProvider>
        <Accordion type="multiple" className="w-full space-y-4" defaultValue={folders.map(f => f.id)}>
          {folders.map(folder => (
            <AccordionItem key={folder.id} value={folder.id} className="border-none">
              <Card>
                <AccordionTrigger className="p-4 font-headline text-lg hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-5 w-5 text-primary" />
                      {folder.title}
                    </div>
                    <div className="flex items-center gap-1 pr-2">
                        <Tooltip>
                           <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); handleAddItemToFolder(folder.id)}}>
                                    <FolderPlus className="h-4 w-4" />
                                </Button>
                           </TooltipTrigger>
                           <TooltipContent><p>Add item to folder</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); handleEdit(folder)}}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                           <TooltipContent><p>Edit folder name</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80 hover:text-destructive" onClick={(e) => { e.preventDefault(); handleDelete(folder)}}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                           <TooltipContent><p>Delete folder</p></TooltipContent>
                        </Tooltip>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                      {folder.children.map(item => (
                          <Fragment key={item.id}>
                              {item.type === 'bookmark' && <BookmarkCard bookmark={item} onEdit={(bm) => handleEdit(bm, folder.id)} onDelete={() => handleDelete(item)} />}
                          </Fragment>
                      ))}
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 mt-4">
            {bookmarks.map((bookmark) => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} onEdit={(bm) => handleEdit(bm)} onDelete={() => handleDelete(bookmark)} />
            ))}
        </div>
      </TooltipProvider>
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
            <Button onClick={handleAddNewBookmark} className="font-headline w-full md:w-auto" disabled={isPending}>
                <Plus className="mr-2 h-4 w-4" /> Bookmark
            </Button>
            <Button onClick={handleAddNewFolder} variant="outline" className="font-headline w-full md:w-auto" disabled={isPending}>
                <FolderPlus className="mr-2 h-4 w-4" /> Folder
            </Button>
            <Button variant="outline" className="font-headline hidden md:inline-flex" onClick={handleImportClick} disabled={isPending}>Import</Button>
            <Button variant="outline" className="font-headline hidden md:inline-flex" onClick={handleExport} disabled={isPending}>Export</Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".html" />
        </div>
      </div>
      
      {filteredItems.length > 0 ? (
        renderItems(filteredItems)
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold text-muted-foreground font-headline">No Items Found</h3>
            <p className="mt-2 text-muted-foreground">
                {searchTerm ? "Try a different search term or " : "You haven't added any bookmarks or folders yet. "}
                <button onClick={handleAddNewBookmark} className="text-primary hover:underline font-semibold">add a bookmark now</button>.
            </p>
        </div>
      )}

      <ItemDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onItemSaved={handleSaveItem}
        itemToEdit={itemToEdit}
        parentId={dialogParentId}
      />

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete "{itemToDelete?.title}"
                    {itemToDelete?.type === 'folder' && ' and all of its contents'}.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}