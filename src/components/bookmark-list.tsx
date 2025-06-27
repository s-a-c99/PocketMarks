"use client";

import { useState, useMemo, useTransition, useRef, useEffect } from "react";
import { Plus, FolderPlus, Link2Off, Loader2, ChevronDown } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import type { BookmarkItem, Folder } from "@/types";
import { BookmarkCard } from "./bookmark-card";
import { FolderCard } from "./folder-card";
import { ItemDialog } from "./item-dialog";
import { PasswordConfirmationDialog } from "./password-confirmation-dialog";
import { SyncComparisonDialog } from "./sync-comparison-dialog";
import { BreadcrumbNav } from "./breadcrumb-nav";
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
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Helper functions for navigation
const findItem = (items: BookmarkItem[], id: string): BookmarkItem | undefined => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.type === 'folder') {
      const found = findItem(item.children, id);
      if (found) return found;
    }
  }
};

const findPath = (items: BookmarkItem[], id: string): Folder[] => {
  for (const item of items) {
    if (item.id === id) return item.type === 'folder' ? [item as Folder] : [];
    if (item.type === 'folder') {
      const path = findPath(item.children, id);
      if (path.length > 0 || (path.length === 0 && item.children.some(c => c.id === id))) {
        return [item, ...path];
      }
    }
  }
  return [];
};

