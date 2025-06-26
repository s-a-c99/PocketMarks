import { BookmarkList } from "@/components/bookmark-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppFooter } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions";
import { getBookmarks } from "@/lib/bookmark-service";
import { LogOut } from "lucide-react";

export default async function BookmarksPage() {
  const bookmarks = await getBookmarks();

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <header className="py-8 bg-card/50 border-b">
        <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-5xl font-headline text-primary">PocketMarks</h1>
                <p className="text-lg text-muted-foreground mt-2">Your personal space for all your favorite links.</p>
              </div>
              <div className="flex items-center gap-2">
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
      <div className="container mx-auto py-8">
        <BookmarkList initialItems={bookmarks} />
      </div>
      <AppFooter />
    </main>
  );
}
