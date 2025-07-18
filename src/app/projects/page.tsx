import dynamic from "next/dynamic";
import { listProjects } from "../actions/projects/projectActions";
import { listFolders } from "../actions/projects/folderActions";
import { listItems } from "../actions/projects/itemActions";
import { createClient } from "../../../supabase/server";
import DashboardNavbar from "@/components/dashboard-navbar";
import ProjectListClient from "@/components/ProjectListClient";
import FolderCard from "@/components/FolderCard";
import {
  renameFolder,
  updateFolderColor,
  deleteFolder,
} from "../actions/projects/folderActions";
import type { Project, Folder, Item } from "@/types/supabase";
import ProjectsNewMenu from "./ProjectsNewMenu";
import FolderListClient from "@/components/FolderListClient";
import { listOwnedAndSharedFolders } from "../actions/projects/folderActions";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Handle not logged in (redirect or show message)
    return <div>Please sign in to view your projects.</div>;
  }

  const userId = user.id;
  const projects: Project[] = await listProjects(userId);
  // Fetch global folders and items (not in any project)
  const globalFolders = (await listOwnedAndSharedFolders(
    userId
  )) as import("@/types/supabase").FolderWithOwner[];
  const globalItems: Item[] = await listItems(userId, null, null);

  return (
    <>
      <DashboardNavbar />
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Your Projects</h1>
        <div className="mb-6 flex justify-start">
          <ProjectsNewMenu userId={userId} showNewProjectOption={true} />
        </div>
        {/* Notification about folder sharing limitation */}
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
          <strong>Note:</strong> Items added to a folder <u>after</u> it is
          shared will not be visible to recipients unless you unshare the folder
          and share it again. SORRY FOR THE BUG {";)"}
        </div>
        <ProjectListClient projects={projects} userId={userId} />
        {/* Global Folders Section */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2">Global Folders</h2>
          {globalFolders.length === 0 ? (
            <div className="text-gray-500 mb-4">No global folders.</div>
          ) : (
            <FolderListClient
              folders={globalFolders}
              projectId={""}
              hideNewButton={true}
            />
          )}
        </div>
        {/* Global Items Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Global Items</h2>
          {globalItems.length === 0 ? (
            <div className="text-gray-500 mb-4">No global items.</div>
          ) : (
            <div className="mb-4 space-y-2">
              {globalItems.map((item) => (
                <a
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="block mb-2 p-3 bg-gray-100 rounded border border-gray-200 hover:bg-gray-200 transition"
                >
                  <span className="font-mono text-sm">{item.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {item.type}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
