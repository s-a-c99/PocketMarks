"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from 'uuid';
import { Sparkles, Loader2, X, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { suggestTagsAction } from "@/lib/actions";
import type { Bookmark } from "@/types";

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  url: z.string().url("Please enter a valid URL."),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type AddBookmarkDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onBookmarkSaved: (bookmark: Bookmark) => void;
  bookmarkToEdit?: Bookmark | null;
};

export function AddBookmarkDialog({ isOpen, setIsOpen, onBookmarkSaved, bookmarkToEdit }: AddBookmarkDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      tags: [],
    },
  });

  useEffect(() => {
    if (bookmarkToEdit) {
      form.reset({
        title: bookmarkToEdit.title,
        url: bookmarkToEdit.url,
        description: bookmarkToEdit.description || "",
      });
      setCurrentTags(bookmarkToEdit.tags);
    } else {
      form.reset({ title: "", url: "", description: "" });
      setCurrentTags([]);
    }
    setSuggestedTags([]);
  }, [bookmarkToEdit, isOpen, form]);

  const handleSuggestTags = () => {
    const { url, title } = form.getValues();
    if (!url || !title) {
      toast({
        variant: "destructive",
        title: "URL and Title required",
        description: "Please provide a URL and a title to get tag suggestions.",
      });
      return;
    }
    startTransition(async () => {
      const result = await suggestTagsAction({ url, title });
      if (result.success && result.tags) {
        setSuggestedTags(result.tags.filter(tag => !currentTags.includes(tag)));
      } else {
        toast({
          variant: "destructive",
          title: "Suggestion Failed",
          description: result.error || "Could not fetch tag suggestions.",
        });
      }
    });
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !currentTags.includes(trimmedTag)) {
      setCurrentTags([...currentTags, trimmedTag]);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setCurrentTags(currentTags.filter(tag => tag !== tagToRemove));
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newBookmark: Bookmark = {
      id: bookmarkToEdit?.id || uuidv4(),
      ...values,
      tags: currentTags,
      createdAt: bookmarkToEdit?.createdAt || new Date().toISOString(),
    };
    onBookmarkSaved(newBookmark);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{bookmarkToEdit ? "Edit Bookmark" : "Add New Bookmark"}</DialogTitle>
          <DialogDescription>
            {bookmarkToEdit ? "Update the details of your bookmark." : "Save a new link to your collection."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. My Favorite Design Tool" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A short description of the link (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <FormLabel>Tags</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={handleSuggestTags} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Suggest Tags
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-md min-h-[40px]">
                {currentTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-base">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-2 rounded-full hover:bg-muted p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add a tag..."
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 h-auto p-0 m-0 bg-transparent"
                />
              </div>
               {suggestedTags.length > 0 && <div className="flex flex-wrap gap-2">
                {suggestedTags.map(tag => (
                  <Badge key={tag} variant="outline" className="cursor-pointer" onClick={() => { addTag(tag); setSuggestedTags(suggestedTags.filter(t => t !== tag)); }}>
                    <Plus className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>}
            </div>
            <DialogFooter>
              <Button type="submit" className="font-headline">{bookmarkToEdit ? "Save Changes" : "Add Bookmark"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
