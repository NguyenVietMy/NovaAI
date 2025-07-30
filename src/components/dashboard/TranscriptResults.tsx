"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { FileText, Download, Copy, Send, HelpCircle, Play } from "lucide-react";
import YouTubeVideoPlayer from "./YouTubeVideoPlayer";

interface TranscriptData {
  url: string;
  title: string;
  duration: string;
  transcriptPlain: string;
  transcriptTimed: string;
  transcriptVtt: string;
  transcriptBlocks: any[];
  summary: string;
  processedAt: string;
  thumbnailUrl?: string;
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

interface TranscriptResultsProps {
  transcriptData: TranscriptData;
  chatMessages: ChatMessage[];
  chatInput: string;
  showAskPopup: boolean;
  copyStatus: string;
  activeTab: string;
  onChatInputChange: (input: string) => void;
  onSendChat: (e?: React.FormEvent) => void;
  onAskOption: (option: string) => void;
  onShowAskPopupChange: (show: boolean) => void;
  onActiveTabChange: (tab: string) => void;
  onCopy: (type: "withTimestamp" | "plain") => void;
  onDownloadTranscript: (
    format:
      | "txt"
      | "srt"
      | "json"
      | "vtt"
      | "vtt-clean"
      | "vtt-advanced"
      | "csv"
      | "md",
    txtVariant?: "withTimestamp" | "plain"
  ) => void;
  onClearChat: () => void;
}

export default function TranscriptResults({
  transcriptData,
  chatMessages,
  chatInput,
  showAskPopup,
  copyStatus,
  activeTab,
  onChatInputChange,
  onSendChat,
  onAskOption,
  onShowAskPopupChange,
  onActiveTabChange,
  onCopy,
  onDownloadTranscript,
  onClearChat,
}: TranscriptResultsProps) {
  return (
    <Card className="relative flex flex-col h-[1400px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transcript & Downloads
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <Tabs
          className="relative flex-1 flex flex-col min-h-0 w-full"
          value={activeTab}
          onValueChange={onActiveTabChange}
        >
          <TabsList className="grid w-full grid-cols-3 z-10">
            <TabsTrigger value="video">Video Player</TabsTrigger>
            <TabsTrigger value="plain">Full Transcript</TabsTrigger>
            <TabsTrigger value="summary">AI Chat</TabsTrigger>
          </TabsList>
          {/* Copy/Download Buttons */}
          <div className="mt-2 mb-4 flex items-center z-10">
            {activeTab === "plain" ? (
              <>
                {/* Move Copy button to the far left */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex gap-2">
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => onCopy("withTimestamp")}>
                      Copy with timestamp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCopy("plain")}>
                      Copy without timestamp
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Download buttons follow */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      .TXT
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() =>
                        onDownloadTranscript("txt", "withTimestamp")
                      }
                    >
                      With Timestamps
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDownloadTranscript("txt", "plain")}
                    >
                      Without Timestamps
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadTranscript("srt")}
                >
                  {" "}
                  <Download className="mr-2 h-4 w-4" /> .SRT{" "}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadTranscript("json")}
                >
                  {" "}
                  <Download className="mr-2 h-4 w-4" /> .JSON{" "}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      .VTT
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => onDownloadTranscript("vtt-clean")}
                    >
                      Cleaned VTT
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDownloadTranscript("vtt-advanced")}
                    >
                      Advanced VTT
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadTranscript("csv")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  .CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadTranscript("md")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  .MD
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Download summary as txt
                    const content = transcriptData.summary;
                    const filename = `summary-${Date.now()}.txt`;
                    const blob = new Blob([content], {
                      type: "text/plain",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  .TXT
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex gap-2 ml-2"
                  onClick={async () => {
                    await navigator.clipboard.writeText(transcriptData.summary);
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </>
            )}
            {copyStatus && (
              <span className="ml-3 text-xs text-muted-foreground animate-fade-in">
                {copyStatus}
              </span>
            )}
          </div>
          <TabsContent value="video" className="flex-1 min-h-0 relative z-20">
            <div className="h-full p-4" style={{ pointerEvents: "auto" }}>
              <YouTubeVideoPlayer
                videoUrl={transcriptData.url}
                thumbnailUrl={transcriptData.thumbnailUrl}
                transcriptData={{
                  transcriptTimed: transcriptData.transcriptTimed,
                  transcriptBlocks: transcriptData.transcriptBlocks,
                  title: transcriptData.title,
                  url: transcriptData.url,
                }}
                showTranscript={true}
                className="w-full"
              />
            </div>
          </TabsContent>
          <TabsContent
            value="plain"
            className="absolute inset-0 flex flex-col min-h-0 pt-[4.5rem]"
          >
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-4">
              {transcriptData.transcriptBlocks.map((block, idx) => (
                <div
                  key={idx}
                  className="bg-muted/50 rounded-lg p-4 border border-muted-foreground/10 shadow-sm"
                >
                  <div className="text-xs text-muted-foreground mb-2 font-mono">
                    {block.start} - {block.end}
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {block.text}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent
            value="summary"
            className="absolute inset-0 flex flex-col min-h-0 pt-[4.5rem]"
          >
            <div className="flex flex-col flex-1 min-h-0 bg-muted/30 rounded-lg p-2 border border-muted-foreground/10 shadow-sm mt-4">
              <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2 min-h-0">
                {chatMessages.length === 0 && transcriptData?.title && (
                  <div className="mb-2 px-4 py-2 rounded-lg bg-white/80 text-primary font-medium text-sm shadow border border-primary/10 w-1/3 mx-auto text-center">
                    <span role="img" aria-label="video">
                      🎬
                    </span>{" "}
                    Ready to dive into <b>{transcriptData.title}</b>? Use{" "}
                    <b>Ask</b> to learn key insights and <b>Create</b> to
                    brainstorm CRAZY Ideas relevant to this video, or you can
                    chat freely to explore anything!
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 max-w-[80%] text-sm whitespace-pre-line shadow-sm
                        ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border border-muted-foreground/10"
                        }
                      `}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ask Button - Above Input */}
              <div className="flex justify-end relative w-[60%] mx-auto gap-2">
                {chatMessages.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearChat}
                    className="rounded-full bg-red-100 hover:bg-red-200 px-3 py-1.5 transition-colors border border-red-200 flex items-center gap-1.5"
                    title="Clear chat history"
                  >
                    <span className="text-xs font-medium text-red-600">
                      Clear Chat
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onShowAskPopupChange(!showAskPopup)}
                  className="ask-button rounded-full bg-purple-100 hover:bg-purple-200 px-3 py-1.5 transition-colors border border-purple-200 flex items-center gap-1.5"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-xs font-medium text-purple-600">
                    Ask
                  </span>
                </button>

                {/* Ask Popup */}
                {showAskPopup && (
                  <div className="ask-popup absolute bottom-full right-0 mb-2 bg-white rounded-lg border border-purple-200 shadow-lg p-3 min-w-[200px] z-50">
                    <div className="text-sm font-medium text-purple-600 mb-2">
                      Overview
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={() => onAskOption("summarize")}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 rounded-md transition-colors"
                      >
                        Summarize main points
                      </button>
                      <button
                        onClick={() => onAskOption("takeaways")}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 rounded-md transition-colors"
                      >
                        Key takeaways
                      </button>
                      <button
                        onClick={() => onAskOption("quotes")}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 rounded-md transition-colors"
                      >
                        Important quotes
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Input box */}
              <form
                onSubmit={onSendChat}
                className="flex items-center gap-2 px-2 py-2 bg-background rounded-xl shadow border mt-2 relative w-[60%] mx-auto"
              >
                <input
                  type="text"
                  className="flex-1 px-5 py-2 rounded-full bg-background border-none focus:outline-none text-base placeholder:text-muted-foreground"
                  placeholder="Ask anything about this video..."
                  value={chatInput}
                  onChange={(e) => onChatInputChange(e.target.value)}
                  autoComplete="off"
                  disabled={false}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="rounded-full bg-primary/10 hover:bg-primary/20 p-2 transition-colors"
                >
                  <Send className="h-6 w-6 text-primary" />
                </button>
              </form>
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1 justify-center">
                <span role="img" aria-label="lightbulb">
                  💡
                </span>
                You can reference specific timestamps like this:{" "}
                <span className="bg-primary/10 text-primary px-1 rounded">
                  @01:23
                </span>{" "}
                or{" "}
                <span className="bg-primary/10 text-primary px-1 rounded">
                  @01:23:45
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
