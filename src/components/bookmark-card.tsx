"use client";

import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Bookmark } from "@/types";

type BookmarkCardProps = {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
};

export function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
  const { id, title, url } = bookmark;

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5">
      <CardHeader className="flex-grow p-4">
        <div className="flex justify-between items-start mb-2">
            <CardTitle className="font-headline text-base font-semibold leading-tight pr-2">{title}</CardTitle>
            <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(bookmark)}>
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80 hover:text-destructive" onClick={() => onDelete(id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary/90 hover:text-primary hover:underline flex items-center gap-1.5 break-all">
            <ExternalLink className="h-3 w-3 opacity-70 shrink-0" />
            <span>{url}</span>
        </a>
      </CardHeader>
    </Card>
  );
}
