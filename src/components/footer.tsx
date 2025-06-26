"use client";

import { useState, useEffect } from 'react';

export function AppFooter() {
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        // This effect runs only on the client, ensuring the date is fresh
        // and avoids hydration mismatches if the server and client render at different times.
        setYear(new Date().getFullYear());
    }, []);

    return (
        <footer className="py-6 text-center text-muted-foreground text-sm border-t">
            <p>&copy; {year} PocketMarks. All rights reserved.</p>
        </footer>
    );
}
