import dynamic from "next/dynamic";
import { listProjects } from "../actions/projects/projectActions";
import { listFolders } from "../actions/projects/folderActions";
import { listItems } from "../actions/projects/itemActions";
import { createClient } from "../../../supabase/server";
import DashboardNavbar from "@/components/dashboard-navbar";
import ProjectListClient from "@/components/ProjectListClient";
import type { Project, Folder, Item } from "@/types/supabase";
import ProjectsNewMenu from "./ProjectsNewMenu";

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
  const globalFolders: Folder[] = await listFolders(userId, null);
  const globalItems: Item[] = await listItems(userId, null, null);

  return (
    <>
      <DashboardNavbar />
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Your Projects</h1>
        <div className="mb-6 flex justify-start">
          <ProjectsNewMenu userId={userId} />
        </div>
        <ProjectListClient projects={projects} userId={userId} />
        {/* Global Folders Section */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2">Global Folders</h2>
          {globalFolders.length === 0 ? (
            <div className="text-gray-500 mb-4">No global folders.</div>
          ) : (
            <ul className="mb-4">
              {globalFolders.map((folder) => (
                <li
                  key={folder.id}
                  className="mb-2 p-3 bg-gray-100 rounded border border-gray-200"
                >
                  <a
                    href={`/folders/${folder.id}`}
                    className="font-mono text-sm hover:underline"
                  >
                    {folder.name}
                  </a>
                  <span className="ml-2 text-xs text-gray-500">
                    {folder.color}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Global Items Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Global Items</h2>
          {globalItems.length === 0 ? (
            <div className="text-gray-500 mb-4">No global items.</div>
          ) : (
            <ul className="mb-4">
              {globalItems.map((item) => (
                <li
                  key={item.id}
                  className="mb-2 p-3 bg-gray-100 rounded border border-gray-200"
                >
                  <a
                    href={`/items/${item.id}`}
                    className="font-mono text-sm hover:underline"
                  >
                    {item.name}
                  </a>
                  <span className="ml-2 text-xs text-gray-500">
                    {item.type}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
