
"use client";

import { useState, useMemo, useTransition, useRef } from "react";
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
  compareBookmarksAction
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

function findItem(items: BookmarkItem[], itemId: string): BookmarkItem | undefined {
    if (!itemId) return undefined;
    for (const item of items) {
        if (item.id === itemId) return item;
        if (item.type === 'folder') {
            const found = findItem(item.children, itemId);
            if (found) return found;
        }
    }
    return undefined;
}

function findPath(items: BookmarkItem[], itemId: string): Folder[] {
    const find = (
        currentItems: BookmarkItem[],
        idToFind: string,
        currentPath: Folder[]
    ): Folder[] | null => {
        for (const item of currentItems) {
            if (item.id === idToFind) {
                // If it's a folder, path includes the item. If bookmark, it's just the parents.
                return item.type === 'folder' ? [...currentPath, item] : currentPath;
            }

            if (item.type === 'folder') {
                const newPath = [...currentPath, item];
                const result = find(item.children, idToFind, newPath);
                if (result) return result;
            }
        }
        return null;
    };
    return find(items, itemId, []) || [];
}

function filterItems(items: BookmarkItem[], term: string): BookmarkItem[] {
    if (!term) return items;
    const lowerCaseTerm = term.toLowerCase();

    return items.reduce((acc, item) => {
        if (item.title.toLowerCase().includes(lowerCaseTerm)) {
            if (item.type === 'folder') {
                acc.push({ ...item, children: filterItems(item.children, term) });
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
  const [itemToDelete, setItemToDelete] = useState<BookmarkItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<BookmarkItem[] | null>(null);

  const [isCheckingLinks, setIsCheckingLinks] = useState(false);
  const [linkStatuses, setLinkStatuses] = useState<Record<string, string>>({});

  const [sortOrder, setSortOrder] = useState("date-desc");
  
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [itemsToCompare, setItemsToCompare] = useState<BookmarkItem[]>([]);

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

    const reader = new FileReader();
    reader.onload = async (e) => {
        const content = e.target?.result as string;
        if (!content) return;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");

        // Rebuilt, robust recursive parser
        const parseBookmarksRecursive = (root: Element): BookmarkItem[] => {
            const items: BookmarkItem[] = [];
            if (!root) return items;

            const children = Array.from(root.children);

            for (const node of children) {
                if (node.tagName !== 'DT') {
                    continue;
                }

                const h3 = node.querySelector('H3');
                const a = node.querySelector('A');
                
                if (!h3 && !a) {
                    continue;
                }

                const add_date_attr = a?.getAttribute('add_date') || h3?.getAttribute('add_date');
                const add_date = add_date_attr ? parseInt(add_date_attr, 10) * 1000 : Date.now();
                const createdAt = new Date(add_date).toISOString();

                if (h3) { // It's a folder
                    const folder: Folder = {
                        id: uuidv4(),
                        type: 'folder',
                        title: h3.textContent || 'Untitled Folder',
                        children: [],
                        createdAt: createdAt,
                    };
                    
                    const nextDlElement = node.nextElementSibling;
                    if (nextDlElement && nextDlElement.tagName === 'DL') {
                        folder.children = parseBookmarksRecursive(nextDlElement);
                    }
                    items.push(folder);

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
            return items;
        }
        
        const rootDL = doc.querySelector('body > dl, body > DL');
        if (!rootDL) {
             toast({ variant: "destructive", title: "Import Failed", description: "Could not find a valid bookmark list in the file." });
             if(event.target) event.target.value = '';
             return;
        }

        const importedItems = parseBookmarksRecursive(rootDL);
        
        if (importedItems.length === 0) {
            toast({ variant: "destructive", title: "Import Failed", description: "No bookmarks or folders were found in the file." });
            if(event.target) event.target.value = '';
            return;
        }

        if (mode === 'replace') {
            setPendingImportData(importedItems);
            setIsPasswordDialogOpen(true);
        } else { // mode === 'merge'
            startTransition(async () => {
                const itemsForComparison = await compareBookmarksAction(importedItems);
                if (itemsForComparison.length > 0) {
                    setItemsToCompare(itemsForComparison);
                    setIsSyncDialogOpen(true);
                } else {
                    toast({ title: "Nothing to import", description: "Your bookmarks are already up to date." });
                }
            });
        }
    };
    
    reader.onerror = () => {
        toast({ variant: "destructive", title: "Import Failed", description: "Could not read the selected file." });
    }

    reader.readAsText(file);
    if(event.target) event.target.value = '';
  };


  const handleSyncConfirm = (itemsToImport: BookmarkItem[]) => {
      startTransition(() => {
          importBookmarksAction(itemsToImport, 'merge').then(() => {
              toast({ title: "Import Successful", description: "Your new bookmarks have been merged." });
          })
      });
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
    const item = findItem(currentItems, itemId);
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
  
  const handleNavigate = (folderId: string | null) => {
    if (folderId === currentFolderId) return;
    setCurrentFolderId(folderId);
  };
  
  const currentItems = useMemo(() => {
    if (!currentFolderId) return initialItems;
    const folder = findItem(initialItems, currentFolderId);
    return folder && folder.type === 'folder' ? folder.children : [];
  }, [currentFolderId, initialItems]);
  
 const breadcrumbs = useMemo(() => {
    if (!currentFolderId) return [];
    return findPath(initialItems, currentFolderId);
  }, [currentFolderId, initialItems]);


  const sortedItems = useMemo(() => {
    const itemsToSort = JSON.parse(JSON.stringify(currentItems));
    const sortFn = (a: BookmarkItem, b: BookmarkItem) => {
      if (a.type === 'folder' && b.type === 'bookmark') return -1;
      if (a.type === 'bookmark' && b.type === 'folder') return 1;

      switch (sortOrder) {
        case 'date-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date-desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'alpha-asc': return a.title.localeCompare(b.title);
        case 'alpha-desc': return b.title.localeCompare(a.title);
        default: return 0;
      }
    };
    return itemsToSort.sort(sortFn);
  }, [currentItems, sortOrder]);

  const filteredItems = useMemo(() => filterItems(sortedItems, searchTerm), [sortedItems, searchTerm]);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-4 mb-4 flex-wrap">
        <div className="flex-grow flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Input
                placeholder="Search bookmarks, folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={isPending || isCheckingLinks}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-muted-foreground">Sort:</span>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10">
                      <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="date-desc">Date (Newest)</SelectItem>
                      <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                      <SelectItem value="alpha-asc">Title (A-Z)</SelectItem>
                      <SelectItem value="alpha-desc">Title (Z-A)</SelectItem>
                  </SelectContent>
              </Select>
            </div>
        </div>

        <div className="flex gap-2 flex-wrap">
            <Button onClick={handleAddNewBookmark} className="font-headline" disabled={isPending || isCheckingLinks}>
                <Plus className="mr-2 h-4 w-4" /> Bookmark
            </Button>
            <Button onClick={handleAddNewFolder} variant="outline" className="font-headline" disabled={isPending || isCheckingLinks}>
                <FolderPlus className="mr-2 h-4 w-4" /> Folder
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="font-headline" disabled={isPending || isCheckingLinks}>
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

            <Button variant="outline" className="font-headline" onClick={handleExport} disabled={isPending || isCheckingLinks}>Export All</Button>
            <Button variant="outline" className="font-headline" onClick={handleExportSelected} disabled={isPending || isCheckingLinks || selectedIds.size === 0}>Export Selected</Button>
            <Button variant="outline" className="font-headline" onClick={handleCheckLinks} disabled={isPending || isCheckingLinks}>
                {isCheckingLinks ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2Off className="mr-2 h-4 w-4" />}
                Check for dead links
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".html" />
        </div>
      </div>
      
      <BreadcrumbNav path={breadcrumbs} onNavigate={handleNavigate} />
      
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mt-4">
          {filteredItems.map(item => (
            item.type === 'folder' ? (
              <FolderCard 
                key={item.id} 
                folder={item} 
                onEdit={handleEdit} 
                onDelete={() => handleDelete(item)} 
                onNavigate={() => handleNavigate(item.id)}
                isSelected={selectedIds.has(item.id)}
                onSelectionChange={handleSelectionChange}
              />
            ) : (
              <BookmarkCard 
                key={item.id} 
                bookmark={item}
                status={linkStatuses[item.id]} 
                onEdit={handleEdit} 
                onDelete={() => handleDelete(item)} 
                isSelected={selectedIds.has(item.id)} 
                onSelectionChange={handleSelectionChange}
              />
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg mt-4">
            <h3 className="text-xl font-semibold text-muted-foreground font-headline">No Items Found</h3>
            <p className="mt-2 text-muted-foreground">
                {searchTerm ? "Try a different search term or " : "This folder is empty. "}
                <button onClick={handleAddNewBookmark} className="text-primary hover:underline font-semibold">add a bookmark now</button>.
            </p>
        </div>
      )}

      <ItemDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onItemSaved={handleSaveItem}
        itemToEdit={itemToEdit}
      />
      
      <SyncComparisonDialog
        isOpen={isSyncDialogOpen}
        setIsOpen={setIsSyncDialogOpen}
        itemsToCompare={itemsToCompare}
        onConfirm={handleSyncConfirm}
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