function sortItems(items: BookmarkItem[], sortBy: string): BookmarkItem[] {
  const sorted = [...items].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;

    switch (sortBy) {
      case 'date-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'date-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'alpha-asc':
        return a.title.localeCompare(b.title);
      case 'alpha-desc':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  return sorted.map(item => {
    if (item.type === 'folder') {
      return { ...item, children: sortItems(item.children, sortBy) };
    }
    return item;
  });
}

function filterItems(items: BookmarkItem[], term: string): BookmarkItem[] {
  if (!term) return items;
  const lowerCaseTerm = term.toLowerCase();

  const results: BookmarkItem[] = [];
  const traverse = (item: BookmarkItem) => {
    let matches = false;
    if(item.title.toLowerCase().includes(lowerCaseTerm)) {
        matches = true;
    }
    if(item.type === 'bookmark' && item.url.toLowerCase().includes(lowerCaseTerm)) {
        matches = true;
    }

    if (item.type === 'folder') {
        const childrenMatch = filterItems(item.children, term);
        if (childrenMatch.length > 0) {
            results.push({ ...item, children: childrenMatch });
            return; 
        }
    }
    
    if(matches) {
        results.push(item);
    }
  }
  
  const searchRecursive = (items: BookmarkItem[]): BookmarkItem[] => {
    const found: BookmarkItem[] = [];
    for (const item of items) {
      const titleMatch = item.title.toLowerCase().includes(lowerCaseTerm);
      const urlMatch = item.type === 'bookmark' && item.url.toLowerCase().includes(lowerCaseTerm);
      
      if (item.type === 'folder') {
        const childrenResults = searchRecursive(item.children);
        if (titleMatch || childrenResults.length > 0) {
          // If the folder title matches, we might not need to show all children, but for now we do to show context
          // For simplicity in search, we can "flatten" the results. Or just return the matching bookmarks.
        }
        found.push(...childrenResults);
      } else if (titleMatch || urlMatch) {
        found.push(item);
      }
    }
    return found;
  };
  
  return searchRecursive(items);
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
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [itemsToCompare, setItemsToCompare] = useState<BookmarkItem[]>([]);

  const [isCheckingLinks, setIsCheckingLinks] = useState(false);
  const [linkStatuses, setLinkStatuses] = useState<Record<string, string>>({});

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  
  const sortedItems = useMemo(() => sortItems(items, sortBy), [items, sortBy]);
  
  const currentFolder = useMemo(() => currentFolderId ? findItem(sortedItems, currentFolderId) as Folder : null, [sortedItems, currentFolderId]);
  const currentPath = useMemo(() => currentFolderId ? findPath(sortedItems, currentFolderId) : [], [sortedItems, currentFolderId]);
  
  const itemsToDisplay = useMemo(() => {
      if (searchTerm) {
          return filterItems(sortedItems, searchTerm);
      }
      return currentFolder ? currentFolder.children : sortedItems;
  }, [searchTerm, sortedItems, currentFolder]);

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
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemToDelete);
            return newSet;
        });
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
      saveItemAction(itemToSave, currentFolderId).then(() => {
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

    const fileContent = await file.text();
    if (!fileContent) return;
        
    startTransition(() => {
      importBookmarksAction({ fileContent, mode }).then((result) => {
        if (result.error) {
          toast({ variant: "destructive", title: "Import Failed", description: result.error });
        } else if (mode === 'replace' && result.needsPassword) {
           setPendingImportData(result.importedItems || []);
           setIsPasswordDialogOpen(true);
        } else if (mode === 'merge' && result.itemsToCompare && result.itemsToCompare.length > 0) {
          setItemsToCompare(result.itemsToCompare);
          setIsSyncDialogOpen(true);
        } else if (mode === 'merge') {
          toast({ title: "Nothing to import", description: "Your bookmarks are already up to date." });
        } else {
           toast({ title: "Import Successful", description: "Your bookmarks have been imported." });
        }
      });
    });
    
    if(event.target) event.target.value = '';
  };
  
  const handlePasswordConfirm = (password: string) => {
    if (!pendingImportData) return;
    startTransition(() => {
      importBookmarksAction({ items: pendingImportData, mode: 'replace', password: password }).then((result) => {
          if (result.error) {
              toast({ variant: "destructive", title: "Import Failed", description: result.error });
          } else {
              toast({ title: "Import Successful", description: "Your bookmarks have been replaced." });
          }
          setPendingImportData(null);
      });
    });
  };

  const handleSyncConfirm = (itemsToImport: BookmarkItem[]) => {
    startTransition(() => {
        importBookmarksAction({ items: itemsToImport, mode: 'merge' }).then((result) => {
            if (result.error) {
                toast({ variant: "destructive", title: "Merge Failed", description: result.error });
            } else {
                toast({ title: "Merge Successful", description: "Selected items have been added." });
            }
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
    if (selectedIds.size === 0) {
        toast({variant: "destructive", title: "Export Failed", description: "No items selected."});
        return;
    }
    startTransition(async () => {
        const htmlContent = await exportSelectedBookmarksAction(Array.from(selectedIds));
        if (htmlContent) {
            downloadHtmlFile(htmlContent, 'pocketmarks_selected_export.html');
            toast({title: "Export Successful", description: `${selectedIds.size} items have been downloaded.`});
            setSelectedIds(new Set());
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
    const item = findItem(items, itemId);
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
  
  return (
    <div className="w-full">
        <div className="flex flex-wrap items-center gap-4 mb-6">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] h-11">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                <SelectItem value="alpha-asc">Name (A-Z)</SelectItem>
                <SelectItem value="alpha-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleAddNewBookmark} className="font-headline h-11" disabled={isPending || isCheckingLinks}>
                <Plus className="mr-2 h-4 w-4" /> Add Bookmark
            </Button>
            <Button onClick={handleAddNewFolder} variant="outline" className="font-headline h-11" disabled={isPending || isCheckingLinks}>
                <FolderPlus className="mr-2 h-4 w-4" /> Add Folder
            </Button>
            
            <div className="relative w-full flex-grow sm:flex-grow-0 sm:w-80">
              <Input
                  placeholder="Search bookmarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 text-base w-full"
                  disabled={isPending || isCheckingLinks}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            
            <div className="flex gap-4 md:ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="font-headline h-11" disabled={isPending || isCheckingLinks}>
                    Import / Export <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleImportClick('merge')}>
                    Merge from file...
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleImportClick('replace')} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    Replace from file...
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExport} disabled={isPending || isCheckingLinks}>Export all...</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportSelected} disabled={isPending || isCheckingLinks || selectedIds.size === 0}>Export selected...</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" className="font-headline h-11" onClick={handleCheckLinks} disabled={isPending || isCheckingLinks}>
                  {isCheckingLinks ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2Off className="mr-2 h-4 w-4" />}
                  Check for dead links
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".html" />
            </div>
        </div>

        {!searchTerm && <BreadcrumbNav path={currentPath} onNavigate={setCurrentFolderId} />}

        {itemsToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-3">
                {itemsToDisplay.map(item =>
                    item.type === 'folder' ? (
                        <FolderCard
                            key={item.id}
                            folder={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onNavigate={setCurrentFolderId}
                            isSelected={selectedIds.has(item.id)}
                            onSelectionChange={handleSelectionChange}
                        />
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
        ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h3 className="text-2xl font-semibold text-muted-foreground font-headline">No Bookmarks Found</h3>
                <p className="mt-2 text-muted-foreground">
                    {searchTerm ? "Try a different search term. " : "This folder is empty. "}
                    <button onClick={handleAddNewBookmark} className="text-primary hover:underline font-semibold">Add a new bookmark</button> or
                    <button onClick={handleAddNewFolder} className="text-primary hover:underline font-semibold ml-1">folder</button>.
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
      <SyncComparisonDialog
        isOpen={isSyncDialogOpen}
        setIsOpen={setIsSyncDialogOpen}
        onConfirm={handleSyncConfirm}
        itemsToCompare={itemsToCompare}
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
