// This is a server-only module.
import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import type { Bookmark } from '@/types';

const bookmarksFilePath = path.join(process.cwd(), 'bookmarks.json');

async function readBookmarksFile(): Promise<Bookmark[]> {
  try {
    const data = await fs.readFile(bookmarksFilePath, 'utf-8');
    return JSON.parse(data) as Bookmark[];
  } catch (error) {
    // If the file doesn't exist, return an empty array.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeBookmarksFile(bookmarks: Bookmark[]): Promise<void> {
  // Sort bookmarks alphabetically by title before writing
  const sortedBookmarks = [...bookmarks].sort((a, b) => a.title.localeCompare(b.title));
  const data = JSON.stringify(sortedBookmarks, null, 2);
  await fs.writeFile(bookmarksFilePath, data, 'utf-8');
}

export async function getBookmarks(): Promise<Bookmark[]> {
  return await readBookmarksFile();
}

export async function saveBookmark(bookmark: Bookmark): Promise<void> {
  const bookmarks = await readBookmarksFile();
  const existingIndex = bookmarks.findIndex(b => b.id === bookmark.id);

  if (existingIndex > -1) {
    // Update existing bookmark
    bookmarks[existingIndex] = bookmark;
  } else {
    // Add new bookmark
    bookmarks.push(bookmark);
  }
  await writeBookmarksFile(bookmarks);
}

export async function deleteBookmark(id: string): Promise<void> {
  let bookmarks = await readBookmarksFile();
  bookmarks = bookmarks.filter(b => b.id !== id);
  await writeBookmarksFile(bookmarks);
}
