import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "../../../../supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createItem } from "../../actions/projects/itemActions";
import { useRouter } from "next/navigation";

interface HistoryItem {
  id: string;
  output: { data: any; success: boolean };
  created_at: string;
}

export function HistoryImportModal({
  open,
  onOpenChange,
  projectId,
  folderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  folderId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailsItem, setDetailsItem] = useState<HistoryItem | null>(null);
  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    setImportError(null);
    setImportSuccess(false);
    try {
      const itemsToImport = historyItems.filter((item) =>
        selectedIds.includes(item.id)
      );
      for (const item of itemsToImport) {
        const res = await createItem(
          projectId,
          item.id, // name
          "transcript",
          item.output.data,
          folderId
        );
        if (!res.success) {
          setImportError(res.error || "Failed to import item: " + item.id);
          setImporting(false);
          return;
        }
      }
      setImportSuccess(true);
      setSelectedIds([]);
      router.refresh();
    } catch (err) {
      setImportError("Unexpected error during import");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          setError("Failed to get user session");
          setLoading(false);
          return;
        }
        // Fetch history items for this user
        const { data, error: fetchError } = await supabase
          .from("youtube_transcript_cache")
          .select("id, output, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (fetchError) {
          setError("Failed to fetch history items");
        } else {
          setHistoryItems(data || []);
          // For debugging, log the results
          console.log("Fetched history items:", data);
        }
      } catch (err) {
        setError("Unexpected error fetching history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import items from history</DialogTitle>
        </DialogHeader>
        {loading && <div>Loading history...</div>}
        {error && <div className="text-red-500">{error}</div>}
        <ul className="divide-y divide-gray-200">
          {historyItems.map((item) => (
            <li key={item.id} className="mb-4">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => handleToggle(item.id)}
                  />
                  <span className="font-mono text-sm">{item.id}</span>
                  <span className="ml-4 text-gray-500 text-xs">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => setDetailsItem(item)}
                >
                  View Details
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4 mt-4">
          <button
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
            disabled={importing || selectedIds.length === 0}
            onClick={handleImport}
          >
            {importing ? "Importing..." : "Confirm Import"}
          </button>
          {importError && (
            <span className="text-red-500 text-sm">{importError}</span>
          )}
          {importSuccess && (
            <span className="text-green-600 text-sm">Import successful!</span>
          )}
        </div>
      </DialogContent>
      {/* Stacked details modal */}
      {detailsItem && (
        <Dialog open={!!detailsItem} onOpenChange={() => setDetailsItem(null)}>
          <DialogContent className="max-w-2xl w-full p-0 overflow-hidden">
            <div className="bg-white p-6">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  Transcript Details
                </DialogTitle>
                <div className="text-xs text-gray-500">
                  ID: {detailsItem.id}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Created: {new Date(detailsItem.created_at).toLocaleString()}
                </div>
              </DialogHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
                {detailsItem.output?.data?.thumbnailUrl && (
                  <img
                    src={detailsItem.output.data.thumbnailUrl}
                    alt="YouTube thumbnail"
                    className="rounded-lg shadow w-full sm:w-64 object-cover mt-3"
                    style={{ aspectRatio: "16/9", background: "#eee" }}
                  />
                )}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="mb-1">
                    <span className="font-bold text-lg">
                      {detailsItem.output?.data?.title || "Video Title"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span>
                      {detailsItem.output?.data?.duration || "--:--:--"}
                    </span>
                  </div>
                </div>
              </div>
              <Tabs defaultValue="blocks" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="blocks">Transcript Blocks</TabsTrigger>
                  <TabsTrigger value="plain">Transcript Plain</TabsTrigger>
                </TabsList>
                <TabsContent value="blocks">
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {detailsItem.output?.data?.transcriptBlocks?.map(
                      (block: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-gray-100 rounded-lg p-4 border border-gray-200 shadow-sm"
                        >
                          <div className="text-xs text-gray-500 mb-2 font-mono">
                            {block.start} - {block.end}
                          </div>
                          <div className="text-sm leading-relaxed whitespace-pre-line">
                            {block.text}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="plain">
                  <div className="bg-gray-100 rounded-lg p-4 max-h-80 overflow-y-auto font-mono text-sm whitespace-pre-line">
                    {detailsItem.output?.data?.transcriptPlain ||
                      "No transcript available."}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
