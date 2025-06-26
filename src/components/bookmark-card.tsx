"use client";

import { Pencil, Trash2, ExternalLink, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
  status?: string;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelectionChange: (id: string, checked: boolean) => void;
};

export function BookmarkCard({ bookmark, status, onEdit, onDelete, isSelected, onSelectionChange }: BookmarkCardProps) {
  const { id, title, url } = bookmark;
  const isOk = !status || status === 'ok';

  return (
    <TooltipProvider delayDuration={300}>
      <Card className={cn(
        "transition-all hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between",
        !isOk && "border-2 border-destructive bg-destructive/10 ring-2 ring-destructive/50 ring-offset-2 ring-offset-background"
      )}>
        <CardHeader className="p-2 space-y-1">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <Checkbox
                id={`select-${id}`}
                checked={isSelected}
                onCheckedChange={(checked) => onSelectionChange(id, !!checked)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${title}`}
              />
              {!isOk && (
                  <Tooltip>
                    <TooltipTrigger>
                        <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Link status: {status}</p>
                    </TooltipContent>
                  </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                      <CardTitle className="font-headline text-xs font-semibold truncate cursor-pointer text-left hover:text-primary">
                      {title}
                      </CardTitle>
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{title}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1 shrink-0">
               <Tooltip>
                <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Open in new tab</p></TooltipContent>
               </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); onEdit(bookmark); }}
                    >
                        <Pencil className="h-3 w-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Edit bookmark</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive/80 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Delete bookmark</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <p
                className="text-[11px] text-muted-foreground/90 flex items-center gap-1 truncate cursor-default ml-8"
              >
                <span className="truncate">{url.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <p>{url}</p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>
      </Card>
    </TooltipProvider>
  );
}
