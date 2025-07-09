'use server';
/**
 * @fileOverview An AI agent that suggests relevant tags for a bookmark.
 *
 * - suggestTags - A function that suggests tags for a given URL and title.
 * - SuggestTagsInput - The input type for the suggestTags function.
 * - SuggestTagsOutput - The return type for the suggestTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTagsInputSchema = z.object({
  url: z.string().describe('The URL of the bookmark.'),
  title: z.string().describe('The title of the bookmark.'),
});
export type SuggestTagsInput = z.infer<typeof SuggestTagsInputSchema>;

const SuggestTagsOutputSchema = z.object({
  tags: z.array(z.string()).max(3).describe('An array of exactly 3 most relevant, essential tags.'),
});
export type SuggestTagsOutput = z.infer<typeof SuggestTagsOutputSchema>;

export async function suggestTags(input: SuggestTagsInput): Promise<SuggestTagsOutput> {
  return suggestTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTagsPrompt',
  input: {schema: SuggestTagsInputSchema},
  output: {schema: SuggestTagsOutputSchema},
  prompt: `Based on the title and URL of the bookmark provided, suggest exactly 3 most relevant, essential, SHORT lowercase tags that best categorize this bookmark. Focus on the primary purpose, technology, or domain of the site.

URL: {{{url}}}
Title: {{{title}}}

Guidelines:
- Use the SHORTEST possible words (3-5 characters preferred, max 8 characters)
- Choose only the most essential tags that accurately describe the bookmark's purpose
- Prefer abbreviations and short forms: "dev" not "development", "js" not "javascript", "ai" not "artificial-intelligence"
- Use common, searchable short terms that would help organize bookmarks
- Avoid redundant or overly specific tags
- Examples of good short tags: "dev", "js", "ai", "docs", "tool", "news", "blog", "api", "code", "web", "app", "game", "video", "music", "shop", "work", "learn"
`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const suggestTagsFlow = ai.defineFlow(
  {
    name: 'suggestTagsFlow',
    inputSchema: SuggestTagsInputSchema,
    outputSchema: SuggestTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
