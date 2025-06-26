"use client";

import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Bookmark } from "@/types";

type BookmarkCardProps = {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
};

export function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
  const { id, title, url } = bookmark;

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="transition-all hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between">
        <CardHeader className="p-2 space-y-1">
          <div className="flex justify-between items-start gap-2">
             <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0"
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

            <div className="flex items-center gap-1 shrink-0">
               <Tooltip>
                <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="icon" className="h-6 w-6">
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
                        onClick={() => onEdit(bookmark)}
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
                        onClick={() => onDelete(id)}
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
                className="text-[11px] text-muted-foreground/90 flex items-center gap-1 truncate cursor-default"
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
