import Link from "next/link";
import { ArrowUpRight, Check, Download, FileText, Zap } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-orange-50 opacity-70" />

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                <FileText className="w-4 h-4" />
                <span>YouTube Transcript Downloader</span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
              Download{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                YouTube
              </span>{" "}
              Transcripts and Summarize with AI
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Extract transcripts from YouTube videos instantly. Support for
              TXT, SRT, and JSON formats with unlimited summarizations for Pro
              users.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
              >
                Start Downloading Free
                <Download className="ml-2 w-5 h-5" />
              </Link>

              <Link
                href="#pricing"
                className="inline-flex items-center px-8 py-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg font-medium"
              >
                View Pricing
              </Link>
            </div>

            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>5 free summaries a day</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Multiple format support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Lightning fast processing</span>
              </div>
            </div>

            {/* Demo Preview */}
            <div className="mt-20 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="ml-4 text-sm text-gray-600">
                      YouTube Transcript Downloader
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-600 text-sm">
                        https://youtube.com/watch?v=example1
                      </span>
                      <div className="ml-auto text-green-600 text-sm font-medium">
                        ✓ Ready
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-600 text-sm">
                        https://youtube.com/watch?v=example2
                      </span>
                      <div className="ml-auto text-blue-600 text-sm font-medium">
                        Processing...
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-600 text-sm">
                        https://youtube.com/watch?v=example3
                      </span>
                      <div className="ml-auto text-gray-400 text-sm">
                        Queued
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-center">
                    <button className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download All (TXT)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
