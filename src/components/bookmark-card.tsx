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
      <CardHeader className="p-2">
        <div className="flex justify-between items-start mb-1">
            <CardTitle className="font-headline text-sm font-semibold pr-2">{title}</CardTitle>
            <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(bookmark)}>
                    <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/80 hover:text-destructive" onClick={() => onDelete(id)}>
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary/90 hover:text-primary hover:underline flex items-center gap-1 break-all">
            <ExternalLink className="h-2.5 w-2.5 opacity-70 shrink-0" />
            <span>{url}</span>
        </a>
      </CardHeader>
    </Card>
  );
}
