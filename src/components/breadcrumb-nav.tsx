"use client";

import { ChevronRight, Home } from "lucide-react";
import type { Folder } from "@/types";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type BreadcrumbNavProps = {
  path: Folder[];
  onNavigate: (folderId: string | null) => void;
  currentFolderId: string | null;
};

export function BreadcrumbNav({ path, onNavigate, currentFolderId }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center text-sm font-medium text-muted-foreground mb-4 flex-wrap">
      <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => onNavigate(null)}>
        <Home className="h-4 w-4 mr-1" />
        Home
      </Button>
      {path.map((folder, index) => (
        <div key={folder.id} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
           <Button
            variant="ghost"
            size="sm"
            className={cn(
              "p-1 h-auto",
              folder.id === currentFolderId ? "font-bold text-foreground" : ""
            )}
            onClick={() => onNavigate(folder.id)}
            // The last item in the path is the current folder, so disable navigation to it
            disabled={index === path.length - 1} 
          >
            <span className="truncate max-w-[200px]">{folder.title}</span>
          </Button>
        </div>
      ))}
    </nav>
  );
}
