import dynamic from "next/dynamic";
import {
  listFolders,
  Folder,
} from "../../../../actions/projects/folderActions";
import { listItems, Item } from "../../../../actions/projects/itemActions";
import { notFound } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { NewItemModalButton } from "../../NewItemModalButton";

interface FolderViewProps {
  params: { projectId: string; folderId: string };
  searchParams?: { sort?: string };
}

export default async function FolderViewPage({
  params,
  searchParams,
}: FolderViewProps) {
  const { projectId, folderId } = params;
  // Fetch folder info
  const folders: Folder[] = await listFolders(projectId);
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return notFound();

  // Fetch items in this folder
  const items: Item[] = await listItems(projectId, folderId);

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
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Back to Project List button */}
        <div className="mb-2">
          <a
            href="/projects"
            className="inline-block text-blue-600 hover:underline"
          >
            ← Back to Project List
          </a>
        </div>
        {/* Back button */}
        <div className="mb-4">
          <a
            href={`/projects/${projectId}`}
            className="inline-block text-blue-600 hover:underline"
          >
            ← Back to Project
          </a>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-6 h-6 rounded"
            style={{ backgroundColor: folder.color }}
          />
          <h1 className="text-2xl font-bold">{folder.name}</h1>
        </div>
        <NewItemModalButton projectId={projectId} folderId={folderId} />
        <div className="flex gap-4 mb-8">
          <select
            className="ml-auto border rounded px-2 py-1"
            defaultValue={sort}
          >
            <option value="created_desc">Newest First</option>
            <option value="created_asc">Oldest First</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
          </select>
        </div>
        <div className="space-y-2">
          {sortedItems.length === 0 && (
            <div className="text-gray-500">No items in this folder.</div>
          )}
          {sortedItems.map((item) => (
            <a
              key={item.id}
              href={`/projects/${projectId}/items/${item.id}`}
              className="bg-gray-100 rounded p-3 flex items-center justify-between hover:bg-gray-200 transition-colors"
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
