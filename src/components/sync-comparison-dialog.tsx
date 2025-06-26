"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Folder as FolderIcon, Link as BookmarkIcon } from "lucide-react";
import type { BookmarkItem } from "@/types";
import { cn } from "@/lib/utils";

type SyncComparisonDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onConfirm: (itemsToImport: BookmarkItem[]) => void;
  itemsToCompare: BookmarkItem[];
};

export function SyncComparisonDialog({ isOpen, setIsOpen, onConfirm, itemsToCompare }: SyncComparisonDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getDescendantIds = (item: BookmarkItem): string[] => {
    const ids = [item.id];
    if (item.type === 'folder') {
      item.children.forEach(child => ids.push(...getDescendantIds(child)));
    }
    return ids;
  };

  useEffect(() => {
    if (isOpen) {
      const allIds = new Set<string>();
      itemsToCompare.forEach(item => getDescendantIds(item).forEach(id => allIds.add(id)));
      setSelectedIds(allIds);
    }
  }, [isOpen, itemsToCompare]);

  const handleSelectionChange = (item: BookmarkItem, checked: boolean) => {
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

  const handleConfirm = () => {
    const filterSelected = (items: BookmarkItem[]): BookmarkItem[] => {
        return items.reduce((acc, item) => {
            if (selectedIds.has(item.id)) {
                if (item.type === 'folder') {
                    const newChildren = filterSelected(item.children);
                    // Keep folder if it's selected, even if empty, or if it has selected children
                    acc.push({ ...item, children: newChildren });
                } else {
                    acc.push(item);
                }
            }
            return acc;
        }, [] as BookmarkItem[]);
    }
    onConfirm(filterSelected(itemsToCompare));
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };
  
  const renderItem = (item: BookmarkItem, level = 0) => {
      const isSelected = selectedIds.has(item.id);
      return (
        <div key={item.id}>
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted" style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}>
                <Checkbox
                    id={`compare-${item.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectionChange(item, !!checked)}
                />
                {item.type === 'folder' ? <FolderIcon className="h-4 w-4 text-primary" /> : <BookmarkIcon className="h-4 w-4 text-primary" />}
                <label htmlFor={`compare-${item.id}`} className="text-sm font-medium truncate flex-1 cursor-pointer">{item.title}</label>
            </div>
            {item.type === 'folder' && item.children.length > 0 && (
                <div className={cn("transition-all duration-300", isSelected ? "max-h-full" : "max-h-0 overflow-hidden")}>
                  {item.children.map(child => renderItem(child, level + 1))}
                </div>
            )}
        </div>
      )
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-xl bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">Review Import</DialogTitle>
          <DialogDescription>
            The following new items were found in your import file. Uncheck any you do not want to add.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 my-4 border rounded-md p-2">
            {itemsToCompare.length > 0 ? itemsToCompare.map(item => renderItem(item)) : <p className="text-center text-muted-foreground p-4">No new bookmarks found.</p>}
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button type="button" onClick={handleConfirm} className="font-headline" disabled={selectedIds.size === 0}>Import Selected</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
