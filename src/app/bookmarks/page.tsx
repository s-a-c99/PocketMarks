import { BookmarkList } from "@/components/bookmark-list";

export default function BookmarksPage() {
  return (
    <main className="min-h-screen w-full bg-background">
      <header className="py-8 bg-card/50 border-b">
        <div className="container mx-auto">
            <h1 className="text-5xl font-headline text-primary">PocketMarks</h1>
            <p className="text-lg text-muted-foreground mt-2">Your personal space for all your favorite links.</p>
        </div>
      </header>
      <div className="container mx-auto py-8">
        <BookmarkList />
      </div>
      <footer className="py-6 text-center text-muted-foreground text-sm border-t">
          <p>&copy; {new Date().getFullYear()} PocketMarks. All rights reserved.</p>
      </footer>
    </main>
  );
}
