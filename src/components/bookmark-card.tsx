"use client";

import { Globe, Pencil, Trash2, Tags, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Bookmark } from "@/types";

type BookmarkCardProps = {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
};

export function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
  const { id, title, url, description, tags, createdAt } = bookmark;
  
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const domain = (() => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  })();

  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-md hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start">
            <a href={url} target="_blank" rel="noopener noreferrer" className="group">
                <CardTitle className="font-headline text-xl mb-1 group-hover:text-primary transition-colors">{title}</CardTitle>
            </a>
            <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(bookmark)}>
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => onDelete(id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>{domain}</span>
            <ExternalLink className="h-3 w-3 opacity-50" />
        </a>
      </CardHeader>
      <CardContent className="flex-grow">
        {description && <CardDescription>{description}</CardDescription>}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Tags">
            <Tags className="h-4 w-4 mt-1 text-muted-foreground" />
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
            ))}
          </div>
        )}
        <div className="text-xs text-muted-foreground w-full text-right pt-2 border-t mt-auto">
          Added on {formattedDate}
        </div>
      </CardFooter>
    </Card>
  );
}
