"use client";

import { Pencil, Trash2, ExternalLink, Star } from "lucide-react";
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

type BookmarkCardProps = {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isSelected: boolean;
  onSelectionChange: (id: string, checked: boolean) => void;
};

export function BookmarkCard({ bookmark, onEdit, onDelete, onToggleFavorite, isSelected, onSelectionChange }: BookmarkCardProps) {
  const { id, title, url, isFavorite, tags } = bookmark;

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="transition-all hover:shadow-md flex flex-col justify-between p-2 gap-1">
        <CardHeader className="flex flex-row items-start justify-between gap-2 p-0 space-y-0">
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
          <div onClick={(e) => e.stopPropagation()} className="flex items-center h-4">
            <Checkbox
              id={`select-${id}`}
              checked={isSelected}
              onCheckedChange={(checked) => onSelectionChange(id, !!checked)}
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
            <div className="flex flex-wrap gap-1 mt-1.5">
                {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">{tag}</Badge>
                ))}
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
