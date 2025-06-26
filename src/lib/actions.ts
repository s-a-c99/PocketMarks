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
  compareBookmarks
} from './bookmark-service';
import type { BookmarkItem } from '@/types';

const SESSION_COOKIE_NAME = 'pocketmarks_session';

export async function login(prevState: { error: string } | undefined, formData: FormData) {
  const username = formData.get('username');
  const password = formData.get('password');

  // For now, we use environment variables for a single user.
  // In a multi-user system, you would look up the user in a database.
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

// Item actions
export async function saveItemAction(item: BookmarkItem, parentId: string | null) {
  await saveItem(item, parentId);
  revalidatePath('/bookmarks');
}

export async function deleteItemAction(id: string) {
  await deleteItem(id);
  revalidatePath('/bookmarks');
}

export async function importBookmarksAction(
  items: BookmarkItem[],
  mode: 'merge' | 'replace',
  password?: string
): Promise<{ error?: string; success?: boolean }> {
  if (mode === 'replace') {
    if (!password) {
      return { error: 'Password is required to replace all bookmarks.' };
    }
    
    const validPassword = process.env.POCKETMARKS_PASSWORD || "test1";

    if (password !== validPassword) {
      return { error: 'Invalid password.' };
    }
    
    try {
      await createBackup();
      await overwriteBookmarks(items);
      revalidatePath('/bookmarks');
      return { success: true };
    } catch (e) {
      console.error(e);
      return { error: 'Failed to create a backup or save bookmarks.' };
    }
  } else {
    await mergeBookmarks(items);
    revalidatePath('/bookmarks');
    return { success: true };
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

export async function compareBookmarksAction(items: BookmarkItem[]): Promise<BookmarkItem[]> {
  return await compareBookmarks(items);
}
