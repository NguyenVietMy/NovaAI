import Link from "next/link";
import { createClient } from "../../supabase/server";
import { Button } from "./ui/button";
import { User, UserCircle, FileText } from "lucide-react";
import UserProfile from "./user-profile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default async function Navbar() {
  const supabase = createClient();

  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-3 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link
          href="/"
          prefetch
          className="flex items-center gap-2 text-xl font-bold text-gray-900"
        >
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span>
            NovaAI{" "}
            <span className="text-xs font-normal text-gray-500">
              YouTube Assistant
            </span>
          </span>
        </Link>
        <div className="flex gap-6 items-center">
          <Link
            href="/tools"
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Tools
          </Link>
          <Link
            href="/projects"
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Projects
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/ideas-brainstormer"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
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
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
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
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
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
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  History
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                View your action history.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {user ? (
            <UserProfile />
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
