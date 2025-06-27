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
    if (!data) return [];
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

export async function saveItem(itemToSave: BookmarkItem, parentId: string | null): Promise<void> {
  const bookmarks = await readBookmarksFile();
  const cleanedBookmarks = deleteItemRecursive(bookmarks, itemToSave.id);

  let itemWasUpdated = false;
  findAndMutate(cleanedBookmarks, (item) => item.id === itemToSave.id, (items, index) => {
    if (items[index].type === 'folder' && itemToSave.type === 'folder') {
      (itemToSave as Folder).children = (items[index] as Folder).children;
    }
    itemToSave.createdAt = items[index].createdAt || new Date().toISOString();
    items[index] = itemToSave;
    itemWasUpdated = true;
  });

  if (!itemWasUpdated) {
    itemToSave.createdAt = new Date().toISOString();
    if (parentId) {
      let parentFound = false;
      findAndMutate(cleanedBookmarks, (item) => item.id === parentId && item.type === 'folder', (items, index) => {
        (items[index] as Folder).children.push(itemToSave);
        parentFound = true;
      });
      if (!parentFound) {
        cleanedBookmarks.push(itemToSave);
      }
    } else {
      cleanedBookmarks.push(itemToSave);
    }
  }
  await writeBookmarksFile(cleanedBookmarks);
}


export async function deleteItem(id: string): Promise<void> {
  let bookmarks = await readBookmarksFile();
  bookmarks = deleteItemRecursive(bookmarks, id);
  await writeBookmarksFile(bookmarks);
}

export async function overwriteBookmarks(items: BookmarkItem[]): Promise<void> {
    await writeBookmarksFile(items);
}

function getAllUrls(items: BookmarkItem[], urlSet: Set<string> = new Set()): Set<string> {
    for (const item of items) {
        if (item.type === 'bookmark') {
            const normalizedUrl = item.url.trim().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
            urlSet.add(normalizedUrl);
        } else if (item.type === 'folder') {
            getAllUrls(item.children, urlSet);
        }
    }
    return urlSet;
}

const parseBookmarksRecursive = (root: Element): BookmarkItem[] => {
  const items: BookmarkItem[] = [];
  
  // Directly select <DT> elements that are children of the first <DL> within the root.
  // This is a more robust way to find the list of items.
  const listItems = root.querySelectorAll(':scope > dl > dt');

  for (const item of Array.from(listItems)) {
    const anchor = item.querySelector(':scope > a');
    const header = item.querySelector(':scope > h3');

    const add_date_attr = anchor?.getAttribute('add_date') || header?.getAttribute('add_date');
    const add_date = add_date_attr ? parseInt(add_date_attr, 10) * 1000 : Date.now();
    const createdAt = new Date(add_date).toISOString();

    if (header) { // It's a folder. The children are in a <DL> nested within the same <DT>.
      const children = parseBookmarksRecursive(item);
      items.push({
        id: uuidv4(),
        type: 'folder',
        title: header.textContent || 'Untitled Folder',
        children: children,
        createdAt: createdAt,
      });
    } else if (anchor) { // It's a bookmark.
      const url = anchor.getAttribute('href');
      const title = anchor.textContent || 'Untitled Bookmark';
      if (url) {
        items.push({
          id: uuidv4(),
          type: 'bookmark',
          title: title,
          url: url,
          createdAt: createdAt,
        });
      }
    }
  }
  return items;
};

export async function parseBookmarks(fileContent: string): Promise<BookmarkItem[]> {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(fileContent);
    const doc = dom.window.document;
    
    // Find the main H1 tag, which usually precedes the main list. Start parsing from its parent.
    const mainHeader = doc.querySelector('h1');
    const rootElement = mainHeader ? mainHeader.parentElement : doc.body;

    return parseBookmarksRecursive(rootElement || doc.body);
}

export async function parseAndCompareBookmarks(fileContent: string): Promise<BookmarkItem[]> {
    noStore();
    const importedItems = await parseBookmarks(fileContent);
    const existingBookmarks = await readBookmarksFile();
    const existingUrls = getAllUrls(existingBookmarks);

    const filterNewRecursive = (items: BookmarkItem[]): BookmarkItem[] => {
        return items.reduce((acc, item) => {
            if (item.type === 'bookmark') {
                const normalizedUrl = item.url.trim().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                if (!existingUrls.has(normalizedUrl)) {
                    acc.push(item);
                }
            } else if (item.type === 'folder') {
                const newChildren = filterNewRecursive(item.children);
                if (newChildren.length > 0) {
                    acc.push({ ...item, children: newChildren });
                }
            }
            return acc;
        }, [] as BookmarkItem[]);
    }
    
    return filterNewRecursive(importedItems);
}


export async function mergeBookmarks(itemsToMerge: BookmarkItem[]): Promise<void> {
    noStore();
    const existingBookmarks = await readBookmarksFile();

    const mergeRecursive = (target: BookmarkItem[], source: BookmarkItem[]) => {
        for (const sourceItem of source) {
            if (sourceItem.type === 'folder') {
                let targetFolder = target.find(t => t.type === 'folder' && t.title === sourceItem.title) as Folder | undefined;
                if (!targetFolder) {
                    const newFolder = { ...sourceItem, children: [] };
                    target.push(newFolder);
                    targetFolder = newFolder;
                }
                mergeRecursive(targetFolder.children, sourceItem.children);
            } else {
                target.push(sourceItem);
            }
        }
    };

    mergeRecursive(existingBookmarks, itemsToMerge);
    await writeBookmarksFile(existingBookmarks);
}

function bookmarksToHtml(items: BookmarkItem[], indentLevel = 0): string {
    const indent = '    '.repeat(indentLevel);
    let html = `${indent}<DL><p>\n`;

    items.forEach(item => {
        const addDate = Math.floor(new Date(item.createdAt || 0).getTime() / 1000);
        if (item.type === 'folder') {
            html += `${indent}    <DT><H3 ADD_DATE="${addDate}" LAST_MODIFIED="${addDate}">${item.title}</H3>\n`;
            html += bookmarksToHtml(item.children, indentLevel + 1);
        } else if (item.type === 'bookmark') {
            html += `${indent}    <DT><A HREF="${item.url}" ADD_DATE="${addDate}" LAST_MODIFIED="${addDate}">${item.title}</A>\n`;
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
                 result.push({ ...item, children: filterForExport(item.children, selectedIds) });
            } else {
                result.push(item);
            }
        } else if (item.type === 'folder') {
            const filteredChildren = filterForExport(item.children, selectedIds);
            if (filteredChildren.length > 0) {
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
