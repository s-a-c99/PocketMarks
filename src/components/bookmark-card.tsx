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

type BookmarkCardProps = {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isSelected: boolean;
  onSelectionChange: (id: string, checked: boolean) => void;
};

export function BookmarkCard({ bookmark, onEdit, onDelete, onToggleFavorite, isSelected, onSelectionChange }: BookmarkCardProps) {
  const { id, title, url, isFavorite } = bookmark;

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="transition-all hover:shadow-md flex flex-col justify-between">
        <div>
          <CardHeader className="flex flex-row items-start gap-3 p-3 space-y-0">
            <div className="mt-1">
              <Checkbox
                id={`select-${id}`}
                checked={isSelected}
                onCheckedChange={(checked) => onSelectionChange(id, !!checked)}
                aria-label={`Select ${title}`}
              />
            </div>
            <Tooltip>
                <TooltipTrigger asChild>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate flex-1"
                    >
                        <CardTitle className="font-headline text-sm font-semibold hover:text-primary leading-snug">
                          {title}
                        </CardTitle>
                    </a>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{title}</p>
                </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="px-3 pb-2 pt-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <p
                  className="text-xs text-muted-foreground/90 flex items-center gap-1 truncate ml-7"
                >
                  <span className="truncate">{url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p>{url}</p>
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </div>
        <CardFooter className="flex justify-end gap-1 p-2 pt-0">
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
