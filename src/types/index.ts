export type Bookmark = {
  id: string;
  type: 'bookmark';
  title: string;
  url: string;
  createdAt: string;
};

export type Folder = {
  id: string;
  type: 'folder';
  title: string;
  children: BookmarkItem[];
  createdAt: string;
};

export type BookmarkItem = Bookmark | Folder;