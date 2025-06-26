"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Bookmark, BookmarkItem } from "@/types";
import { suggestTags } from "@/ai/flows/suggest-tags";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  type: z.enum(["bookmark", "folder"]),
  title: z.string().min(1, "Title is required."),
  url: z.string().optional(),
  tags: z.string().optional(),
}).refine(data => {
    if (data.type === 'bookmark') {
        return !!data.url && z.string().url().safeParse(data.url).success;
    }
    return true;
}, {
    message: "Please enter a valid URL for a bookmark.",
    path: ["url"],
});

type ItemDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onItemSaved: (values: Omit<BookmarkItem, 'id' | 'children'>, parentId: string | null) => void;
  itemToEdit?: BookmarkItem | null;
  parentId?: string | null;
};

export function ItemDialog({ isOpen, setIsOpen, onItemSaved, itemToEdit, parentId = null }: ItemDialogProps) {
  const [itemType, setItemType] = useState<'bookmark' | 'folder'>('bookmark');
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'bookmark',
      title: "",
      url: "",
      tags: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
        const type = itemToEdit?.type || 'bookmark';
        setItemType(type);
        form.reset({
            type: type,
            title: itemToEdit?.title || "",
            url: itemToEdit?.type === 'bookmark' ? itemToEdit.url : "",
            tags: itemToEdit?.type === 'bookmark' ? itemToEdit.tags?.join(', ') : "",
        });
    }
  }, [itemToEdit, isOpen, form]);

  const handleSuggestTags = () => {
    const { title, url } = form.getValues();
    if (!title || !url) {
        toast({
            variant: "destructive",
            title: "Suggestion Failed",
            description: "Please provide a title and URL before suggesting tags.",
        });
        return;
    }

    startSuggestionTransition(async () => {
        try {
            const result = await suggestTags({ title, url });
            if (result.tags && result.tags.length > 0) {
                form.setValue('tags', result.tags.join(', '));
                 toast({
                    title: "Tags Suggested!",
                    description: "AI-powered tags have been added.",
                });
            } else {
                 toast({
                    variant: "destructive",
                    title: "Suggestion Failed",
                    description: "Could not suggest any tags for this bookmark.",
                });
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Suggestion Error",
                description: "An error occurred while suggesting tags.",
            });
        }
    });
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const tagsArray = values.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [];
    if (values.type === 'bookmark') {
        onItemSaved({ type: 'bookmark', title: values.title, url: values.url!, tags: tagsArray }, parentId);
    } else {
        onItemSaved({ type: 'folder', title: values.title }, parentId);
    }
    setIsOpen(false);
  }

  const isEditing = !!itemToEdit;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[525px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">
            {isEditing ? `Edit ${itemToEdit.type}` : 'Add New Item'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details of your item." : "Add a new bookmark or folder."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            
            {!isEditing && (
                 <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={(value) => {
                                field.onChange(value);
                                setItemType(value as 'bookmark' | 'folder');
                            }}
                            defaultValue={field.value}
                            className="flex items-center space-x-4"
                            >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="bookmark" />
                                </FormControl>
                                <FormLabel className="font-normal">Bookmark</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="folder" />
                                </FormControl>
                                <FormLabel className="font-normal">Folder</FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder={itemType === 'bookmark' ? "e.g. My Favorite Design Tool" : "e.g. Work Projects"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {itemType === 'bookmark' && (
              <>
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
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input placeholder="design, tools, inspiration" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleSuggestTags}
                          disabled={isSuggesting}
                          aria-label="Suggest Tags"
                        >
                          <Wand2 className={`h-4 w-4 ${isSuggesting ? 'animate-pulse' : ''}`} />
                        </Button>
                      </div>
                       <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter className="pt-4">
              <Button type="submit" className="font-headline">{isEditing ? "Save Changes" : "Add Item"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
