"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import { Button } from "./ui/button";
import { UserCircle, FileText } from "lucide-react";
import UserProfile from "./user-profile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

export default function DashboardNavbar() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, [supabase]);

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-6 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link
          href="/"
          prefetch
          className="flex items-center gap-3 text-2xl font-bold text-gray-900"
        >
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <span>
            NovaAI{" "}
            <span className="text-sm font-normal text-gray-500">
              YouTube Assistant
            </span>
          </span>
        </Link>
        <div className="flex gap-8 items-center">
          <Link
            href="/donate"
            className="text-base font-semibold gradient-green-text hover:opacity-80 transition-opacity"
          >
            Donate
          </Link>
          <Link
            href="/tools"
            className="text-base font-semibold text-gray-700 hover:text-gray-900"
          >
            Tools
          </Link>
          <Link
            href="/projects"
            className="text-base font-semibold text-gray-700 hover:text-gray-900"
          >
            Projects
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/ideas-brainstormer"
                  className="text-base font-semibold text-gray-700 hover:text-gray-900"
                >
                  Script Generator
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                AI-generate video scripts from your own topics
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/video-outliner"
                  className="text-base font-semibold text-gray-700 hover:text-gray-900"
                >
                  Video Outliner
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Plan your next video with AI-generated outlines.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard"
                  className="text-base font-semibold text-gray-700 hover:text-gray-900"
                >
                  YouTube Transcript
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Get YouTube transcript from video URL
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/history"
                  className="text-base font-semibold text-gray-700 hover:text-gray-900"
                >
                  History
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                View your action history.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {!loading &&
            (user ? (
              <UserProfile />
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-6 py-3 text-base font-semibold text-gray-700 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-6 py-3 text-base font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            ))}
        </div>
      </div>
    </nav>
  );
}
