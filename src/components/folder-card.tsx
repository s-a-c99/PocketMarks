"use client";

import { Folder as FolderIcon, Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
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
};

export function FolderCard({ folder, onEdit, onDelete, onNavigate, isSelected, onSelectionChange }: FolderCardProps) {
  const { id, title } = folder;

  return (
    <TooltipProvider delayDuration={300}>
      <Card className={cn("transition-all hover:shadow-lg flex flex-col justify-between bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 p-2 gap-1")}>
        <div
          className="flex-grow cursor-pointer"
          onClick={() => onNavigate(id)}
        >
          <CardHeader className="flex flex-row items-start gap-2 p-0 space-y-0">
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <Checkbox
                            id={`select-${id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => onSelectionChange(id, !!checked)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select folder ${title}`}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent><p>Select folder and all its contents</p></TooltipContent>
            </Tooltip>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <FolderIcon className="h-5 w-5 text-primary shrink-0" />
                    <CardTitle className="font-headline text-sm font-semibold text-left leading-tight">
                        {title}
                    </CardTitle>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-xs text-muted-foreground/90 ml-6">
                {folder.children.length} items
            </p>
          </CardContent>
        </div>
        <CardFooter className="flex justify-end gap-1 p-0">
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
