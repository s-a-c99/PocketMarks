"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import type { Bookmark } from "@/types";

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  url: z.string().url("Please enter a valid URL."),
});

type AddBookmarkDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onBookmarkSaved: (values: Omit<Bookmark, 'id'>) => void;
  bookmarkToEdit?: Bookmark | null;
};

export function AddBookmarkDialog({ isOpen, setIsOpen, onBookmarkSaved, bookmarkToEdit }: AddBookmarkDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
    },
  });

  useEffect(() => {
    if (bookmarkToEdit) {
      form.reset({
        title: bookmarkToEdit.title,
        url: bookmarkToEdit.url,
      });
    } else {
      form.reset({ title: "", url: "" });
    }
  }, [bookmarkToEdit, isOpen, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    onBookmarkSaved(values);
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
            <DialogFooter className="pt-4">
              <Button type="submit" className="font-headline">{bookmarkToEdit ? "Save Changes" : "Add Bookmark"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
