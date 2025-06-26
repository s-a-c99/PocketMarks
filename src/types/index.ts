export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  createdAt: string;
}
