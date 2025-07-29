"use client";

import { Video, List } from "lucide-react";

interface VideoTypeToggleProps {
  videoType: "single" | "channel";
  onVideoTypeChange: (type: "single" | "channel") => void;
}

export default function VideoTypeToggle({
  videoType,
  onVideoTypeChange,
}: VideoTypeToggleProps) {
  return (
    <div className="lg:col-span-2 flex justify-center mb-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex items-center">
        <button
          onClick={() => onVideoTypeChange("single")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            videoType === "single"
              ? "bg-red-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Video className="w-4 h-4" />
          <span className="font-medium">Single Video</span>
        </button>
        <div className="relative">
          <button
            onClick={() => onVideoTypeChange("channel")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              videoType === "channel"
                ? "bg-red-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <List className="w-4 h-4" />
            <span className="font-medium">Channel/Playlist</span>
          </button>
        </div>
      </div>
    </div>
  );
}
