"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { 
  saveItem, 
  deleteItem, 
  overwriteBookmarks, 
  exportBookmarks, 
  exportSelectedBookmarks, 
  mergeBookmarks,
  createBackup,
  checkAllLinks,
  parseAndCompareBookmarks,
  parseBookmarks
} from './bookmark-service';
import type { BookmarkItem } from '@/types';

const SESSION_COOKIE_NAME = 'pocketmarks_session';

export async function login(prevState: { error: string } | undefined, formData: FormData) {
  const username = formData.get('username');
  const password = formData.get('password');

  const validUsername = process.env.POCKETMARKS_USERNAME || "user";
  const validPassword = process.env.POCKETMARKS_PASSWORD || "test1";

  if (
    username &&
    username === validUsername &&
    password &&
    password === validPassword
  ) {
    cookies().set(SESSION_COOKIE_NAME, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // One week
      path: '/',
    });
    return redirect('/bookmarks');
  } else {
    return { error: 'Invalid username or password.' };
  }
}

export async function logout() {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect('/login');
}

export async function saveItemAction(item: BookmarkItem, parentId: string | null) {
  await saveItem(item, parentId);
  revalidatePath('/bookmarks');
}

export async function deleteItemAction(id: string) {
  await deleteItem(id);
  revalidatePath('/bookmarks');
}

type ImportPayload = {
    fileContent?: string;
    items?: BookmarkItem[];
    mode: 'merge' | 'replace';
    password?: string;
}

type ImportResult = {
    error?: string;
    success?: boolean;
    needsPassword?: boolean;
    importedItems?: BookmarkItem[];
    itemsToCompare?: BookmarkItem[];
}

export async function importBookmarksAction(payload: ImportPayload): Promise<ImportResult> {
  const { fileContent, items, mode, password } = payload;
  
  if (mode === 'replace') {
    if (!password) {
      if (fileContent) {
          const importedItems = await parseBookmarks(fileContent);
          return { needsPassword: true, importedItems: importedItems };
      }
      return { error: 'File content is missing for replacement.' };
    }
    
    const validPassword = process.env.POCKETMARKS_PASSWORD || "test1";
    if (password !== validPassword) {
      return { error: 'Invalid password.' };
    }
    
    try {
      if (!items) return { error: "Items to import are missing."};
      await createBackup();
      await overwriteBookmarks(items);
      revalidatePath('/bookmarks');
      return { success: true };
    } catch (e) {
      console.error(e);
      return { error: 'Failed to create a backup or save bookmarks.' };
    }

  } else { // mode === 'merge'
    if(items) { 
        await mergeBookmarks(items);
        revalidatePath('/bookmarks');
        return { success: true };
    } else if (fileContent) { 
        const newItems = await parseAndCompareBookmarks(fileContent);
        return { itemsToCompare: newItems };
    }
    return { error: "Invalid merge payload" };
  }
}

export async function exportBookmarksAction(): Promise<string> {
    return await exportBookmarks();
}

export async function exportSelectedBookmarksAction(ids: string[]): Promise<string> {
    return await exportSelectedBookmarks(ids);
}

export async function checkDeadLinksAction(): Promise<Record<string, string>> {
  return await checkAllLinks();
}
