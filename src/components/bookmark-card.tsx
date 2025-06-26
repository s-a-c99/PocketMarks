"use client";

import { Pencil, Trash2, ExternalLink, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
        "transition-all hover:shadow-md",
        !isOk && "border-destructive bg-destructive/10"
      )}>
        <CardHeader className="flex flex-row items-center justify-between p-3 space-y-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Checkbox
              id={`select-${id}`}
              checked={isSelected}
              onCheckedChange={(checked) => onSelectionChange(id, !!checked)}
              aria-label={`Select ${title}`}
            />
            {!isOk && (
                <Tooltip>
                    <TooltipTrigger>
                        <ShieldAlert className="h-4 w-4 text-destructive" />
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
                        className="truncate flex-1"
                    >
                        <CardTitle className="font-headline text-sm font-semibold truncate hover:text-primary">
                        {title}
                        </CardTitle>
                    </a>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{title}</p>
                </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1">
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
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-2 -mt-2 ml-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <p
                className="text-xs text-muted-foreground/90 flex items-center gap-1 truncate"
              >
                <span className="truncate">{url.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <p>{url}</p>
            </TooltipContent>
          </Tooltip>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
