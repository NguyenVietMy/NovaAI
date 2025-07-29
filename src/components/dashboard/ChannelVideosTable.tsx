"use client";

import type { ChannelVideo } from "@/types/supabase";

interface ChannelVideosTableProps {
  channelVideos: ChannelVideo[];
  selectedVideos: string[];
  pageSize: number | "all";
  currentPage: number;
  onSelectedVideosChange: (selectedVideos: string[]) => void;
  onPageSizeChange: (pageSize: number | "all") => void;
  onCurrentPageChange: (page: number) => void;
}

export default function ChannelVideosTable({
  channelVideos,
  selectedVideos,
  pageSize,
  currentPage,
  onSelectedVideosChange,
  onPageSizeChange,
  onCurrentPageChange,
}: ChannelVideosTableProps) {
  // Compute paginated videos
  const totalPages =
    pageSize === "all"
      ? 1
      : Math.ceil(channelVideos.length / (pageSize as number));
  const paginatedVideos =
    pageSize === "all"
      ? channelVideos
      : channelVideos.slice(
          (currentPage - 1) * (pageSize as number),
          currentPage * (pageSize as number)
        );

  return (
    <div className="overflow-x-auto mt-6">
      {/* Page size selector */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm">Rows per page:</span>
        {(() => {
          const sizes: (number | string)[] = [10, 50, 100];
          const showAll = channelVideos.length <= 200;

          if (showAll) {
            sizes.push("All");
          }

          return sizes.map((size) => (
            <button
              key={size}
              className={`px-2 py-1 rounded border text-sm ${
                pageSize === size || (size === "All" && pageSize === "all")
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600 border-blue-600"
              }`}
              onClick={() => {
                if (size === "All" && channelVideos.length > 100) {
                  const confirmed = window.confirm(
                    `Warning: You're about to display ${channelVideos.length} videos at once. This may slow down your browser. Continue?`
                  );
                  if (!confirmed) return;
                }
                onPageSizeChange(size === "All" ? "all" : Number(size));
              }}
            >
              {size}
            </button>
          ));
        })()}
        {channelVideos.length > 200 && (
          <span className="text-xs text-orange-600 ml-2">
            (Large dataset: {channelVideos.length} videos - Viewing all videos
            at once is disabled)
          </span>
        )}
      </div>
      <table className="w-full bg-white border rounded-lg shadow table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {/* checkbox (unchanged) */}
            <th className="w-6 px-1 py-2 text-center pl-[22px]">
              <input
                type="checkbox"
                checked={selectedVideos.length === channelVideos.length}
                onChange={(e) =>
                  onSelectedVideosChange(
                    e.target.checked ? channelVideos.map((v) => v.id) : []
                  )
                }
              />
            </th>

            {/* thumbnail header: add left padding ~10px */}
            <th className="py-2 pl-[30px] pr-1 w-[90px] min-w-[90px] max-w-[90px] text-center">
              Thumbnail
            </th>

            <th className="px-2 py-2 text-left pl-[39px] w-2/3">Title</th>
            <th className="px-2 py-2 w-1/6 text-center">Placeholder</th>
            <th className="px-2 py-2 w-1/6 text-center">Placeholder 2</th>
            <th className="px-2 py-2 w-16 text-center pr-[30px]">Type</th>
            <th className="px-2 py-2 w-20 text-center pr-[35px]">
              YouTube Link
            </th>
          </tr>
        </thead>

        <tbody>
          {paginatedVideos.map((video) => {
            const isShort = video.url.includes("/shorts/");
            return (
              <tr key={video.id} className="border-t hover:bg-gray-50">
                {/* checkbox */}
                <td className="px-1 py-2 text-center pl-[22px]">
                  <input
                    type="checkbox"
                    checked={selectedVideos.includes(video.id)}
                    onChange={(e) => {
                      if (e.target.checked)
                        onSelectedVideosChange([...selectedVideos, video.id]);
                      else
                        onSelectedVideosChange(
                          selectedVideos.filter((id) => id !== video.id)
                        );
                    }}
                  />
                </td>

                {/* thumbnail cell: same 10px padding */}
                <td className="py-2 pl-[30px] pr-1 text-center">
                  <div className="inline-block w-[90px] aspect-video bg-gray-100 rounded overflow-hidden align-middle">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt="thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        N/A
                      </div>
                    )}
                  </div>
                </td>

                {/* title */}
                <td className="px-2 py-2 font-medium text-gray-900 w-2/3 pl-[39px]">
                  <div className="break-words whitespace-normal max-w-[600px] overflow-hidden">
                    {video.title}
                  </div>
                </td>

                {/* centered right columns */}
                <td className="px-2 py-2 text-center">
                  <span className="text-sm text-gray-500">Placeholder</span>
                </td>

                <td className="px-2 py-2 text-center">
                  <span className="text-sm text-gray-500">Placeholder 2</span>
                </td>

                <td className="px-2 py-2 text-center pr-[30px]">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold inline-block ${
                      isShort
                        ? "bg-yellow-300 text-yellow-800"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {isShort ? "Shorts" : "Videos"}
                  </span>
                </td>

                <td className="px-2 py-2 text-center pr-[35px]">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline inline-block"
                  >
                    YouTube
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination controls */}
      {pageSize !== "all" && (
        <div className="flex items-center justify-between mt-2">
          <button
            className="px-3 py-1 rounded border text-sm bg-white text-blue-600 border-blue-600 disabled:opacity-50"
            onClick={() => onCurrentPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded border text-sm bg-white text-blue-600 border-blue-600 disabled:opacity-50"
            onClick={() =>
              onCurrentPageChange(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
