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
                <span>
                  NovaAI - Your All-in-One{" "}
                  <span className="gradient-red-text">YouTube</span> Assistant
                </span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
              NovaAI: Your All-in-One{" "}
              <span className="gradient-red-text">YouTube</span> Assistant
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Explore the endless possibilities of boosting your YouTube
              productivity. Summarize, organize, and supercharge your workflow
              with our suite of AI-powered tools.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/tools"
                className="inline-flex items-center px-8 py-4 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
              >
                Explore All Tools
                <Download className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center px-8 py-4 text-gray-400 bg-gray-200 rounded-lg text-lg font-medium cursor-not-allowed pointer-events-none"
              >
                View Pricing
                <br></br>
                (not currently supported)
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
          </div>
        </div>
      </div>
    </div>
  );
}
