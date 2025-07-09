// This is a server-only module.
import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import type { BookmarkItem, Folder, Bookmark } from '@/types';
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

function deleteItemsRecursive(items: BookmarkItem[], idsToDelete: Set<string>): BookmarkItem[] {
  const filteredItems = items.filter(item => !idsToDelete.has(item.id));
  return filteredItems.map(item => {
    if (item.type === 'folder' && item.children) {
      return {
        ...item,
        children: deleteItemsRecursive(item.children, idsToDelete),
      };
    }
    return item;
  });
}

export async function deleteSelectedItems(ids: string[]): Promise<void> {
  const bookmarks = await readBookmarksFile();
  const idsToDelete = new Set(ids);
  const updatedBookmarks = deleteItemsRecursive(bookmarks, idsToDelete);
  await writeBookmarksFile(updatedBookmarks);
}

export async function toggleFavoriteStatus(id: string): Promise<void> {
  const bookmarks = await readBookmarksFile();
  findAndMutate(bookmarks, (item) => item.id === id && item.type === 'bookmark', (items, index) => {
      const bookmark = items[index] as Bookmark;
      bookmark.isFavorite = !bookmark.isFavorite;
  });
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
    // Direct children of a DL are DTs. Iterate through them.
    for (const child of Array.from(root.children)) {
      if (child.tagName !== 'DT') continue;
  
      const anchor = child.querySelector(':scope > A');
      const header = child.querySelector(':scope > H3');
      const sublist = child.querySelector(':scope > DL');
  
      const add_date_attr = anchor?.getAttribute('ADD_DATE') || header?.getAttribute('ADD_DATE');
      const add_date = add_date_attr ? parseInt(add_date_attr, 10) * 1000 : Date.now();
      const createdAt = new Date(add_date).toISOString();
  
      if (header) { // It's a folder
        items.push({
          id: uuidv4(),
          type: 'folder',
          title: header.textContent || 'Untitled Folder',
          children: sublist ? parseBookmarksRecursive(sublist) : [],
          createdAt: createdAt,
        });
      } else if (anchor) { // It's a bookmark
        const url = anchor.getAttribute('HREF');
        const title = anchor.textContent || 'Untitled Bookmark';
        const tagsAttr = anchor.getAttribute('TAGS');
        const tags = tagsAttr ? tagsAttr.split(',').map(t => t.trim()).filter(Boolean) : [];

        if (url) {
          items.push({
            id: uuidv4(),
            type: 'bookmark',
            title: title,
            url: url,
            createdAt: createdAt,
            tags: tags
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
            const tagsAttribute = item.tags && item.tags.length > 0 ? ` TAGS="${item.tags.join(',')}"` : '';
            const favoriteAttribute = item.isFavorite ? ' ICON="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAABeklEQVQ4y6WTv2vUYRzFP/e9u5v9uF0T0k2iSJGiQ0Mdd3FwUFP/gI6uro4uCg5OLlJw8C/QcHRydBM6dLAgWkrQP0DRZAmKXWzCzb3J3d3L3e4/5/D7fT7f7/f9fnkR/pI+qU6U9HPS/An0f03xS6bTqXRyYlOVSjVV4Uu1i+5wIM/z+TqZTPYwW5qAsW5gqA94q4vValVfENVEcUnEMdM0jZ2WAdVqNQU4M4E4M8GzLMs23RNKIMvyt4E0wRSRhJvQvQnETwLzXwTzI5IgyxZ/3AFbmkDGcf6hGDAunt0g3N7ePuL5/uprA0wNMOViOaA4EZmZ4G2l1TqM50xQxvGfqmI3jC0AisGkCdb7DwezwbA8+deE8wP9g64Qz88MhF7DsA/LFv/dAdmWeeA8wfbA8xbwFqB+fV7s2AnkUqmVj8NxT4PXIunvQPoJ6P8L8L9i+puAWL9WqsUaP/8cBSaZm6Y5n46S5f3AWRb/nQIWmRPLkP5gOm9SfZ3s5p9zPByfAXnWPf4e+BRqL/xS6ZSpfufqf0A+A5bJ5DkMsNxzLgAAAABJRU5ErkJggg=="' : '';
            html += `${indent}    <DT><A HREF="${item.url}" ADD_DATE="${addDate}" LAST_MODIFIED="${addDate}"${favoriteAttribute}${tagsAttribute}>${item.title}</A></DT>\n`;
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

export async function reorderItems(itemId: string, newPosition: number, parentId?: string): Promise<void> {
  const bookmarks = await readBookmarksFile();
  
  const reorderRecursive = (items: BookmarkItem[], targetParentId?: string): BookmarkItem[] => {
    let itemToMove: BookmarkItem | null = null;
    let sourceIndex = -1;
    
    // Find and extract the item to move
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === itemId) {
        itemToMove = items[i];
        sourceIndex = i;
        break;
      }
      if (items[i].type === 'folder') {
        const result = reorderRecursive(items[i].children, targetParentId);
        if (result !== items[i].children) {
          items[i] = { ...items[i], children: result };
        }
      }
    }
    
    // If we found the item to move and this is the target parent
    if (itemToMove && (!targetParentId || targetParentId === 'root')) {
      // Remove from source
      const newItems = [...items];
      newItems.splice(sourceIndex, 1);
      
      // Insert at new position
      const targetIndex = Math.min(newPosition, newItems.length);
      newItems.splice(targetIndex, 0, itemToMove);
      
      return newItems;
    }
    
    return items;
  };
  
  const reorderInFolder = (items: BookmarkItem[], targetParentId: string): BookmarkItem[] => {
    return items.map(item => {
      if (item.type === 'folder') {
        if (item.id === targetParentId) {
          // This is the target folder, perform reorder within it
          let itemToMove: BookmarkItem | null = null;
          
          // Find item in current folder or extract from elsewhere
          const extractItem = (searchItems: BookmarkItem[]): BookmarkItem | null => {
            for (let i = 0; i < searchItems.length; i++) {
              if (searchItems[i].id === itemId) {
                const extracted = searchItems[i];
                searchItems.splice(i, 1);
                return extracted;
              }
              if (searchItems[i].type === 'folder') {
                const result = extractItem(searchItems[i].children);
                if (result) return result;
              }
            }
            return null;
          };
          
          itemToMove = extractItem(bookmarks);
          
          if (itemToMove) {
            const newChildren = [...item.children];
            const targetIndex = Math.min(newPosition, newChildren.length);
            newChildren.splice(targetIndex, 0, itemToMove);
            return { ...item, children: newChildren };
          }
        } else {
          // Recursively search in other folders
          return { ...item, children: reorderInFolder(item.children, targetParentId) };
        }
      }
      return item;
    });
  };
  
  let updatedBookmarks: BookmarkItem[];
  
  if (parentId && parentId !== 'root') {
    updatedBookmarks = reorderInFolder(bookmarks, parentId);
  } else {
    updatedBookmarks = reorderRecursive(bookmarks);
  }
  
  await writeBookmarksFile(updatedBookmarks);
}
