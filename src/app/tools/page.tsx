import Link from "next/link";
import { FileText, Zap, Users } from "lucide-react";

export default function ToolsOverview() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-16">
      <div className="container mx-auto px-4">
        {/* NovaAI Home Icon */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <FileText className="w-5 h-5 text-white" />
            </span>
            <span className="text-lg font-bold text-gray-900 group-hover:text-red-700 transition-colors">
              NovaAI
            </span>
          </Link>
        </div>
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Explore All NovaAI Tools</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose from our suite of AI-powered YouTube tools. Whether you want
            to generate transcripts, outline videos, or brainstorm new ideas,
            NovaAI has you covered.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Transcript + AI Summary */}
          <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full items-center">
            <FileText className="w-10 h-10 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Transcript + AI Summary
            </h2>
            <p className="text-gray-600 mb-6 text-center flex-1">
              Extract YouTube transcripts and get concise AI-generated summaries
              for any video. Perfect for research, study, or content
              repurposing.
            </p>
            <div className="mt-auto w-full flex justify-center">
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Go to Transcript Tool
              </Link>
            </div>
          </div>
          {/* Video Outliner */}
          <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full items-center">
            <Zap className="w-10 h-10 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Video Outliner</h2>
            <p className="text-gray-600 mb-6 text-center flex-1">
              Turn long videos into structured outlines for easier review,
              study, or content creation. Great for students and creators.
            </p>
            <div className="mt-auto w-full flex justify-center">
              <Link
                href="/video-outliner"
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Go to Outliner
              </Link>
            </div>
          </div>
          {/* Ideas Brainstormer */}
          <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full items-center">
            <Users className="w-10 h-10 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ideas Brainstormer</h2>
            <p className="text-gray-600 mb-6 text-center flex-1">
              Generate fresh video ideas and creative prompts tailored to your
              channel or topic. Never run out of inspiration!
            </p>
            <div className="mt-auto w-full flex justify-center">
              <Link
                href="/ideas-brainstormer"
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Go to Brainstormer
              </Link>
            </div>
          </div>
        </div>
        {/* Coming soon message */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          More features coming soon!✨
        </div>
      </div>
    </div>
  );
}
