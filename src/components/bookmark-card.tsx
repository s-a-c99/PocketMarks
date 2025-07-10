"use client";

import { Pencil, Trash2, ExternalLink, Star, Move } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import type { Bookmark } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { forwardRef } from "react";

type BookmarkCardProps = {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isSelected: boolean;
  onSelectionChange: (id: string, checked: boolean, event?: React.MouseEvent) => void;
  onTagClick?: (tag: string) => void;
  isDraggable?: boolean;
  isDropTarget?: boolean;
};

export function BookmarkCard({ bookmark, onEdit, onDelete, onToggleFavorite, isSelected, onSelectionChange, onTagClick, isDraggable = false, isDropTarget = false }: BookmarkCardProps) {
  const { id, title, url, isFavorite, tags } = bookmark;
  
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
          "transition-all hover:shadow-md flex flex-col justify-between p-2 gap-1",
          isDragging && "opacity-30 rotate-2 scale-95 z-0",
          isDraggable && "cursor-grab hover:scale-[1.02] hover:shadow-lg",
          isDraggable && isDragging && "cursor-grabbing",
          isDropTarget && "ring-2 ring-primary ring-opacity-50 bg-primary/10 scale-105 shadow-lg"
        )}
        {...attributes}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-2 p-0 space-y-0">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {isDraggable && (
              <div 
                {...listeners} 
                className="flex items-center cursor-grab active:cursor-grabbing mt-1 p-1 rounded hover:bg-primary/10 transition-colors"
                title="Drag to reorder"
              >
                <Move className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
              </div>
            )}
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0"
            >
                <CardTitle className="font-headline text-xs font-semibold hover:text-primary leading-tight">
                  {title}
                </CardTitle>
            </a>
          </div>
          <div onClick={(e) => e.stopPropagation()} className="flex items-center h-4">
            <Checkbox
              id={`select-${id}`}
              checked={isSelected}
              onCheckedChange={(checked, event) => onSelectionChange(id, !!checked, event as React.MouseEvent)}
              aria-label={`Select ${title}`}
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-grow">
          <Tooltip>
            <TooltipTrigger asChild>
                <a href={url} target="_blank" rel="noopener noreferrer" className="block text-xs text-muted-foreground/90 truncate hover:underline">
                  {url.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>{url}</p>
            </TooltipContent>
          </Tooltip>
           {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5 max-h-8 overflow-hidden">
                {tags.slice(0, 3).map(tag => (
                    <Badge 
                        key={tag} 
                        variant="secondary" 
                        className={cn(
                            "text-xs px-1.5 py-0.5 leading-tight",
                            onTagClick && "cursor-pointer hover:bg-primary/20 transition-colors"
                        )}
                        onClick={onTagClick ? (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onTagClick(tag);
                        } : undefined}
                    >
                        {tag}
                    </Badge>
                ))}
                {tags.length > 3 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 leading-tight">
                        +{tags.length - 3}
                    </Badge>
                )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end gap-1 p-0">
           <Tooltip>
              <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                      </a>
                  </Button>
              </TooltipTrigger>
              <TooltipContent><p>Open in new tab</p></TooltipContent>
           </Tooltip>
          <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleFavorite(id)}>
                      <Star className={cn("h-4 w-4", isFavorite ? "text-primary fill-current" : "text-muted-foreground")} />
                  </Button>
              </TooltipTrigger>
              <TooltipContent><p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(bookmark)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Edit bookmark</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive/80 hover:text-destructive"
                onClick={() => onDelete(id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Delete bookmark</p></TooltipContent>
          </Tooltip>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
