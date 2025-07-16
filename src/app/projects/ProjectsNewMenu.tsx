"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, FolderPlus, FilePlus, Plus } from "lucide-react";
import { HistoryImportModal } from "./[projectId]/HistoryImportModal";

const NewProjectForm = dynamic(() => import("./NewProjectForm"), {
  ssr: false,
});
const NewFolderForm = dynamic(
  () => import("./[projectId]/NewFolderForm").then((mod) => mod.default),
  {
    ssr: false,
  }
);
const NewItemForm = dynamic(
  () => import("./[projectId]/NewItemForm").then((mod) => mod.NewItemForm),
  {
    ssr: false,
  }
);

export default function ProjectsNewMenu({
  userId,
  projectId,
}: {
  userId: string;
  projectId?: string;
}) {
  const [modal, setModal] = useState<
    null | "project" | "folder" | "item" | "import"
  >(null);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded border bg-white hover:bg-gray-50 text-base font-medium shadow">
            <Plus className="w-5 h-5" /> New
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setModal("project")}>
            <MoreVertical className="w-4 h-4 mr-2" /> New project
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setModal("folder")}>
            <FolderPlus className="w-4 h-4 mr-2" /> New folder
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setModal("item")}>
            <FilePlus className="w-4 h-4 mr-2" /> New item
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setModal("import")}>
            <FilePlus className="w-4 h-4 mr-2" /> Import items from history
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Project Modal */}
      <Dialog
        open={modal === "project"}
        onOpenChange={(open) => setModal(open ? "project" : null)}
      >
        <DialogContent>
          <div className="text-lg font-semibold mb-4">New Project</div>
          <NewProjectForm
            userId={userId}
            onProjectCreated={() => {
              setModal(null);
              window.location.reload();
            }}
          />
        </DialogContent>
      </Dialog>
      {/* Folder Modal */}
      <Dialog
        open={modal === "folder"}
        onOpenChange={(open) => setModal(open ? "folder" : null)}
      >
        <DialogContent>
          <div className="text-lg font-semibold mb-4">New Folder</div>
          {/* Pass projectId for project context, empty string for global */}
          <NewFolderForm projectId={projectId || ""} />
        </DialogContent>
      </Dialog>
      {/* Item Modal */}
      <Dialog
        open={modal === "item"}
        onOpenChange={(open) => setModal(open ? "item" : null)}
      >
        <DialogContent>
          <div className="text-lg font-semibold mb-4">New Item</div>
          {/* Pass projectId for project context, empty string for global */}
          <NewItemForm projectId={projectId || ""} folderId={""} />
        </DialogContent>
      </Dialog>
      {/* Import from history modal */}
      <Dialog
        open={modal === "import"}
        onOpenChange={(open) => setModal(open ? "import" : null)}
      >
        <DialogContent>
          <div className="text-lg font-semibold mb-4">
            Import items from history
          </div>
          <HistoryImportModal
            open={modal === "import"}
            onOpenChange={(open) => setModal(open ? "import" : null)}
            projectId={projectId || ""}
            folderId={""}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
