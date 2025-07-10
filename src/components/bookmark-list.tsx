
"use client";

import { useState, useMemo, useTransition, useRef, useEffect } from "react";
import { Plus, FolderPlus, Loader2, ChevronDown, Search, Ban, Trash2, Import, Download, X, ExternalLink, Undo2, Redo2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import type { BookmarkItem, Folder, Bookmark } from "@/types";
import { BookmarkCard } from "./bookmark-card";
import { FolderCard } from "./folder-card";
import { ItemDialog } from "./item-dialog";
import { PasswordConfirmationDialog } from "./password-confirmation-dialog";
import { SyncComparisonDialog } from "./sync-comparison-dialog";
import { BreadcrumbNav } from "./breadcrumb-nav";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  deleteItemAction,
  saveItemAction,
  importBookmarksAction,
  exportBookmarksAction,
  exportSelectedBookmarksAction,
  toggleFavoriteAction,
  deleteSelectedItemsAction,
  reorderItemsAction,
} from "@/lib/actions";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { arrayMove } from "@dnd-kit/sortable";
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
import { DuplicateDialog } from "./duplicate-dialog";


// Helper functions for navigation
const findItem = (items: BookmarkItem[], id: string): BookmarkItem | undefined => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.type === 'folder') {
      const found = findItem(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
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
    // Favorites always on top
    if (a.type === 'bookmark' && a.isFavorite && (b.type !== 'bookmark' || !b.isFavorite)) return -1;
    if (b.type === 'bookmark' && b.isFavorite && (a.type !== 'bookmark' || !a.isFavorite)) return 1;

    // Folders before bookmarks (if not favorite)
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;

    switch (sortBy) {
      case 'custom':
        return 0; // Maintain current order for drag & drop
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
  
  const searchRecursive = (items: BookmarkItem[]): BookmarkItem[] => {
    const found: BookmarkItem[] = [];
    for (const item of items) {
      const titleMatch = item.title.toLowerCase().includes(lowerCaseTerm);
      const urlMatch = item.type === 'bookmark' && item.url.toLowerCase().includes(lowerCaseTerm);
      const tagMatch = item.type === 'bookmark' && item.tags?.some(tag => tag.toLowerCase().includes(lowerCaseTerm));
      
      if (item.type === 'folder') {
        const childrenResults = searchRecursive(item.children);
        // If the folder itself matches, add it and all its children. Otherwise, add only matching children.
        if (titleMatch) {
            found.push(item);
        } else {
            found.push(...childrenResults);
        }
      } else if (titleMatch || urlMatch || tagMatch) {
        found.push(item);
      }
    }
    return found;
  };
  
  return searchRecursive(items);
}

function filterItemsByTag(items: BookmarkItem[], tag: string): BookmarkItem[] {
  if (!tag) return items;
  
  const filterRecursive = (items: BookmarkItem[]): BookmarkItem[] => {
    const found: BookmarkItem[] = [];
    for (const item of items) {
      if (item.type === 'bookmark' && item.tags?.includes(tag)) {
        found.push(item);
      } else if (item.type === 'folder') {
        const filteredChildren = filterRecursive(item.children);
        if (filteredChildren.length > 0) {
          found.push({ ...item, children: filteredChildren });
        }
      }
    }
    return found;
  };
  
  return filterRecursive(items);
}

const deleteItemsRecursive = (items: BookmarkItem[], idsToDelete: Set<string>): BookmarkItem[] => {
    return items
        .filter(item => !idsToDelete.has(item.id))
        .map(item => {
            if (item.type === 'folder' && item.children) {
                return { ...item, children: deleteItemsRecursive(item.children, idsToDelete) };
            }
            return item;
        });
};

function ParentDropZone({ isOver }: { isOver: boolean }) {
  const { setNodeRef } = useDroppable({
    id: 'move-to-parent',
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "mb-4 p-4 border-2 border-dashed rounded-lg transition-all",
        isOver 
          ? "border-primary bg-primary/10 scale-105" 
          : "border-muted-foreground/30 bg-muted/20"
      )}
    >
      <div className="text-center text-sm text-muted-foreground">
        <div className="font-medium">↑ Move to Parent Level</div>
        <div className="text-xs">Drop here to move out of this folder</div>
      </div>
    </div>
  );
}


export function BookmarkList({ initialItems }: { initialItems: BookmarkItem[] }) {
  const [items, setItems] = useState<BookmarkItem[]>(initialItems);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<BookmarkItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isConfirmingMultiDelete, setIsConfirmingMultiDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<BookmarkItem[] | null>(null);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [itemsToCompare, setItemsToCompare] = useState<BookmarkItem[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingItem, setPendingItem] = useState<Omit<Bookmark, 'id' | 'children' | 'createdAt'> | null>(null);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('custom');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [overId, setOverId] = useState<string | null>(null);
  
  // Undo/Redo system
  const [history, setHistory] = useState<BookmarkItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setItems(initialItems);
    // Initialize history with initial items
    if (history.length === 0) {
      setHistory([initialItems]);
      setHistoryIndex(0);
    }
  }, [initialItems]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const sortedItems = useMemo(() => sortItems(items, sortBy), [items, sortBy]);
  
  const currentFolder = useMemo(() => currentFolderId ? findItem(sortedItems, currentFolderId) as Folder : null, [sortedItems, currentFolderId]);
  const currentPath = useMemo(() => currentFolderId ? findPath(sortedItems, currentFolderId) : [], [sortedItems, currentFolderId]);
  
  const itemsToDisplay = useMemo(() => {
      let itemsToFilter = currentFolder ? currentFolder.children : sortedItems;
      
      if (debouncedSearchTerm) {
          itemsToFilter = filterItems(itemsToFilter, debouncedSearchTerm);
      }
      
      if (selectedTag) {
          itemsToFilter = filterItemsByTag(itemsToFilter, selectedTag);
      }
      
      return itemsToFilter;
  }, [debouncedSearchTerm, selectedTag, sortedItems, currentFolder]);

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

    const originalItems = items;
    setItems(currentItems => deleteItemsRecursive(currentItems, new Set([itemToDelete!])));
    setItemToDelete(null);

    startTransition(() => {
      deleteItemAction(itemToDelete).then((result) => {
        if (result?.error) {
          toast({ variant: "destructive", title: "Deletion Failed", description: result.error });
          setItems(originalItems); // Revert on error
        } else {
          toast({ title: "Item deleted", description: "The item has been removed." });
          setSelectedIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(itemToDelete!);
              return newSet;
          });
        }
      }).catch(() => {
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not connect to the server." });
        setItems(originalItems); // Revert on error
      });
    });
  };

  const handleConfirmMultiDelete = () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;
  
    const originalItems = items;
    setItems(currentItems => deleteItemsRecursive(currentItems, new Set(idsToDelete)));
    setSelectedIds(new Set());
    setIsConfirmingMultiDelete(false);
  
    startTransition(() => {
      deleteSelectedItemsAction(idsToDelete).then(result => {
        if (result?.error) {
          toast({ variant: "destructive", title: "Deletion Failed", description: result.error });
          setItems(originalItems); // Revert on failure
        } else {
          toast({ title: `${idsToDelete.length} items deleted`, description: "The selected items have been removed." });
        }
      }).catch(() => {
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not connect to the server." });
        setItems(originalItems); // Revert on failure
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
        setIsDialogOpen(false);
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
                setIsSyncDialogOpen(false);
            }
        });
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
  
  const normalizeClientUrl = (url: string): string => {
      try {
          const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
          return (urlObj.hostname.replace(/^www\./, '') + urlObj.pathname).replace(/\/$/, '');
      } catch (e) {
          return url.trim().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
      }
  }

  const checkForDuplicate = (url: string): boolean => {
    const normalizedUrl = normalizeClientUrl(url);
    const findRecursive = (items: BookmarkItem[]): boolean => {
      for (const item of items) {
        if (item.type === 'bookmark' && normalizeClientUrl(item.url) === normalizedUrl) {
          return true;
        }
        if (item.type === 'folder' && findRecursive(item.children)) {
          return true;
        }
      }
      return false;
    };
    return findRecursive(items);
  };

  const handleDialogSubmit = (values: Omit<BookmarkItem, 'id' | 'children' | 'createdAt'>) => {
    if (values.type === 'bookmark' && !itemToEdit && checkForDuplicate(values.url)) {
        setPendingItem(values as Omit<Bookmark, 'id' | 'children'| 'createdAt'>);
        setShowDuplicateDialog(true);
        return;
    }
    handleSaveItem(values);
  };

  const handleConfirmDuplicate = () => {
      if(pendingItem) {
          handleSaveItem(pendingItem);
      }
      setShowDuplicateDialog(false);
      setPendingItem(null);
  }

  const handleToggleFavorite = (id: string) => {
    startTransition(() => {
        toggleFavoriteAction(id);
    });
  }

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setSearchTerm('');
  };

  const handleClearTagFilter = () => {
    setSelectedTag(null);
  };

  // Undo/Redo functionality
  const saveToHistory = (newItems: BookmarkItem[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newItems]);
    if (newHistory.length > 50) { // Limit history to 50 entries
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    setHistory(newHistory);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setItems([...previousState]);
      setHistoryIndex(historyIndex - 1);
      toast({
        title: "Undone",
        description: "Last action has been undone.",
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setItems([...nextState]);
      setHistoryIndex(historyIndex + 1);
      toast({
        title: "Redone",
        description: "Action has been redone.",
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsDragging(true);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setIsDragging(false);
    setOverId(null);
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const activeItem = findItem(items, active.id as string);
    
    if (!activeItem) return;

    // Check if moving to parent level
    if (over.id === 'move-to-parent' && currentFolderId) {
      try {
        // Safely determine parent folder
        const parentFolder = currentPath.length > 1 ? currentPath[currentPath.length - 2] : null;
        const targetParentId = parentFolder ? parentFolder.id : null; // null means root level
        
        console.log('Moving to parent level:', { activeItem: activeItem.id, targetParentId, currentPath });
        
        // Store original state for potential rollback and save to history
        const originalItems = items;
        saveToHistory(originalItems);
        
        // Move item to parent level
        setItems(current => {
          try {
            const removeItemRecursively = (items: BookmarkItem[], itemId: string): BookmarkItem[] => {
              return items
                .filter(item => item.id !== itemId)
                .map(item => {
                  if (item.type === 'folder') {
                    return { ...item, children: removeItemRecursively(item.children, itemId) };
                  }
                  return item;
                });
            };

            const addItemToLevel = (items: BookmarkItem[], parentId: string | null, newItem: BookmarkItem): BookmarkItem[] => {
              if (!parentId) {
                // Add to root level
                return [...items, newItem];
              }
              return items.map(item => {
                if (item.type === 'folder' && item.id === parentId) {
                  return { ...item, children: [...item.children, newItem] };
                }
                if (item.type === 'folder') {
                  return { ...item, children: addItemToLevel(item.children, parentId, newItem) };
                }
                return item;
              });
            };

            let updatedItems = removeItemRecursively(current, activeItem.id);
            updatedItems = addItemToLevel(updatedItems, targetParentId, activeItem);
            return updatedItems;
          } catch (error) {
            console.error('Error in state update for move to parent:', error);
            return current; // Return unchanged state on error
          }
        });

        // Save to server
        startTransition(() => {
          saveItemAction(activeItem, targetParentId).then(() => {
            toast({
              title: "Moved to parent level",
              description: `${activeItem.title} has been moved ${targetParentId ? 'to parent folder' : 'to root level'}.`,
            });
          }).catch((error) => {
            console.error('Error saving move to parent:', error);
            toast({
              variant: "destructive",
              title: "Move Failed",
              description: "Could not move item to parent level.",
            });
            // Revert to original state on error
            setItems(originalItems);
          });
        });
        return;
      } catch (error) {
        console.error('Error in move to parent level:', error);
        toast({
          variant: "destructive",
          title: "Move Failed",
          description: "An error occurred while moving the item.",
        });
        return;
      }
    }

    const overItem = findItem(items, over.id as string);
    if (!overItem) return;

    // Check if dropping into a folder
    if (overItem.type === 'folder') {
      try {
        console.log('Moving to folder:', { activeItem: activeItem.id, targetFolder: overItem.id });
        
        // Store original state for potential rollback and save to history
        const originalItems = items;
        saveToHistory(originalItems);
        
        // Move item into the folder
        setItems(current => {
          try {
            const removeItemRecursively = (items: BookmarkItem[], itemId: string): BookmarkItem[] => {
              return items
                .filter(item => item.id !== itemId)
                .map(item => {
                  if (item.type === 'folder') {
                    return { ...item, children: removeItemRecursively(item.children, itemId) };
                  }
                  return item;
                });
            };

            const addItemToFolder = (items: BookmarkItem[], folderId: string, newItem: BookmarkItem): BookmarkItem[] => {
              return items.map(item => {
                if (item.type === 'folder' && item.id === folderId) {
                  return { ...item, children: [...item.children, newItem] };
                }
                if (item.type === 'folder') {
                  return { ...item, children: addItemToFolder(item.children, folderId, newItem) };
                }
                return item;
              });
            };

            let updatedItems = removeItemRecursively(current, activeItem.id);
            updatedItems = addItemToFolder(updatedItems, overItem.id, activeItem);
            return updatedItems;
          } catch (error) {
            console.error('Error in state update for move to folder:', error);
            return current; // Return unchanged state on error
          }
        });

        // Save to server - move to folder
        startTransition(() => {
          saveItemAction(activeItem, overItem.id).then(() => {
            toast({
              title: "Moved to folder",
              description: `${activeItem.title} has been moved to "${overItem.title}".`,
            });
          }).catch((error) => {
            console.error('Error saving move to folder:', error);
            toast({
              variant: "destructive",
              title: "Move Failed",
              description: "Could not move item to folder.",
            });
            // Revert to original state on error
            setItems(originalItems);
          });
        });
      } catch (error) {
        console.error('Error in move to folder:', error);
        toast({
          variant: "destructive",
          title: "Move Failed",
          description: "An error occurred while moving the item.",
        });
        return;
      }
    } else {
      // Regular reordering within same level
      const activeIndex = itemsToDisplay.findIndex(item => item.id === active.id);
      const overIndex = itemsToDisplay.findIndex(item => item.id === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        const newItems = arrayMove(itemsToDisplay, activeIndex, overIndex);
        
        // Update local state immediately for smooth UX
        setItems(current => {
          const updateItemsRecursively = (items: BookmarkItem[]): BookmarkItem[] => {
            if (currentFolder) {
              return items.map(item => {
                if (item.type === 'folder' && item.id === currentFolder.id) {
                  return { ...item, children: newItems };
                }
                if (item.type === 'folder') {
                  return { ...item, children: updateItemsRecursively(item.children) };
                }
                return item;
              });
            }
            return newItems;
          };
          
          return updateItemsRecursively(current);
        });
        
        // Save to server
        startTransition(() => {
          reorderItemsAction(
            active.id as string,
            overIndex,
            currentFolderId || undefined
          ).then((result) => {
            if (result.error) {
              toast({
                variant: "destructive",
                title: "Reorder Failed",
                description: result.error,
              });
              // Revert on error - restore previous state instead of initialItems
              setItems(current => {
                const revertItemsRecursively = (items: BookmarkItem[]): BookmarkItem[] => {
                  if (currentFolder) {
                    return items.map(item => {
                      if (item.type === 'folder' && item.id === currentFolder.id) {
                        return { ...item, children: itemsToDisplay };
                      }
                      if (item.type === 'folder') {
                        return { ...item, children: revertItemsRecursively(item.children) };
                      }
                      return item;
                    });
                  }
                  return itemsToDisplay;
                };
                
                return revertItemsRecursively(current);
              });
            } else {
              // Success feedback
              const activeItem = findItem(items, active.id as string);
              toast({
                title: "Reordered successfully",
                description: `${activeItem?.title || 'Item'} has been moved to position ${overIndex + 1}.`,
              });
            }
          });
        });
      }
    }
  };

  const getBookmarksFromSelection = (): Bookmark[] => {
    const bookmarks: Bookmark[] = [];
    const processItem = (item: BookmarkItem) => {
      if (item.type === 'bookmark') {
        bookmarks.push(item);
      } else if (item.type === 'folder') {
        item.children.forEach(processItem);
      }
    };
    
    items.forEach(item => {
      if (selectedIds.has(item.id)) {
        processItem(item);
      }
    });
    
    return bookmarks;
  };

  const handleOpenAll = () => {
    const bookmarks = getBookmarksFromSelection();
    if (bookmarks.length > 10) {
      const confirmed = confirm(`This will open ${bookmarks.length} bookmarks. Are you sure?`);
      if (!confirmed) return;
    }
    
    bookmarks.forEach(bookmark => {
      window.open(bookmark.url, '_blank');
    });
    
    toast({
      title: "Opened bookmarks",
      description: `${bookmarks.length} bookmarks opened in new tabs.`
    });
  };

  const handleOpenInNewTab = () => {
    const bookmarks = getBookmarksFromSelection();
    if (bookmarks.length === 0) return;
    
    if (bookmarks.length > 10) {
      const confirmed = confirm(`This will open ${bookmarks.length} bookmarks. Are you sure?`);
      if (!confirmed) return;
    }
    
    bookmarks.forEach(bookmark => {
      window.open(bookmark.url, '_blank');
    });
    
    setSelectedIds(new Set());
    toast({
      title: "Opened bookmarks",
      description: `${bookmarks.length} bookmarks opened in new tabs.`
    });
  };
  
  const isDragAndDropEnabled = !debouncedSearchTerm && !selectedTag && sortBy === 'custom';
  const activeItem = activeId ? findItem(items, activeId) : null;

  return (
    <div className="w-full">
        <div className="flex flex-wrap items-center gap-2 mb-6">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-auto h-11 flex-shrink-0">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Order 🔄</SelectItem>
                <SelectItem value="date-desc">Date (Newest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                <SelectItem value="alpha-asc">Name (A-Z)</SelectItem>
                <SelectItem value="alpha-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
            {isDragAndDropEnabled && (
              <>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Drag & drop enabled
                </span>
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="h-8 w-8 p-0"
                    title="Undo last drag operation"
                  >
                    <Undo2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="h-8 w-8 p-0"
                    title="Redo last undone operation"
                  >
                    <Redo2 className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}

            <Button onClick={handleAddNewBookmark} className="font-headline h-11" disabled={isPending}>
                <Plus className="mr-2 h-4 w-4" /> Add Bookmark
            </Button>
            <Button onClick={handleAddNewFolder} variant="outline" className="font-headline h-11" disabled={isPending}>
                <FolderPlus className="mr-2 h-4 w-4" /> Add Folder
            </Button>
            
            {selectedIds.size > 0 && (
              <>
                <Button variant="outline" className="font-headline h-11" onClick={() => setSelectedIds(new Set())} disabled={isPending}>
                  <Ban className="mr-2 h-4 w-4" />
                  Clear Selection ({selectedIds.size})
                </Button>
                <Button variant="outline" className="font-headline h-11" onClick={handleOpenInNewTab} disabled={isPending}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open All
                </Button>
                <Button variant="destructive" className="font-headline h-11" onClick={() => setIsConfirmingMultiDelete(true)} disabled={isPending}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
              </>
            )}

            <div className="relative flex-grow min-w-[200px] sm:min-w-0 sm:flex-1">
              <Input
                  placeholder="Search bookmarks, URLs, tags..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value) setSelectedTag(null);
                  }}
                  className="pl-10 h-11 text-base w-full"
                  disabled={isPending}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              {searchTerm && searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="font-headline h-11" disabled={isPending}>
                    Import / Export <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleImportClick('merge')}>
                    <Import className="mr-2 h-4 w-4" />
                    Merge from file...
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleImportClick('replace')} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Import className="mr-2 h-4 w-4" />
                    Replace from file...
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExport} disabled={isPending}>
                    <Download className="mr-2 h-4 w-4" />
                    Export all...
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportSelected} disabled={isPending || selectedIds.size === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export selected...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".html" />
            </div>
        </div>

        {!debouncedSearchTerm && !selectedTag && <BreadcrumbNav path={currentPath} onNavigate={setCurrentFolderId} />}
        
        {selectedTag && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Filtered by tag:</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearTagFilter}
              className="h-8"
            >
              {selectedTag}
              <X className="ml-2 h-3 w-3" />
            </Button>
            {itemsToDisplay.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const bookmarks = itemsToDisplay.filter(item => item.type === 'bookmark') as Bookmark[];
                  if (bookmarks.length > 10) {
                    const confirmed = confirm(`This will open ${bookmarks.length} bookmarks. Are you sure?`);
                    if (!confirmed) return;
                  }
                  bookmarks.forEach(bookmark => window.open(bookmark.url, '_blank'));
                  toast({
                    title: "Opened bookmarks",
                    description: `${bookmarks.length} bookmarks with tag "${selectedTag}" opened.`
                  });
                }}
                className="h-8"
              >
                <ExternalLink className="mr-2 h-3 w-3" />
                Open All ({itemsToDisplay.filter(item => item.type === 'bookmark').length})
              </Button>
            )}
          </div>
        )}

        {itemsToDisplay.length > 0 ? (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={itemsToDisplay.map(item => item.id)}
                strategy={rectSortingStrategy}
                disabled={!isDragAndDropEnabled}
              >
                {/* Move to Parent Drop Zone - only show when in a folder and dragging */}
                {currentFolderId && isDragging && (
                  <ParentDropZone isOver={overId === 'move-to-parent'} />
                )}
                
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
                                isDraggable={isDragAndDropEnabled}
                                isDropTarget={overId === item.id && isDragging}
                            />
                        ) : (
                            <BookmarkCard
                                key={item.id}
                                bookmark={item}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleFavorite={handleToggleFavorite}
                                isSelected={selectedIds.has(item.id)}
                                onSelectionChange={handleSelectionChange}
                                onTagClick={handleTagClick}
                                isDraggable={isDragAndDropEnabled}
                                isDropTarget={overId === item.id && isDragging}
                            />
                        )
                    )}
                </div>
              </SortableContext>
              
              <DragOverlay>
                {activeItem && (
                  <div className="rotate-6 scale-110 opacity-90 shadow-2xl ring-2 ring-primary/50 transform transition-transform duration-200 cursor-grabbing">
                    {activeItem.type === 'folder' ? (
                      <FolderCard
                        folder={activeItem}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onNavigate={() => {}}
                        isSelected={false}
                        onSelectionChange={() => {}}
                        isDraggable={false}
                      />
                    ) : (
                      <BookmarkCard
                        bookmark={activeItem}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onToggleFavorite={() => {}}
                        isSelected={false}
                        onSelectionChange={() => {}}
                        isDraggable={false}
                      />
                    )}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
        ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h3 className="text-2xl font-semibold text-muted-foreground font-headline">No Bookmarks Found</h3>
                <p className="mt-2 text-muted-foreground">
                    {debouncedSearchTerm ? "Try a different search term. " : "This folder is empty. "}
                    <button onClick={handleAddNewBookmark} className="text-primary hover:underline font-semibold">Add a new bookmark</button> or
                    <button onClick={handleAddNewFolder} className="text-primary hover:underline font-semibold ml-1">folder</button>.
                </p>
            </div>
        )}

      <ItemDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onItemSaved={handleDialogSubmit}
        itemToEdit={itemToEdit}
      />
      <DuplicateDialog
        isOpen={showDuplicateDialog}
        onCancel={() => {
            setShowDuplicateDialog(false);
            setPendingItem(null);
        }}
        onConfirm={handleConfirmDuplicate}
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

      <AlertDialog open={isConfirmingMultiDelete} onOpenChange={setIsConfirmingMultiDelete}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete Selected Items?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the {selectedIds.size} selected items. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmMultiDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
