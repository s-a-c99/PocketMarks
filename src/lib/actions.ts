"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { saveItem, deleteItem, overwriteBookmarks, exportBookmarks } from './bookmark-service';
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

export async function importBookmarksAction(items: BookmarkItem[]) {
  await overwriteBookmarks(items);
  revalidatePath('/bookmarks');
}

export async function exportBookmarksAction(): Promise<string> {
    return await exportBookmarks();
}