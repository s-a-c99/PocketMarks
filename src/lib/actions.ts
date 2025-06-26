"use server";

import { suggestTags as suggestTagsFlow, type SuggestTagsInput } from '@/ai/flows/suggest-tags';

export async function suggestTagsAction(input: SuggestTagsInput): Promise<{ success: boolean; tags?: string[]; error?: string; }> {
    try {
        // Basic validation
        if (!input.url || !input.title) {
            return { success: false, error: "URL and Title are required." };
        }
        const result = await suggestTagsFlow(input);
        return { success: true, tags: result.tags };
    } catch (error) {
        console.error("Error suggesting tags:", error);
        return { success: false, error: "Failed to suggest tags due to a server error." };
    }
}
