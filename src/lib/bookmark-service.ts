// This is a server-only module.
import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import type { BookmarkItem, Folder } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { unstable_noStore as noStore } from 'next/cache';

const bookmarksFilePath = path.join(process.cwd(), 'bookmarks.json');
const backupsDir = path.join(process.cwd(), 'backups');

async function readBookmarksFile(): Promise<BookmarkItem[]> {
  noStore();
  try {
    const data = await fs.readFile(bookmarksFilePath, 'utf-8');
    const parsedData = JSON.parse(data);
    if (Array.isArray(parsedData)) {
      return parsedData as BookmarkItem[];
    }
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' || error instanceof SyntaxError) {
      await writeBookmarksFile([]);
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
  const bookmarks = await readBookmarksFile();
  // Ensure all items have a creation date for sorting
  let needsWrite = false;
  const addTimestamp = (items: BookmarkItem[]) => {
    items.forEach(item => {
      if (!item.createdAt) {
        item.createdAt = new Date(0).toISOString(); // Old items get a default old date
        needsWrite = true;
      }
      if (item.type === 'folder') {
        addTimestamp(item.children);
      }
    });
  };
  addTimestamp(bookmarks);
  if (needsWrite) {
    await writeBookmarksFile(bookmarks);
  }
  return bookmarks;
}

function findAndMutate(items: BookmarkItem[], predicate: (item: BookmarkItem) => boolean, mutator: (items: BookmarkItem[], index: number) => void): boolean {
    for (let i = 0; i < items.length; i++) {
        if (predicate(items[i])) {
            mutator(items, i);
            return true;
        }
        if (items[i].type === 'folder') {
            if (findAndMutate((items[i] as Folder).children, predicate, mutator)) {
                return true;
            }
        }
    }
    return false;
}

export async function saveItem(itemToSave: BookmarkItem, parentId: string | null): Promise<void> {
  const bookmarks = await readBookmarksFile();

  let itemWasUpdated = false;
  // Try to find and update an existing item
  findAndMutate(bookmarks, (item) => item.id === itemToSave.id, (items, index) => {
    // Preserve children if it's a folder being updated
    if (items[index].type === 'folder' && itemToSave.type === 'folder') {
      (itemToSave as Folder).children = (items[index] as Folder).children;
    }
    // Preserve original creation date
    itemToSave.createdAt = items[index].createdAt || new Date().toISOString();
    items[index] = itemToSave;
    itemWasUpdated = true;
  });

  // If it's a new item, add it
  if (!itemWasUpdated) {
    itemToSave.createdAt = new Date().toISOString();
    if (parentId) {
      findAndMutate(bookmarks, (item) => item.id === parentId && item.type === 'folder', (items, index) => {
        (items[index] as Folder).children.push(itemToSave);
      });
    } else {
      bookmarks.push(itemToSave);
    }
  }

  await writeBookmarksFile(bookmarks);
}

// Recursively removes an item by ID from a list of items
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

export async function deleteItem(id: string): Promise<void> {
  let bookmarks = await readBookmarksFile();
  bookmarks = deleteItemRecursive(bookmarks, id);
  await writeBookmarksFile(bookmarks);
}

export async function overwriteBookmarks(items: BookmarkItem[]): Promise<void> {
    await writeBookmarksFile(items);
}

function getAllUrls(items: BookmarkItem[]): Set<string> {
    const urls = new Set<string>();
    items.forEach(item => {
        if (item.type === 'bookmark') {
            urls.add(item.url);
        } else if (item.type === 'folder') {
            getAllUrls(item.children).forEach(url => urls.add(url));
        }
    });
    return urls;
}

export async function mergeBookmarks(items: BookmarkItem[]): Promise<void> {
    const existingBookmarks = await readBookmarksFile();
    const existingUrls = getAllUrls(existingBookmarks);

    const newItems = items.filter(item => {
        if (item.type === 'bookmark') {
            return !existingUrls.has(item.url);
        }
        // For now, we'll just add new folders, a more complex merge could be implemented
        return !existingBookmarks.some(b => b.type === 'folder' && b.title === item.title);
    });

    const updatedBookmarks = [...existingBookmarks, ...newItems];
    await writeBookmarksFile(updatedBookmarks);
}

function bookmarksToHtml(items: BookmarkItem[], indentLevel = 0): string {
    const indent = '    '.repeat(indentLevel);
    let html = `${indent}<DL><p>\n`;

    items.forEach(item => {
        const addDate = Math.floor(new Date(item.createdAt || 0).getTime() / 1000);
        if (item.type === 'folder') {
            html += `${indent}    <DT><H3 ADD_DATE="${addDate}">${item.title}</H3>\n`;
            html += bookmarksToHtml(item.children, indentLevel + 1);
        } else if (item.type === 'bookmark') {
            html += `${indent}    <DT><A HREF="${item.url}" ADD_DATE="${addDate}">${item.title}</A>\n`;
        }
    });

    html += `${indent}</DL><p>\n`;
    return html;
}

const exportFileHeader = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>\n`;

export async function exportBookmarks(): Promise<string> {
    const bookmarks = await getBookmarks();
    return exportFileHeader + bookmarksToHtml(bookmarks);
}

function filterForExport(items: BookmarkItem[], selectedIds: Set<string>): BookmarkItem[] {
    const result: BookmarkItem[] = [];
    items.forEach(item => {
        if (selectedIds.has(item.id)) {
            if (item.type === 'folder') {
                 // If a folder is selected, include it and its (potentially filtered) children
                 result.push({ ...item, children: filterForExport(item.children, selectedIds) });
            } else {
                result.push(item);
            }
        } else if (item.type === 'folder') {
            // If a folder is not selected, still check its children
            const filteredChildren = filterForExport(item.children, selectedIds);
            if (filteredChildren.length > 0) {
                // If any children are selected, include the folder but only with those children
                result.push({ ...item, children: filteredChildren });
            }
        }
    });
    return result;
}

export async function exportSelectedBookmarks(ids: string[]): Promise<string> {
    if (ids.length === 0) return "";
    const bookmarks = await getBookmarks();
    const selectedIds = new Set(ids);
    const itemsToExport = filterForExport(bookmarks, selectedIds);
    return exportFileHeader + bookmarksToHtml(itemsToExport);
}

async function ensureBackupsDirExists(): Promise<void> {
  try {
    await fs.mkdir(backupsDir, { recursive: true });
  } catch (error) {
    console.error("Could not create backups directory", error);
    throw error;
  }
}

export async function createBackup(): Promise<void> {
  await ensureBackupsDirExists();
  const currentBookmarks = await readBookmarksFile();
  if (currentBookmarks.length === 0) return;
  const timestamp = format(new Date(), "yyyy-MM-dd'T'HH-mm-ss");
  const backupFilePath = path.join(backupsDir, `bookmarks-${timestamp}.json`);
  await fs.writeFile(backupFilePath, JSON.stringify(currentBookmarks, null, 2), 'utf-8');
}

export async function checkAllLinks(): Promise<Record<string, string>> {
  noStore();
  const bookmarks = await readBookmarksFile();
  const linkStatuses: Record<string, string> = {};
  
  const tasks: Promise<void>[] = [];

  function traverse(items: BookmarkItem[]) {
    for (const item of items) {
      if (item.type === 'bookmark') {
        tasks.push((async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
            const response = await fetch(item.url, { signal: controller.signal, redirect: 'follow' });
            clearTimeout(timeoutId);

            if (response.status >= 200 && response.status < 400) {
              linkStatuses[item.id] = 'ok';
            } else {
              linkStatuses[item.id] = `Error (${response.status})`;
            }
          } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    linkStatuses[item.id] = 'Timeout';
                } else {
                    linkStatuses[item.id] = 'Dead';
                }
            } else {
                linkStatuses[item.id] = 'Unknown Error';
            }
          }
        })());
      } else if (item.type === 'folder') {
        traverse(item.children);
      }
    }
  }

  traverse(bookmarks);
  await Promise.allSettled(tasks);
  return linkStatuses;
}
