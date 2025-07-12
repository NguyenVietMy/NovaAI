"use client";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FilePlus, Plus } from "lucide-react";
import { NewItemForm } from "./NewItemForm";

export function NewItemModalButton({
  projectId,
  folderId,
}: {
  projectId: string;
  folderId?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setModalOpen(true)}>
            <FilePlus className="w-4 h-4 mr-2" /> New item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <div className="text-lg font-semibold mb-4">New item</div>
          <NewItemForm projectId={projectId} folderId={folderId} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
