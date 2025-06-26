export type Bookmark = {
  id: string;
  type: 'bookmark';
  title: string;
  url: string;
  tags?: string[];
};

export type Folder = {
  id: string;
  type: 'folder';
  title: string;
  children: BookmarkItem[];
};

export type BookmarkItem = Bookmark | Folder;
