// This is a server-only module.
import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import type { Bookmark, BookmarkItem, Folder } from '@/types';
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
  let needsWrite = false;
  const addTimestamp = (items: BookmarkItem[]) => {
    items.forEach(item => {
      if (!item.createdAt) {
        item.createdAt = new Date(0).toISOString();
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
  findAndMutate(bookmarks, (item) => item.id === itemToSave.id, (items, index) => {
    const currentItem = items[index];
    if (currentItem.type === 'folder' && itemToSave.type === 'folder') {
      (itemToSave as Folder).children = currentItem.children;
    }
    itemToSave.createdAt = currentItem.createdAt || new Date().toISOString();
    items[index] = itemToSave;
    itemWasUpdated = true;
  });

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

function normalizeUrl(url: string): string {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname.replace(/^www\./, '');
    let path = urlObj.pathname.replace(/\/$/, '');
    return (hostname + path + urlObj.search + urlObj.hash).toLowerCase();
  } catch (e) {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
  }
}


function getAllUrls(items: BookmarkItem[], urlMap: Map<string, boolean> = new Map()): Map<string, boolean> {
    for (const item of items) {
        if (item.type === 'bookmark') {
            urlMap.set(normalizeUrl(item.url), true);
        } else if (item.type === 'folder') {
            getAllUrls(item.children, urlMap);
        }
    }
    return urlMap;
}

export async function compareBookmarks(newItems: BookmarkItem[]): Promise<BookmarkItem[]> {
    const existingBookmarks = await readBookmarksFile();
    const existingUrls = getAllUrls(existingBookmarks);

    function filterNew(items: BookmarkItem[]): BookmarkItem[] {
        const result: BookmarkItem[] = [];
        for (const item of items) {
            if (item.type === 'bookmark') {
                if (!existingUrls.has(normalizeUrl(item.url))) {
                    result.push(item);
                }
            } else if (item.type === 'folder') {
                const newChildren = filterNew(item.children);
                if (newChildren.length > 0) {
                     result.push({ ...item, children: newChildren });
                }
            }
        }
        return result;
    }

    return filterNew(newItems);
}


function mergeItems(existingItems: BookmarkItem[], newItems: BookmarkItem[], existingUrls: Map<string, boolean>) {
    newItems.forEach(newItem => {
        if (newItem.type === 'bookmark') {
            const normalized = normalizeUrl(newItem.url);
            if (!existingUrls.has(normalized)) {
                existingItems.push(newItem);
                existingUrls.set(normalized, true);
            }
        } else if (newItem.type === 'folder') {
            const existingFolder = existingItems.find(
                (item): item is Folder => item.type === 'folder' && item.title === newItem.title
            );

            if (existingFolder) {
                mergeItems(existingFolder.children, newItem.children, existingUrls);
            } else {
                existingItems.push(newItem);
                getAllUrls(newItem.children, existingUrls);
            }
        }
    });
}

export async function mergeBookmarks(items: BookmarkItem[]): Promise<void> {
    const existingBookmarks = await readBookmarksFile();
    const existingUrls = getAllUrls(existingBookmarks);
    mergeItems(existingBookmarks, items, existingUrls);
    await writeBookmarksFile(existingBookmarks);
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
    return items.reduce((acc, item) => {
        if (selectedIds.has(item.id)) {
            if (item.type === 'folder') {
                 acc.push({ ...item, children: filterForExport(item.children, selectedIds) });
            } else {
                acc.push(item);
            }
        } else if (item.type === 'folder') {
            const filteredChildren = filterForExport(item.children, selectedIds);
            if (filteredChildren.length > 0) {
                acc.push({ ...item, children: filteredChildren });
            }
        }
        return acc;
    }, [] as BookmarkItem[]);
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
  const bookmarks = await readBookmarksFile();
  const linkStatuses: Record<string, string> = {};
  
  const tasks: Promise<void>[] = [];

  function traverse(items: BookmarkItem[]) {
    for (const item of items) {
      if (item.type === 'bookmark') {
        tasks.push((async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
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
