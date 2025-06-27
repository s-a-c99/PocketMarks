"use client";

import { Folder as FolderIcon, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import type { Folder } from "@/types";
import { cn } from "@/lib/utils";

type FolderCardProps = {
  folder: Folder;
  onEdit: (folder: Folder) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
  isSelected: boolean;
  onSelectionChange: (id: string, checked: boolean) => void;
  hasDeadLink?: boolean;
};

export function FolderCard({ folder, onEdit, onDelete, onNavigate, isSelected, onSelectionChange, hasDeadLink }: FolderCardProps) {
  const { id, title } = folder;

  return (
    <TooltipProvider delayDuration={300}>
      <Card
        className={cn(
            "transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
            "bg-primary/10 hover:bg-primary/20 border-2 border-primary/30",
            hasDeadLink && "border-destructive bg-destructive/10"
        )}
        onClick={() => onNavigate(id)}
      >
        <CardHeader className="p-3 space-y-1">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-3">
               <Checkbox
                id={`select-${id}`}
                checked={isSelected}
                onCheckedChange={(checked) => onSelectionChange(id, !!checked)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select folder ${title}`}
              />
               {hasDeadLink && (
                 <Tooltip>
                    <TooltipTrigger>
                        <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>This folder contains one or more dead links.</p>
                    </TooltipContent>
                 </Tooltip>
               )}
              <FolderIcon className="h-5 w-5 text-primary shrink-0" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="font-headline text-sm font-semibold truncate cursor-pointer text-left hover:text-primary">
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
            </div>
          </div>
          <p className="text-xs text-muted-foreground/90 flex items-center gap-1 cursor-default ml-12">
            {folder.children.length} items
          </p>
        </CardHeader>
      </Card>
    </TooltipProvider>
  );
}
