"use client";

import { useState, useMemo, useTransition, useRef } from "react";
import { Plus, FolderPlus, Link2Off, Loader2, ChevronDown } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import type { BookmarkItem, Folder } from "@/types";
import { BookmarkCard } from "./bookmark-card";
import { ItemDialog } from "./item-dialog";
import { PasswordConfirmationDialog } from "./password-confirmation-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  deleteItemAction,
  saveItemAction,
  importBookmarksAction,
  exportBookmarksAction,
  exportSelectedBookmarksAction,
  checkDeadLinksAction,
} from "@/lib/actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const [items, setItems] = useState<BookmarkItem[]>(initialItems);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<BookmarkItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<BookmarkItem[] | null>(null);

  const [isCheckingLinks, setIsCheckingLinks] = useState(false);
  const [linkStatuses, setLinkStatuses] = useState<Record<string, string>>({});

  useMemo(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleAddNewBookmark = () => {
    setItemToEdit(null);
    setIsDialogOpen(true);
  };

  const handleAddNewFolder = () => {
    const folderScaffold = { id: '', type: 'folder' as const, title: '', createdAt: new Date().toISOString() };
    setItemToEdit(folderScaffold);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (item: BookmarkItem) => {
    setItemToEdit(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };
  
  const confirmDelete = () => {
    if (!itemToDelete) return;
    startTransition(() => {
      deleteItemAction(itemToDelete).then(() => {
        toast({ title: "Item deleted", description: "The item has been removed." });
        setItemToDelete(null);
      });
    });
  };

  const handleSaveItem = (values: Omit<BookmarkItem, 'id' | 'children' | 'createdAt'>) => {
    const isEditing = !!itemToEdit && !!itemToEdit.id;
    
    const itemToSave: BookmarkItem = {
        id: isEditing ? itemToEdit.id : uuidv4(),
        ...values,
        createdAt: isEditing ? (itemToEdit.createdAt || new Date().toISOString()) : new Date().toISOString(),
    } as BookmarkItem;

    if (itemToSave.type === 'folder' && !isEditing) {
        (itemToSave as Folder).children = [];
    }

    startTransition(() => {
        saveItemAction(itemToSave, null).then(() => {
             toast({
                title: `${itemToSave.type.charAt(0).toUpperCase() + itemToSave.type.slice(1)} ${isEditing ? 'updated' : 'added'}`,
                description: `"${itemToSave.title}" has been saved.`
            });
        });
    });
  };

  const handleImportClick = (mode: 'merge' | 'replace') => {
    fileInputRef.current?.setAttribute('data-import-mode', mode);
    fileInputRef.current?.click();
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const mode = fileInputRef.current?.getAttribute('data-import-mode') as 'merge' | 'replace';
    if (!file || !mode) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const content = e.target?.result as string;
        if (!content) return;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");

        const parseBookmarksRecursive = (root: Element): BookmarkItem[] => {
            let items: BookmarkItem[] = [];
            // Direct children of DL/P are DTs
            for (const child of Array.from(root.children)) {
              if (child.tagName === 'DT') {
                const a = child.querySelector('A');
                const h3 = child.querySelector('H3');
                
                const add_date_attr = a?.getAttribute('add_date') || h3?.getAttribute('add_date');
                const add_date = add_date_attr ? parseInt(add_date_attr, 10) * 1000 : Date.now();
                const createdAt = new Date(add_date).toISOString();

                if (h3) { // It's a folder
                  const dl = child.nextElementSibling;
                  const children = dl && dl.tagName === 'DL' ? parseBookmarksRecursive(dl) : [];
                  items.push({
                    id: uuidv4(),
                    type: 'folder',
                    title: h3.textContent || 'Untitled Folder',
                    children: children,
                    createdAt: createdAt,
                  });
                } else if (a) { // It's a bookmark
                  const url = a.getAttribute('href');
                  const title = a.textContent || 'Untitled Bookmark';
                  if (url) {
                    items.push({
                      id: uuidv4(),
                      type: 'bookmark',
                      title: title,
                      url: url,
                      createdAt: createdAt,
                    });
                  }
                }
              }
            }
            return items;
        };

        const importedItems = parseBookmarksRecursive(doc.body);
        
        if (mode === 'replace') {
            setPendingImportData(importedItems);
            setIsPasswordDialogOpen(true);
        } else {
            startTransition(() => {
                importBookmarksAction(importedItems, 'merge').then(() => {
                    toast({ title: "Import Successful", description: "Your bookmarks have been merged." });
                })
            });
        }
    };
    
    reader.onerror = () => {
        toast({ variant: "destructive", title: "Import Failed", description: "Could not read the selected file." });
    }

    reader.readAsText(file);
    if(event.target) event.target.value = '';
  };
  
  const handlePasswordConfirm = (password: string) => {
    if (!pendingImportData) return;
    startTransition(() => {
        importBookmarksAction(pendingImportData, 'replace', password).then((result) => {
            if (result?.error) {
                toast({ variant: "destructive", title: "Import Failed", description: result.error });
            } else {
                toast({ title: "Import Successful", description: "Your bookmarks have been replaced." });
            }
            setPendingImportData(null);
        });
    });
  };

  const handleCheckLinks = () => {
    setIsCheckingLinks(true);
    startTransition(async () => {
        const statuses = await checkDeadLinksAction();
        setLinkStatuses(statuses);
        setIsCheckingLinks(false);
        toast({ title: "Link check complete", description: "Potentially dead links have been marked." });
    });
  };
  
  const downloadHtmlFile = (htmlContent: string, filename: string) => {
      if (htmlContent) {
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      }
  }

  const handleExport = () => {
    startTransition(async () => {
        const htmlContent = await exportBookmarksAction();
        downloadHtmlFile(htmlContent, 'pocketmarks_export.html');
        toast({title: "Export Successful", description: "Your bookmarks have been downloaded."});
    });
  };

  const handleExportSelected = () => {
    startTransition(async () => {
        const htmlContent = await exportSelectedBookmarksAction(Array.from(selectedIds));
        if (htmlContent) {
            downloadHtmlFile(htmlContent, 'pocketmarks_selected_export.html');
            toast({title: "Export Successful", description: `${selectedIds.size} items have been downloaded.`});
        } else {
            toast({variant: "destructive", title: "Export Failed", description: "Could not generate export file."});
        }
    });
  };
  
  const getDescendantIds = (item: BookmarkItem): string[] => {
    const ids = [item.id];
    if (item.type === 'folder') {
        item.children.forEach(child => ids.push(...getDescendantIds(child)));
    }
    return ids;
  };
  
  const handleSelectionChange = (itemId: string, checked: boolean) => {
    const item = [...items].flatMap(i => i.type === 'folder' ? [i, ...i.children] : [i]).find(i => i.id === itemId);
    if (!item) return;

    const idsToChange = getDescendantIds(item);
    
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (checked) {
            idsToChange.forEach(id => newSet.add(id));
        } else {
            idsToChange.forEach(id => newSet.delete(id));
        }
        return newSet;
    });
  };

  const filteredItems = useMemo(() => filterItems(items, searchTerm), [items, searchTerm]);

  const renderItems = (itemsToRender: BookmarkItem[], isSublevel = false) => (
    <div className={`space-y-4 ${isSublevel ? 'pl-4' : ''}`}>
      {itemsToRender.map(item =>
        item.type === 'folder' ? (
          <Accordion key={item.id} type="single" collapsible className="w-full">
            <AccordionItem value={item.id} className="border rounded-lg bg-card/80">
              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Checkbox
                    id={`select-${item.id}`}
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={(checked) => handleSelectionChange(item.id, !!checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <FolderPlus className="h-5 w-5 text-primary" />
                  <span className="font-headline text-base truncate">{item.title}</span>
                  <span className="text-sm text-muted-foreground">({item.children.length})</span>
                </div>
                <div className="flex items-center gap-2 mr-2">
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0">
                {renderItems(item.children, true)}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <BookmarkCard 
            key={item.id} 
            bookmark={item}
            status={linkStatuses[item.id]} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            isSelected={selectedIds.has(item.id)} 
            onSelectionChange={handleSelectionChange}
          />
        )
      )}
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Input
            placeholder="Search bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 text-base"
            disabled={isPending || isCheckingLinks}
          />
           <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <div className="flex gap-2 flex-wrap">
            <Button onClick={handleAddNewBookmark} className="font-headline h-11" disabled={isPending || isCheckingLinks}>
                <Plus className="mr-2 h-4 w-4" /> Add Bookmark
            </Button>
            <Button onClick={handleAddNewFolder} variant="outline" className="font-headline h-11" disabled={isPending || isCheckingLinks}>
                <FolderPlus className="mr-2 h-4 w-4" /> Add Folder
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="font-headline h-11" disabled={isPending || isCheckingLinks}>
                  Import <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleImportClick('merge')}>
                  Merge with existing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImportClick('replace')} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  Replace all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="font-headline h-11" onClick={handleExport} disabled={isPending || isCheckingLinks}>Export All</Button>
            <Button variant="outline" className="font-headline h-11" onClick={handleExportSelected} disabled={isPending || isCheckingLinks || selectedIds.size === 0}>Export Selected</Button>
            <Button variant="outline" className="font-headline h-11" onClick={handleCheckLinks} disabled={isPending || isCheckingLinks}>
                {isCheckingLinks ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2Off className="mr-2 h-4 w-4" />}
                Check for dead links
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".html" />
        </div>
      </div>
      
      {filteredItems.length > 0 ? (
        renderItems(filteredItems)
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-2xl font-semibold text-muted-foreground font-headline">No Bookmarks Found</h3>
            <p className="mt-2 text-muted-foreground">
                {searchTerm ? "Try a different search term or " : "Your bookmark list is empty. "}
                <button onClick={handleAddNewBookmark} className="text-primary hover:underline font-semibold">add one now</button>.
            </p>
        </div>
      )}

      <ItemDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onItemSaved={handleSaveItem}
        itemToEdit={itemToEdit}
      />
      <PasswordConfirmationDialog
        isOpen={isPasswordDialogOpen}
        setIsOpen={setIsPasswordDialogOpen}
        onConfirm={handlePasswordConfirm}
        title="Confirm Replacement"
        description="This is a destructive action. To proceed, please enter your password to confirm you want to replace all your current bookmarks."
      />
      
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the selected item and, if it's a folder, all of its contents.
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
