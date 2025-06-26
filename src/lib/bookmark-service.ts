// This is a server-only module.
import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import type { BookmarkItem } from '@/types';

const bookmarksFilePath = path.join(process.cwd(), 'bookmarks.json');

async function readBookmarksFile(): Promise<BookmarkItem[]> {
  try {
    const data = await fs.readFile(bookmarksFilePath, 'utf-8');
    // Basic validation to ensure it's an array
    const parsedData = JSON.parse(data);
    if (Array.isArray(parsedData)) {
      return parsedData as BookmarkItem[];
    }
    return [];
  } catch (error) {
    // If the file doesn't exist or is invalid, return an empty array.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' || error instanceof SyntaxError) {
      await writeBookmarksFile([]); // Create an empty file if it doesn't exist
      return [];
    }
    throw error;
  }
}

async function writeBookmarksFile(bookmarks: BookmarkItem[]): Promise<void> {
  const data = JSON.stringify(bookmarks, null, 2);
  await fs.writeFile(bookmarksFilePath, data, 'utf-8');
}

export async function getBookmarks(): Promise<BookmarkItem[]> {
  return await readBookmarksFile();
}

// A recursive function to find and update a bookmark or folder
function updateItemRecursive(items: BookmarkItem[], itemToSave: BookmarkItem): boolean {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === itemToSave.id) {
      items[i] = itemToSave;
      return true;
    }
    if (items[i].type === 'folder') {
      if (updateItemRecursive((items[i] as any).children, itemToSave)) {
        return true;
      }
    }
  }
  return false;
}


export async function saveBookmark(bookmark: BookmarkItem): Promise<void> {
  const bookmarks = await readBookmarksFile();
  
  if (!updateItemRecursive(bookmarks, bookmark)) {
    // If it's a new item, add it to the root
    bookmarks.push(bookmark);
  }

  await writeBookmarksFile(bookmarks);
}


// A recursive function to find and delete an item by ID
function deleteItemRecursive(items: BookmarkItem[], idToDelete: string): BookmarkItem[] {
    const filteredItems = items.filter(item => item.id !== idToDelete);
    return filteredItems.map(item => {
        if (item.type === 'folder') {
            return {
                ...item,
                children: deleteItemRecursive(item.children, idToDelete),
            };
        }
        return item;
    });
}

export async function deleteBookmark(id: string): Promise<void> {
  let bookmarks = await readBookmarksFile();
  bookmarks = deleteItemRecursive(bookmarks, id);
  await writeBookmarksFile(bookmarks);
}
