"use client";

import { Folder as FolderIcon, Pencil, Trash2, FolderPlus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import type { Folder } from "@/types";

type FolderCardProps = {
  folder: Folder;
  onEdit: (folder: Folder) => void;
  onDelete: (id: string) => void;
  onAddInFolder: (id: string) => void;
  onNavigate: (id: string) => void;
  isSelected: boolean;
  onSelectionChange: (id: string, checked: boolean) => void;
};

export function FolderCard({ folder, onEdit, onDelete, onAddInFolder, onNavigate, isSelected, onSelectionChange }: FolderCardProps) {
  const { id, title } = folder;

  return (
    <TooltipProvider delayDuration={300}>
      <Card
        className="transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer bg-card hover:bg-muted/50 border-primary/20"
        onClick={() => onNavigate(id)}
      >
        <CardHeader className="p-2 space-y-1">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-2">
               <Checkbox
                id={`select-${id}`}
                checked={isSelected}
                onCheckedChange={(checked) => onSelectionChange(id, !!checked)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select folder ${title}`}
              />
              <FolderIcon className="h-4 w-4 text-primary shrink-0" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="font-headline text-xs font-semibold truncate cursor-pointer text-left hover:text-primary">
                    {title}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{title}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1 shrink-0">
               <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onAddInFolder(id); }}>
                        <FolderPlus className="h-3 w-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Add item in this folder</p></TooltipContent>
               </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(folder); }}>
                        <Pencil className="h-3 w-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Edit folder</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/80 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(id); }}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Delete folder</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/90 flex items-center gap-1 cursor-default ml-8">
            {folder.children.length} items
          </p>
        </CardHeader>
      </Card>
    </TooltipProvider>
  );
}
