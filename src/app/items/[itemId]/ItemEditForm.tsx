"use client";
import { useState } from "react";
import type { Item, Folder, ItemType } from "@/types/supabase";
import type { TimedBlock } from "@/app/actions/youtube/youtubeTranscriptActions";
import type { ApiResponse } from "@/types/api";
import { updateItem, deleteItem } from "../../actions/projects/itemActions";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { createClient } from "../../../../supabase/client";

interface ItemEditFormProps {
  item: Item;
  folders: Folder[];
  projectId: string;
  sourceFolder?: string;
}

export default function ItemEditForm({
  item,
  folders,
  projectId,
  sourceFolder,
}: ItemEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [type, setType] = useState<ItemType>(item.type);
  const [data, setData] = useState(JSON.stringify(item.data, null, 2));
  const [folderId, setFolderId] = useState(item.folder_id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add state for transcript fields
  const [transcriptPlain, setTranscriptPlain] = useState(
    item.data.transcriptPlain || ""
  );
  const [transcriptBlocks, setTranscriptBlocks] = useState<TimedBlock[]>(
    item.data.transcriptBlocks || []
  );
  const [transcriptTimed, setTranscriptTimed] = useState(
    item.data.transcriptTimed || ""
  );

  // For detailed timestamp editing
  const [timedLines, setTimedLines] = useState<string[]>(() =>
    transcriptTimed.split("\n")
  );
  useEffect(() => {
    setTimedLines(transcriptTimed.split("\n"));
  }, [transcriptTimed]);

  // State for editing timestamp and text for each line
  const [editTimestamps, setEditTimestamps] = useState<string[]>(() =>
    timedLines.map((line) => parseTimestampLine(line).timestamp)
  );
  const [editTexts, setEditTexts] = useState<string[]>(() =>
    timedLines.map((line) => parseTimestampLine(line).text)
  );
  const [editErrors, setEditErrors] = useState<(string | null)[]>(() =>
    timedLines.map(() => null)
  );
  useEffect(() => {
    setEditTimestamps(
      timedLines.map((line) => parseTimestampLine(line).timestamp)
    );
    setEditTexts(timedLines.map((line) => parseTimestampLine(line).text));
    setEditErrors(timedLines.map(() => null));
  }, [timedLines.length]);

  // Helper: is timestamp line
  function isTimestamp(line: string) {
    return /^\d{2}:\d{2}:\d{2}\.\d{3}/.test(line.trim());
  }

  // Helper: parse line into timestamp and text
  function parseTimestampLine(line: string): {
    timestamp: string;
    text: string;
  } {
    const match = line.match(/^(\d{2}:\d{2}:\d{2}\.\d{3})\s*(.*)$/);
    if (match) {
      return { timestamp: match[1], text: match[2] };
    }
    return { timestamp: "", text: line };
  }

  // Handle block edit for 20s blocks
  function handleBlockEdit(idx: number, newText: string) {
    setTranscriptBlocks((blocks: TimedBlock[]) =>
      blocks.map((b: TimedBlock, i: number) =>
        i === idx ? { ...b, text: newText } : b
      )
    );
  }

  // Handle detailed line edit
  function handleTimedLineEdit(idx: number, newText: string) {
    setTimedLines((lines) => lines.map((l, i) => (i === idx ? newText : l)));
  }

  // Handle save action
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Fetch current user (ownerId)
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const ownerId = userData?.user?.id;
      if (!ownerId) throw new Error("User not authenticated");

      await updateItem(item.id, ownerId, {
        name,
        type,
        data: {
          ...item.data,
          transcriptPlain,
          transcriptBlocks,
          transcriptTimed: timedLines.join("\n"),
        },
        folder_id: folderId || null,
      });

      // Redirect to the item's folder, project, or /projects
      if (item.folder_id) {
        router.push(`/folders/${item.folder_id}`);
      } else if (item.project_id) {
        router.push(`/projects/${item.project_id}`);
      } else {
        router.push(`/projects`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update item");
    } finally {
      setLoading(false);
    }
  }

  // Handle delete action
  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch current user (ownerId)
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const ownerId = userData?.user?.id;
      if (!ownerId) throw new Error("User not authenticated");

      await deleteItem(item.id, ownerId);
      // Redirect to the item's folder, project, or /projects
      if (item.folder_id) {
        router.push(`/folders/${item.folder_id}`);
      } else if (item.project_id) {
        router.push(`/projects/${item.project_id}`);
      } else {
        router.push(`/projects`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-6 bg-white rounded shadow p-6"
    >
      {/* Item name */}
      <div>
        <label className="block font-medium mb-1">Name</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      {/* Item type (readonly for now) */}
      <div>
        <label className="block font-medium mb-1">Type</label>
        <input
          className="w-full border rounded px-3 py-2 bg-gray-100"
          value={type === "transcript (custom)" ? "transcript (custom)" : type}
          readOnly
        />
      </div>
      {/* Item data as JSON (replace with tabs) */}
      <div>
        <label className="block font-medium mb-1">Transcript Editor</label>
        <Tabs defaultValue="plain" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="plain">Transcript Plain</TabsTrigger>
            <TabsTrigger value="blocks">20s Blocks</TabsTrigger>
            <TabsTrigger value="timed">Detailed Timestamp</TabsTrigger>
          </TabsList>
          {/* Plain Tab */}
          <TabsContent value="plain">
            <textarea
              className="w-full border rounded px-3 py-2 font-mono"
              rows={8}
              value={transcriptPlain}
              onChange={(e) => setTranscriptPlain(e.target.value)}
            />
          </TabsContent>
          {/* 20s Blocks Tab */}
          <TabsContent value="blocks">
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {transcriptBlocks.map((block: TimedBlock, idx: number) => (
                <div
                  key={idx}
                  className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="text-xs text-gray-500 mb-2 font-mono">
                    {block.start} - {block.end}
                  </div>
                  <EditableBlock
                    text={block.text}
                    onSave={(newText) => handleBlockEdit(idx, newText)}
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              className="mt-4"
              onClick={() => {
                // Helper to parse timestamp string to seconds
                function parseTimestamp(ts: string) {
                  const [h, m, s] = ts.split(":");
                  const [sec, ms] = s.split(".");
                  return (
                    parseInt(h) * 3600 +
                    parseInt(m) * 60 +
                    parseInt(sec) +
                    (ms ? parseInt(ms) / 1000 : 0)
                  );
                }
                // Helper to format seconds to timestamp string
                function formatTimestamp(totalSeconds: number) {
                  const h = Math.floor(totalSeconds / 3600)
                    .toString()
                    .padStart(2, "0");
                  const m = Math.floor((totalSeconds % 3600) / 60)
                    .toString()
                    .padStart(2, "0");
                  const s = Math.floor(totalSeconds % 60)
                    .toString()
                    .padStart(2, "0");
                  return `${h}:${m}:${s}.000`;
                }
                setTranscriptBlocks((prev) => {
                  if (prev.length === 0) {
                    // If no blocks, start at 00:00:00
                    return [
                      { start: "00:00:00.000", end: "00:00:20.000", text: "" },
                    ];
                  }
                  const last = prev[prev.length - 1];
                  const startSec = parseTimestamp(last.start);
                  const endSec = parseTimestamp(last.end);
                  const duration = endSec - startSec;
                  if (duration < 20) {
                    // Extend last block to 20s
                    const newEnd = formatTimestamp(startSec + 20);
                    const updated = prev
                      .slice(0, -1)
                      .concat({ ...last, end: newEnd });
                    // Add a new empty block after
                    return [
                      ...updated,
                      {
                        start: newEnd,
                        end: formatTimestamp(startSec + 40),
                        text: "",
                      },
                    ];
                  } else {
                    // Add a new empty block after
                    return [
                      ...prev,
                      {
                        start: last.end,
                        end: formatTimestamp(parseTimestamp(last.end) + 20),
                        text: "",
                      },
                    ];
                  }
                });
              }}
            >
              + Add 20s Block
            </Button>
          </TabsContent>
          {/* Detailed Timestamp Tab */}
          <TabsContent value="timed">
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {timedLines.map((line, idx) => {
                function isValidTimestamp(ts: string) {
                  return /^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(ts);
                }
                const error = editErrors[idx];
                return (
                  <div
                    key={idx}
                    className="flex items-stretch rounded border border-gray-200 bg-gray-50"
                  >
                    <div className="w-1/5 flex items-center justify-center bg-gray-200 text-xs font-mono px-2">
                      <input
                        type="text"
                        className={`w-full bg-transparent outline-none font-mono text-xs px-1 ${error ? "border-red-500 border" : ""}`}
                        value={editTimestamps[idx]}
                        onChange={(e) => {
                          const newTs = e.target.value;
                          setEditTimestamps((tsArr) =>
                            tsArr.map((v, i) => (i === idx ? newTs : v))
                          );
                          // Only validate format
                          let err = null;
                          if (!isValidTimestamp(newTs)) {
                            err = "Format must be 00:00:00.000";
                          }
                          setEditErrors((errArr) =>
                            errArr.map((v, i) => (i === idx ? err : v))
                          );
                        }}
                        onBlur={() => {
                          // Only save if valid
                          if (!editErrors[idx]) {
                            handleTimedLineEdit(
                              idx,
                              `${editTimestamps[idx]} ${editTexts[idx]}`
                            );
                          }
                        }}
                        maxLength={12}
                        placeholder="00:00:00.000"
                      />
                    </div>
                    <div className="w-4/5 px-2 py-1 flex items-center h-[2.5rem]">
                      <EditableBlock
                        text={editTexts[idx]}
                        onSave={(newText) => {
                          setEditTexts((txtArr) =>
                            txtArr.map((v, i) => (i === idx ? newText : v))
                          );
                          if (!editErrors[idx]) {
                            handleTimedLineEdit(
                              idx,
                              `${editTimestamps[idx]} ${newText}`
                            );
                          }
                        }}
                        placeholder={
                          editTexts[idx]
                            ? undefined
                            : "Enter transcript text..."
                        }
                      />
                    </div>
                    {error && (
                      <div className="text-xs text-red-500 px-2 flex items-center">
                        {error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Button
              type="button"
              className="mt-4"
              onClick={() => {
                setTimedLines((prev) => [
                  ...prev,
                  "00:00:00.000 ", // timestamp with empty text
                ]);
                setEditTimestamps((prev) => [...prev, "00:00:00.000"]);
                setEditTexts((prev) => [...prev, ""]);
                setEditErrors((prev) => [...prev, null]);
              }}
            >
              + Add Timestamp Line
            </Button>
          </TabsContent>
        </Tabs>
      </div>
      {/* Folder dropdown */}
      <div>
        <label className="block font-medium mb-1">Folder</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
        >
          <option value="">Uncategorized</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>
      {/* Error message */}
      {error && <div className="text-red-600">{error}</div>}
      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          Save
        </button>
        <button
          type="button"
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="bg-red-600 text-white px-4 py-2 rounded ml-auto"
          onClick={handleDelete}
          disabled={loading}
        >
          Delete
        </button>
      </div>
    </form>
  );
}

// --- EditableBlock component ---
function EditableBlock({
  text,
  onSave,
  placeholder,
}: {
  text: string;
  onSave: (t: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(text);
  useEffect(() => {
    setValue(text);
  }, [text]);
  return editing ? (
    <textarea
      className="w-full border rounded px-2 py-1 font-mono h-full resize-none"
      value={value}
      autoFocus
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        setEditing(false);
        onSave(value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          setEditing(false);
          onSave(value);
        }
      }}
      rows={1}
      placeholder={placeholder}
    />
  ) : (
    <div
      className="cursor-pointer whitespace-pre-line min-h-[2rem] w-full flex items-center"
      onClick={() => setEditing(true)}
    >
      {text || (
        <span className="text-gray-400">{placeholder || "(empty)"}</span>
      )}
    </div>
  );
}
