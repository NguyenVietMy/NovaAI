import dynamic from "next/dynamic";
import { listFolders, Folder } from "../../actions/projects/folderActions";
import { listItems, Item } from "../../actions/projects/itemActions";
import { listProjects, Project } from "../../actions/projects/projectActions";
import { notFound } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import DashboardNavbar from "@/components/dashboard-navbar";
const NewFolderForm = dynamic(() => import("./NewFolderForm"), { ssr: false });
const NewItemForm = dynamic(() => import("./NewItemForm"), { ssr: false });

interface ProjectDashboardProps {
  params: { projectId: string };
  searchParams?: { sort?: string };
}

export default async function ProjectDashboard({
  params,
  searchParams,
}: ProjectDashboardProps) {
  const { projectId } = params;
  // Fetch project (for name)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Handle not logged in (redirect or show message)
    return <div>Please sign in to view your projects.</div>;
  }

  const userId = user.id;
  const projects = await listProjects(userId); // TODO: Replace with actual user id from session
  const project = projects.find((p: Project) => p.id === projectId);
  if (!project) return notFound();

  // Fetch folders and uncategorized items
  const folders: Folder[] = await listFolders(projectId);
  const items: Item[] = await listItems(projectId, null); // folderless items

  // Sorting (default: created_at desc)
  const sort = searchParams?.sort || "created_desc";
  let sortedItems = [...items];
  if (sort === "created_asc")
    sortedItems.sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (sort === "name_asc")
    sortedItems.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "name_desc")
    sortedItems.sort((a, b) => b.name.localeCompare(a.name));

  return (
    <>
      <DashboardNavbar />
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Back to Project List button */}
        <div className="mb-4">
          <a
            href="/projects"
            className="inline-block text-blue-600 hover:underline"
          >
            ← Back to Project List
          </a>
        </div>
        <h1 className="text-2xl font-bold mb-6">{project.name}</h1>
        <div className="space-y-6 mb-10">
          <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
            <NewFolderForm projectId={projectId} />
          </div>
          <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
            <NewItemForm projectId={projectId} />
          </div>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Folders</h2>
          <div className="ml-auto">
            <select className="border rounded px-2 py-1" defaultValue={sort}>
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mb-10">
          {folders.length === 0 && (
            <div className="text-gray-500">No folders yet.</div>
          )}
          {folders.map((folder) => (
            <a
              key={folder.id}
              href={`/projects/${projectId}/folders/${folder.id}`}
              className="rounded-lg p-4 min-w-[160px] cursor-pointer transition-shadow hover:shadow-lg bg-white border border-gray-200 hover:border-blue-400"
              style={{ backgroundColor: folder.color }}
            >
              <div className="font-semibold">{folder.name}</div>
            </a>
          ))}
        </div>
        <div className="mb-2">
          <h2 className="text-lg font-semibold">Uncategorized Items</h2>
        </div>
        <div className="space-y-2">
          {sortedItems.length === 0 && (
            <div className="text-gray-500">No uncategorized items.</div>
          )}
          {sortedItems.map((item) => (
            <a
              key={item.id}
              href={`/projects/${projectId}/items/${item.id}`}
              className="bg-gray-100 rounded p-3 flex items-center justify-between hover:bg-gray-200 transition-colors border border-gray-200 hover:border-blue-400"
            >
              <span className="font-mono text-sm">{item.name}</span>
              <span className="text-xs text-gray-500">{item.type}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
