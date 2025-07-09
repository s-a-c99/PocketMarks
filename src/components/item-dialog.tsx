
"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, X, Plus } from "lucide-react";
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
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [deletedTags, setDeletedTags] = useState<Set<string>>(new Set());
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
        const existingTags = itemToEdit?.type === 'bookmark' ? (itemToEdit.tags || []) : [];
        setCurrentTags(existingTags);
        setTagInput('');
        setDeletedTags(new Set());
        form.reset({
            type: type,
            title: itemToEdit?.title || "",
            url: itemToEdit?.type === 'bookmark' ? itemToEdit.url : "",
            tags: existingTags.join(', '),
        });
    }
  }, [itemToEdit, isOpen, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const itemData = values.type === 'bookmark'
        ? { type: 'bookmark' as const, title: values.title, url: values.url!, tags: currentTags }
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
            const filteredTags = result.tags.filter(tag => !deletedTags.has(tag));
            const newTags = [...new Set([...currentTags, ...filteredTags])];
            setCurrentTags(newTags);
            form.setValue('tags', newTags.join(', '));
            toast({
                title: "Tags Suggested",
                description: filteredTags.length > 0 ? "AI-powered tags have been added." : "AI suggested tags were previously deleted.",
            });
        }
    });
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
        const newTag = tagInput.trim().toLowerCase();
        const newTags = [...currentTags, newTag];
        setCurrentTags(newTags);
        form.setValue('tags', newTags.join(', '));
        setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    setCurrentTags(newTags);
    form.setValue('tags', newTags.join(', '));
    setDeletedTags(prev => new Set([...prev, tagToRemove]));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
    }
  };

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
                        <FormLabel>Tags</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={handleSuggestTags} disabled={isSuggesting}>
                            {isSuggesting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Suggest
                        </Button>
                      </div>
                      
                      {/* Current Tags Display */}
                      {currentTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {currentTags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 ml-1 hover:bg-transparent"
                                onClick={() => handleRemoveTag(tag)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Add New Tag Input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add new tag..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagInputKeyDown}
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddTag}
                          disabled={!tagInput.trim() || currentTags.includes(tagInput.trim())}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Hidden input to maintain form compatibility */}
                      <FormControl>
                        <Input {...field} className="hidden" />
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
