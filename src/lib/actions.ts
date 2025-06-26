"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { saveBookmark, deleteBookmark } from './bookmark-service';
import type { Bookmark } from '@/types';

const SESSION_COOKIE_NAME = 'pocketmarks_session';

export async function login(prevState: { error: string } | undefined, formData: FormData) {
  const username = formData.get('username');
  const password = formData.get('password');

  if (
    username &&
    username === process.env.POCKETMARKS_USERNAME &&
    password &&
    password === process.env.POCKETMARKS_PASSWORD
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

// Bookmark actions
export async function saveBookmarkAction(bookmark: Bookmark) {
  await saveBookmark(bookmark);
  revalidatePath('/bookmarks');
}

export async function deleteBookmarkAction(id: string) {
  await deleteBookmark(id);
  revalidatePath('/bookmarks');
}
