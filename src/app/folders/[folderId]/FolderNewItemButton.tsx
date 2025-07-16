"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FilePlus, Plus } from "lucide-react";
import { NewItemForm } from "../../projects/[projectId]/NewItemForm";
import { HistoryImportModal } from "../../projects/[projectId]/HistoryImportModal";

interface FolderNewItemButtonProps {
  folderId: string;
}

const FolderNewItemButton: React.FC<FolderNewItemButtonProps> = ({
  folderId,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
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
          <DropdownMenuItem onSelect={() => setImportModalOpen(true)}>
            <FilePlus className="w-4 h-4 mr-2" /> Import items from history
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <div className="text-lg font-semibold mb-4">New item</div>
          <NewItemForm projectId={""} folderId={folderId} />
        </DialogContent>
      </Dialog>
      {/* Import from history modal */}
      <HistoryImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        projectId={""}
        folderId={folderId}
      />
    </div>
  );
};

export default FolderNewItemButton;
