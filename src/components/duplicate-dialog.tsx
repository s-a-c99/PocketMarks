"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";

type DuplicateDialogProps = {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

export function DuplicateDialog({ isOpen, onCancel, onConfirm }: DuplicateDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onCancel}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Duplicate Bookmark</AlertDialogTitle>
                    <AlertDialogDescription>
                        This bookmark URL already exists in your collection. Do you want to save it anyway?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                       <Button onClick={onConfirm} className="font-headline">Save Anyway</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
