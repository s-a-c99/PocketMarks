// This is a server-only module.
import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import type { BookmarkItem, Folder } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { unstable_noStore as noStore } from 'next/cache';
import { JSDOM } from 'jsdom';

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

function normalizeUrl(url: string): string {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        return (urlObj.hostname.replace(/^www\./, '') + urlObj.pathname).replace(/\/$/, '');
    } catch (e) {
        return url.trim().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
    }
}


function getAllUrls(items: BookmarkItem[], urlMap: Map<string, string> = new Map()): Map<string, string> {
    for (const item of items) {
        if (item.type === 'bookmark') {
            urlMap.set(normalizeUrl(item.url), item.id);
        } else if (item.type === 'folder') {
            getAllUrls(item.children, urlMap);
        }
    }
    return urlMap;
}

const parseBookmarksRecursive = (root: Element): BookmarkItem[] => {
    const items: BookmarkItem[] = [];
    // Direct children of a DL are DTs (and maybe DDs, but we care about DTs)
    const children = Array.from(root.children).filter(el => el.tagName === 'DT');
  
    for (const child of children) {
        const anchor = child.querySelector(':scope > A');
        const header = child.querySelector(':scope > H3');
        const sublist = child.querySelector(':scope > DL');

        const add_date_attr = anchor?.getAttribute('ADD_DATE') || header?.getAttribute('ADD_DATE');
        const add_date = add_date_attr ? parseInt(add_date_attr, 10) * 1000 : Date.now();
        const createdAt = new Date(add_date).toISOString();

        if (header) {
            items.push({
                id: uuidv4(),
                type: 'folder',
                title: header.textContent || 'Untitled Folder',
                children: sublist ? parseBookmarksRecursive(sublist) : [],
                createdAt: createdAt,
            });
        } else if (anchor) {
            const url = anchor.getAttribute('HREF');
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
    const dom = new JSDOM(fileContent);
    const doc = dom.window.document;
    const list = doc.querySelector('DL');
    if (!list) return [];
    return parseBookmarksRecursive(list);
}

export async function parseAndCompareBookmarks(fileContent: string): Promise<BookmarkItem[]> {
    noStore();
    const importedItems = await parseBookmarks(fileContent);
    const existingBookmarks = await readBookmarksFile();
    const existingUrls = getAllUrls(existingBookmarks);

    const filterNewRecursive = (items: BookmarkItem[]): BookmarkItem[] => {
        return items.reduce((acc, item) => {
            if (item.type === 'bookmark') {
                if (!existingUrls.has(normalizeUrl(item.url))) {
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
    const existingUrls = getAllUrls(existingBookmarks);

    const mergeRecursive = (target: BookmarkItem[], source: BookmarkItem[]) => {
        for (const sourceItem of source) {
            if (sourceItem.type === 'bookmark') {
                if (!existingUrls.has(normalizeUrl(sourceItem.url))) {
                    target.push(sourceItem);
                }
            } else if (sourceItem.type === 'folder') {
                let targetFolder = target.find(t => t.type === 'folder' && t.title === sourceItem.title) as Folder | undefined;
                if (!targetFolder) {
                    const newFolder: Folder = { ...sourceItem, children: [] };
                    target.push(newFolder);
                    targetFolder = newFolder;
                }
                mergeRecursive(targetFolder.children, sourceItem.children);
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
            html += `${indent}    </DT>\n`;
        } else if (item.type === 'bookmark') {
            html += `${indent}    <DT><A HREF="${item.url}" ADD_DATE="${addDate}" LAST_MODIFIED="${addDate}">${item.title}</A></DT>\n`;
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
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(item.url, { 
                signal: controller.signal, 
                redirect: 'follow',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                }
            });
            clearTimeout(timeoutId);

            if (response.ok) {
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
