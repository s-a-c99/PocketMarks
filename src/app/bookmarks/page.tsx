import { BookmarkList } from "@/components/bookmark-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppFooter } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions";
import { getBookmarks } from "@/lib/bookmark-service";
import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";

export default async function BookmarksPage() {
  const bookmarks = await getBookmarks();

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <header className="py-2 bg-card/50 border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="flex items-baseline gap-3">
                <h1 className="text-xl font-headline text-primary">PocketMarks</h1>
                <p className="text-xs text-muted-foreground hidden md:block">Your personal space for all your favorite links.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="icon" aria-label="Dashboard">
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-[1.2rem] w-[1.2rem]" />
                  </Link>
                </Button>
                <ThemeToggle />
                <form action={logout}>
                  <Button variant="outline" size="icon" type="submit" aria-label="Logout">
                    <LogOut className="h-[1.2rem] w-[1.2rem]" />
                  </Button>
                </form>
              </div>
            </div>
        </div>
      </header>
      <div className="w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <BookmarkList initialItems={bookmarks} />
      </div>
      <AppFooter />
    </main>
  );
}
