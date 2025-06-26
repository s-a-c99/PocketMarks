// This is a server-only module.
import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import type { Bookmark, BookmarkItem, Folder } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const bookmarksFilePath = path.join(process.cwd(), 'bookmarks.json');

async function readBookmarksFile(): Promise<BookmarkItem[]> {
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
  return await readBookmarksFile();
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

  const isUpdate = findAndMutate(bookmarks, (item) => item.id === itemToSave.id, (items, index) => {
    const currentItem = items[index];
    if (currentItem.type === 'folder' && itemToSave.type === 'folder') {
        itemToSave.children = currentItem.children;
    }
    items[index] = itemToSave;
  });

  if (!isUpdate) {
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

function getAllUrls(items: BookmarkItem[], urlSet: Set<string> = new Set()): Set<string> {
    for (const item of items) {
        if (item.type === 'bookmark') {
            urlSet.add(item.url);
        } else if (item.type === 'folder') {
            getAllUrls(item.children, urlSet);
        }
    }
    return urlSet;
}

function mergeItems(existingItems: BookmarkItem[], newItems: BookmarkItem[], existingUrls: Set<string>) {
    newItems.forEach(newItem => {
        if (newItem.type === 'bookmark') {
            if (!existingUrls.has(newItem.url)) {
                existingItems.push(newItem);
                existingUrls.add(newItem.url);
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
        if (item.type === 'folder') {
            html += `${indent}    <DT><H3>${item.title}</H3>\n`;
            html += bookmarksToHtml(item.children, indentLevel + 1);
        } else if (item.type === 'bookmark') {
            html += `${indent}    <DT><A HREF="${item.url}">${item.title}</A>\n`;
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
        if (item.type === 'bookmark') {
            if (selectedIds.has(item.id)) {
                acc.push(item);
            }
        } else if (item.type === 'folder') {
            const filteredChildren = filterForExport(item.children, selectedIds);
            if (selectedIds.has(item.id) || filteredChildren.length > 0) {
                acc.push({ ...item, children: filteredChildren });
            }
        }
        return acc;
    }, [] as BookmarkItem[]);
}

export async function exportSelectedBookmarks(ids: string[]): Promise<string> {
    if (ids.length === 0) {
        return "";
    }
    const bookmarks = await getBookmarks();
    const selectedIds = new Set(ids);
    const itemsToExport = filterForExport(bookmarks, selectedIds);
    return exportFileHeader + bookmarksToHtml(itemsToExport);
}
