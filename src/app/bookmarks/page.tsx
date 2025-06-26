import { BookmarkList } from "@/components/bookmark-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppFooter } from "@/components/footer";

export default function BookmarksPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <header className="py-8 bg-card/50 border-b">
        <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-5xl font-headline text-primary">PocketMarks</h1>
                <p className="text-lg text-muted-foreground mt-2">Your personal space for all your favorite links.</p>
              </div>
              <ThemeToggle />
            </div>
        </div>
      </header>
      <div className="container mx-auto py-8">
        <BookmarkList />
      </div>
      <AppFooter />
    </main>
  );
}
