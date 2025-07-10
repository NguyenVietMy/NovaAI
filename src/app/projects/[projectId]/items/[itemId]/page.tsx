import dynamic from "next/dynamic";
import {
  listItems,
  Item,
  updateItem,
  deleteItem,
} from "../../../../actions/projects/itemActions";
import {
  listFolders,
  Folder,
} from "../../../../actions/projects/folderActions";
import { notFound, redirect } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";

const ItemEditForm = dynamic(() => import("./ItemEditForm"), { ssr: false });

interface ItemViewProps {
  params: { projectId: string; itemId: string };
}

export default async function ItemViewPage({ params }: ItemViewProps) {
  const { projectId, itemId } = params;
  // Fetch all items in the project and find the one we want
  const items: Item[] = await listItems(projectId);
  const item = items.find((i) => i.id === itemId);
  if (!item) return notFound();

  // Fetch all folders for the move dropdown
  const folders: Folder[] = await listFolders(projectId);

  return (
    <>
      <DashboardNavbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
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
          {item.folder_id ? (
            <a
              href={`/projects/${projectId}/${item.folder_id}`}
              className="inline-block text-blue-600 hover:underline"
            >
              ← Back to Folder
            </a>
          ) : (
            <a
              href={`/projects/${projectId}`}
              className="inline-block text-blue-600 hover:underline"
            >
              ← Back to Project
            </a>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-6">Edit Item</h1>
        <ItemEditForm item={item} folders={folders} projectId={projectId} />
      </div>
    </>
  );
}
