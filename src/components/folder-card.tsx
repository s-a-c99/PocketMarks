"use client";

import { Folder as FolderIcon, Pencil, Trash2, Move } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import type { Folder } from "@/types";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type FolderCardProps = {
  folder: Folder;
  onEdit: (folder: Folder) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
  isSelected: boolean;
  onSelectionChange: (id: string, checked: boolean) => void;
  isDraggable?: boolean;
  isDropTarget?: boolean;
};

export function FolderCard({ folder, onEdit, onDelete, onNavigate, isSelected, onSelectionChange, isDraggable = false, isDropTarget = false }: FolderCardProps) {
  const { id, title } = folder;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Card 
        ref={setNodeRef}
        style={style}
        className={cn(
          "transition-all hover:shadow-lg flex flex-col justify-between bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 p-2",
          isDragging && "opacity-30 rotate-2 scale-95 z-0",
          isDraggable && "cursor-grab hover:scale-[1.02] hover:shadow-xl hover:bg-primary/25",
          isDraggable && isDragging && "cursor-grabbing",
          isDropTarget && "ring-2 ring-primary ring-opacity-70 bg-primary/30 scale-105 shadow-xl border-primary/60"
        )}
        {...attributes}
      >
        <div
          className="flex-grow cursor-pointer flex flex-col gap-1"
          onClick={() => onNavigate(id)}
        >
          <CardHeader className="flex flex-row items-start justify-between gap-4 p-0 space-y-0">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {isDraggable && (
                      <div 
                        {...listeners} 
                        className="flex items-center cursor-grab active:cursor-grabbing p-1 rounded hover:bg-primary/20 transition-colors" 
                        onClick={(e) => e.stopPropagation()}
                        title="Drag to reorder"
                      >
                        <Move className="h-3 w-3 text-primary hover:text-primary/80 transition-colors" />
                      </div>
                    )}
                    <FolderIcon className="h-4 w-4 text-primary shrink-0" />
                    <CardTitle className="font-headline text-xs font-semibold text-left leading-tight">
                        {title}
                    </CardTitle>
                </div>
            </div>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center h-4">
                        <Checkbox
                            id={`select-${id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => onSelectionChange(id, !!checked)}
                            aria-label={`Select folder ${title}`}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent><p>Select folder and all its contents</p></TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-xs text-muted-foreground/90 ml-6">
                {folder.children.length} items
            </p>
          </CardContent>
        </div>
        <CardFooter className="flex justify-end gap-1 p-0 pt-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(folder); }}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Edit folder</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(id); }}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Delete folder</p></TooltipContent>
            </Tooltip>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
