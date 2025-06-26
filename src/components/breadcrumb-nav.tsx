"use client";

import { ChevronRight, Home } from "lucide-react";
import type { Folder } from "@/types";
import { Button } from "./ui/button";

type BreadcrumbNavProps = {
  path: Folder[];
  onNavigate: (folderId: string | null) => void;
};

export function BreadcrumbNav({ path, onNavigate }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center text-sm font-medium text-muted-foreground mb-4 flex-wrap">
      <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => onNavigate(null)}>
        <Home className="h-4 w-4 mr-1" />
        Home
      </Button>
      {path.map((folder) => (
        <div key={folder.id} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
           <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto"
            onClick={() => onNavigate(folder.id)}
          >
            <span className="truncate max-w-[200px]">{folder.title}</span>
          </Button>
        </div>
      ))}
    </nav>
  );
}
