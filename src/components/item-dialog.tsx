"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@radix-ui/react-zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Loader2 } from "lucide-react";
import type { BookmarkItem } from "@/types";
import { suggestTagsAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  type: z.enum(["bookmark", "folder"]),
  title: z.string().min(1, "Title is required."),
  url: z.string().optional(),
  tags: z.string().optional(),
})
.transform((data) => {
    if (data.type === 'bookmark' && data.url && !/^(https?|ftp):\/\//i.test(data.url)) {
        return { ...data, url: `https://${data.url}` };
    }
    return data;
})
.refine(data => {
    if (data.type === 'bookmark') {
        return z.string().url({ message: "Invalid URL format." }).safeParse(data.url).success;
    }
    return true;
}, {
    message: "Please enter a valid URL for a bookmark.",
    path: ["url"],
});

type FormValues = Omit<BookmarkItem, 'id' | 'children' | 'createdAt'>;

type ItemDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onItemSaved: (values: FormValues) => void;
  itemToEdit?: BookmarkItem | null;
};

export function ItemDialog({ isOpen, setIsOpen, onItemSaved, itemToEdit }: ItemDialogProps) {
  const [itemType, setItemType] = useState<'bookmark' | 'folder'>('bookmark');
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'bookmark',
      title: "",
      url: "",
      tags: ""
    },
  });

  const isEditing = !!itemToEdit && !!itemToEdit.id;

  useEffect(() => {
    if (isOpen) {
        const type = itemToEdit?.type || 'bookmark';
        setItemType(type);
        form.reset({
            type: type,
            title: itemToEdit?.title || "",
            url: itemToEdit?.type === 'bookmark' ? itemToEdit.url : "",
            tags: itemToEdit?.type === 'bookmark' ? (itemToEdit.tags || []).join(', ') : "",
        });
    }
  }, [itemToEdit, isOpen, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const tagsArray = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const itemData = values.type === 'bookmark'
        ? { type: 'bookmark' as const, title: values.title, url: values.url!, tags: tagsArray }
        : { type: 'folder' as const, title: values.title };

    onItemSaved(itemData as FormValues);
  }

  const handleSuggestTags = () => {
    const { title, url } = form.getValues();
    if (!title || !url) {
        toast({
            variant: "destructive",
            title: "Suggestion Failed",
            description: "Please provide a title and URL to suggest tags.",
        });
        return;
    }
    startSuggestionTransition(async () => {
        const result = await suggestTagsAction({ title, url });
        if (result.error) {
            toast({
                variant: "destructive",
                title: "AI Suggestion Failed",
                description: result.error,
            });
        } else if (result.tags) {
            form.setValue('tags', result.tags.join(', '));
            toast({
                title: "Tags Suggested",
                description: "AI-powered tags have been added.",
            });
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[525px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">
            {isEditing ? `Edit ${itemToEdit.type}` : 'Add New Item'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details of your item." : "Add a new bookmark or folder to your collection."}
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
                            <Input placeholder="example.com" {...field} />
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
                      <div className="flex justify-between items-center">
                        <FormLabel>Tags (comma-separated)</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={handleSuggestTags} disabled={isSuggesting}>
                            {isSuggesting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Suggest
                        </Button>
                      </div>
                      <FormControl>
                        <Input placeholder="design, tools, inspiration" {...field} />
                      </FormControl>
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
