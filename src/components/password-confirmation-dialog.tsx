"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasswordConfirmationDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onConfirm: (password: string) => void;
  title: string;
  description: string;
};

export function PasswordConfirmationDialog({ isOpen, setIsOpen, onConfirm, title, description }: PasswordConfirmationDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!password) {
      setError("Password cannot be empty.");
      return;
    }
    setError("");
    onConfirm(password);
    setIsOpen(false);
    setPassword("");
  };

  const handleCancel = () => {
    setIsOpen(false);
    setPassword("");
    setError("");
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="password-confirm">Password</Label>
          <Input 
            id="password-confirm" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            required 
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button type="button" onClick={handleConfirm} className="font-headline">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
