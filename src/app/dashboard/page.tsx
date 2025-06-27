import { getBookmarks } from '@/lib/bookmark-service';
import type { BookmarkItem } from '@/types';
import { DashboardDisplay, type DashboardStats } from '@/components/dashboard-display';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';


function calculateStats(items: BookmarkItem[]): DashboardStats {
    noStore();
    let totalBookmarks = 0;
    let totalFolders = 0;
    const domainCounts: Record<string, number> = {};
    const tldCounts: Record<string, number> = {};
    const folderSizes: { name: string; count: number }[] = [];

    function countChildren(items: BookmarkItem[]): number {
        let count = 0;
        for (const item of items) {
            if (item.type === 'bookmark') {
                count++;
            } else if (item.type === 'folder' && item.children) {
                count += countChildren(item.children);
            }
        }
        return count;
    }

    function traverse(items: BookmarkItem[], isTopLevel = false) {
        for (const item of items) {
            if (item.type === 'bookmark') {
                totalBookmarks++;
                try {
                    const url = new URL(item.url);
                    const domain = url.hostname.replace(/^www\./, '');
                    domainCounts[domain] = (domainCounts[domain] || 0) + 1;

                    const tld = domain.substring(domain.lastIndexOf('.'));
                    if (tld && tld.length > 1) { // ensure it's a valid tld
                        tldCounts[tld] = (tldCounts[tld] || 0) + 1;
                    }
                } catch (e) {
                    // Ignore invalid URLs
                }
            } else if (item.type === 'folder') {
                totalFolders++;
                if (isTopLevel) {
                    folderSizes.push({ name: item.title, count: countChildren(item.children) });
                }
                if (item.children) {
                  traverse(item.children);
                }
            }
        }
    }

    traverse(items, true);

    const topDomains = Object.entries(domainCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    const tldDistribution = Object.entries(tldCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 7) // Top 7 for better pie chart visibility
        .map(([name, count]) => ({ name, count }));
    
    folderSizes.sort((a, b) => b.count - a.count);

    return { totalBookmarks, totalFolders, topDomains, folderSizes, tldDistribution };
}

export default async function DashboardPage() {
  const items = await getBookmarks();
  const stats = calculateStats(items);

  return (
    <main className="min-h-screen w-full bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
         <h1 className="text-3xl font-headline text-primary">Dashboard</h1>
         <Button asChild variant="outline">
            <Link href="/bookmarks">
              <ArrowLeft className="mr-2" />
              Back to Bookmarks
            </Link>
         </Button>
      </div>
      <DashboardDisplay stats={stats} />
    </main>
  );
}
