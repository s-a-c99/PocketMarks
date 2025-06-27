"use client";

import { Bookmark, Folder as FolderIcon, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Legend } from 'recharts';
import { useTheme } from 'next-themes';

export type DashboardStats = {
    totalBookmarks: number;
    totalFolders: number;
    topDomains: { name: string; count: number }[];
    folderSizes: { name: string; count: number }[];
    tldDistribution: { name: string; count: number }[];
};

type DashboardDisplayProps = {
    stats: DashboardStats;
};

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
];

const barChartConfig = {
  count: {
    label: "Bookmarks",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const pieChartConfig = {
    count: {
      label: "Count",
    },
} satisfies ChartConfig;


export function DashboardDisplay({ stats }: DashboardDisplayProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Enhance TLD data with colors for the pie chart
    const tldDataWithColors = stats.tldDistribution.map((entry, index) => ({
      ...entry,
      fill: chartColors[index % chartColors.length],
    }));

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookmarks</CardTitle>
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalBookmarks}</div>
                    <p className="text-xs text-muted-foreground">Across all folders</p>
                </CardContent>
            </Card>
            <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Folders</CardTitle>
                    <FolderIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalFolders}</div>
                    <p className="text-xs text-muted-foreground">Top-level and nested</p>
                </CardContent>
            </Card>
             <Card className="col-span-1 md:col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Saved Domains</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {stats.topDomains.length > 0 ? (
                        <ul className="space-y-1">
                            {stats.topDomains.map((domain) => (
                                <li key={domain.name} className="flex justify-between items-center text-sm">
                                    <span className="font-medium truncate pr-2">{domain.name}</span>
                                    <span className="font-bold text-primary">{domain.count}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No domains saved yet.</p>
                    )}
                </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2 lg:col-span-2">
                <CardHeader>
                    <CardTitle>Largest Folders</CardTitle>
                    <CardDescription>Number of bookmarks in your top-level folders.</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.folderSizes.length > 0 ? (
                        <ChartContainer config={barChartConfig} className="h-64 w-full">
                            <RechartsBarChart
                                data={stats.folderSizes}
                                layout="vertical"
                                margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
                                accessibilityLayer
                            >
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tick={{ fill: isDark ? 'white' : 'black', fontSize: 12 }} 
                                    width={100}
                                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsla(var(--muted))' }}
                                    content={<ChartTooltipContent />}
                                />
                                <Bar dataKey="count" layout="vertical" radius={4} fill="var(--color-count)" />
                            </RechartsBarChart>
                        </ChartContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-10">No folders to display.</p>
                    )}
                </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2 lg:col-span-1">
                 <CardHeader>
                    <CardTitle>TLD Distribution</CardTitle>
                    <CardDescription>Distribution of top-level domains.</CardDescription>
                </CardHeader>
                <CardContent>
                    {tldDataWithColors.length > 0 ? (
                        <ChartContainer config={pieChartConfig} className="h-64 w-full">
                            <RechartsPieChart>
                                <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                <Pie data={tldDataWithColors} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} strokeWidth={2}>
                                {tldDataWithColors.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                                ))}
                                </Pie>
                                <Legend
                                    iconSize={10}
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    wrapperStyle={{ fontSize: '12px', paddingLeft: '20px' }}
                                />
                            </RechartsPieChart>
                        </ChartContainer>
                     ) : (
                        <p className="text-sm text-muted-foreground text-center py-10">No data to display.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
