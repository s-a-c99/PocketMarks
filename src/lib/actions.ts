"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { 
  saveItem, 
  deleteItem, 
  deleteSelectedItems,
  overwriteBookmarks, 
  exportBookmarks, 
  exportSelectedBookmarks, 
  mergeBookmarks,
  createBackup,
  parseAndCompareBookmarks,
  parseBookmarks,
  toggleFavoriteStatus
} from './bookmark-service';
import type { BookmarkItem } from '@/types';
import { suggestTags, type SuggestTagsInput } from '@/ai/flows/suggest-tags';

const SESSION_COOKIE_NAME = 'pocketmarks_session';

export async function login(prevState: { error: string } | undefined, formData: FormData) {
  const username = formData.get('username');
  const password = formData.get('password');
  const remember = formData.get('remember');

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
      maxAge: remember ? 60 * 60 * 24 * 180 : undefined, // 6 months or session
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

export async function deleteItemAction(id: string): Promise<{ error?: string }> {
  try {
    await deleteItem(id);
    revalidatePath('/bookmarks');
    return {};
  } catch (e) {
    console.error("Failed to delete item:", e);
    const message = e instanceof Error ? e.message : "An unknown error occurred.";
    return { error: message };
  }
}

export async function deleteSelectedItemsAction(ids: string[]): Promise<{ error?: string }> {
    try {
      await deleteSelectedItems(ids);
      revalidatePath('/bookmarks');
      return {};
    } catch (e) {
      console.error("Failed to delete selected items:", e);
      const message = e instanceof Error ? e.message : "An unknown error occurred.";
      return { error: message };
    }
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

export async function toggleFavoriteAction(id: string) {
    await toggleFavoriteStatus(id);
    revalidatePath('/bookmarks');
}

export async function suggestTagsAction(input: SuggestTagsInput): Promise<{ tags?: string[]; error?: string }> {
  if (!process.env.GOOGLE_API_KEY) {
    return { error: "AI features are not configured on the server." };
  }
  try {
    const result = await suggestTags(input);
    return { tags: result.tags };
  } catch (e) {
    console.error("Tag suggestion failed:", e);
    return { error: "Failed to get suggestions from the AI." };
  }
}
