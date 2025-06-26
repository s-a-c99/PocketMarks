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
    <Card className="flex flex-col h-full transition-all hover:shadow-md hover:-translate-y-1">
      <CardHeader className="flex-grow">
        <div className="flex justify-between items-start mb-2">
            <CardTitle className="font-headline text-xl font-semibold">{title}</CardTitle>
            <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(bookmark)}>
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => onDelete(id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2 break-all">
            <span>{url}</span>
            <ExternalLink className="h-3 w-3 opacity-70 shrink-0" />
        </a>
      </CardHeader>
    </Card>
  );
}
