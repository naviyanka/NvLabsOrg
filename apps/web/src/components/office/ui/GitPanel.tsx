"use client";

import { useState, useEffect, useCallback } from "react";
import { sendCommand } from "@/lib/connection";
import { useOfficeStore } from "@/store/office-store";
import TermButton from "./primitives/TermButton";
import { GitPanelSkeleton } from "./Skeleton";

interface GitPanelProps {
  rootPath: string;
}

export default function GitPanel({ rootPath }: GitPanelProps) {
  const gitStatus = useOfficeStore((s) => s.gitStatus);
  const gitLog = useOfficeStore((s) => s.gitLog);
  const fileDiff = useOfficeStore((s) => s.fileDiff);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    if (!rootPath) return;
    setLoading(true);
    sendCommand({ type: "GET_GIT_STATUS", path: rootPath });
    sendCommand({ type: "GET_GIT_LOG", path: rootPath, count: 15 });
  }, [rootPath]);

  useEffect(() => {
    if (rootPath) fetchAll();
  }, [rootPath, fetchAll]);

  useEffect(() => {
    if (gitStatus || gitLog) setLoading(false);
  }, [gitStatus, gitLog]);

  const handleFileClick = (file: string) => {
    if (selectedFile === file) {
      // Toggle off
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    sendCommand({ type: "GET_FILE_DIFF", path: rootPath, file });
  };

  return (
    <div className="flex flex-col h-full font-mono text-[11px] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[rgba(255,255,255,0.06)]">
        <TermButton variant="dim" size="sm" onClick={fetchAll} disabled={loading}>
          {loading ? "..." : "Refresh"}
        </TermButton>
        <span className="text-[9px] text-muted-foreground truncate flex-1">{rootPath}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4" data-scrollbar>
        {/* Branch & Status */}
        {gitStatus && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">Branch</div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-foreground font-medium">{gitStatus.branch}</span>
              {(gitStatus.ahead ?? 0) > 0 && <span className="text-[9px] text-[#22c55e]">↑{gitStatus.ahead}</span>}
              {(gitStatus.behind ?? 0) > 0 && <span className="text-[9px] text-[#f59e0b]">↓{gitStatus.behind}</span>}
            </div>

            {gitStatus.changes.length > 0 ? (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">
                  Changes ({gitStatus.changes.length}) <span className="opacity-50 normal-case">— click to diff</span>
                </div>
                <div className="space-y-0.5">
                  {gitStatus.changes.map((c, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 py-0.5 px-1 rounded cursor-pointer transition-colors ${selectedFile === c.file ? "bg-accent/10" : "hover:bg-white/[0.04]"}`}
                      onClick={() => handleFileClick(c.file)}
                    >
                      <span className={`w-4 text-center text-[9px] font-bold ${statusColor(c.status)}`}>{c.status}</span>
                      <span className="text-muted-foreground truncate">{c.file}</span>
                      {selectedFile === c.file && <span className="ml-auto text-[9px] text-accent">▾</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground opacity-50">Working tree clean</div>
            )}

            {/* Inline Diff Viewer */}
            {selectedFile && fileDiff && fileDiff.file === selectedFile && (
              <div className="mt-2 border border-[rgba(255,255,255,0.06)] rounded overflow-hidden">
                <div className="flex items-center justify-between px-2 py-1 bg-black/20 border-b border-[rgba(255,255,255,0.04)]">
                  <span className="text-[9px] text-muted-foreground truncate">{selectedFile}</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                  >✕</button>
                </div>
                <DiffView diff={fileDiff.diff} />
              </div>
            )}
            {selectedFile && (!fileDiff || fileDiff.file !== selectedFile) && (
              <div className="mt-2 text-[10px] text-muted-foreground opacity-50 pl-2">Loading diff...</div>
            )}
          </div>
        )}

        {/* Commit Log */}
        {gitLog && gitLog.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
              Recent Commits
            </div>
            <div className="space-y-1">
              {gitLog.map((commit, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <span className="text-[9px] text-accent shrink-0 font-mono">{commit.hash}</span>
                  <span className="text-muted-foreground truncate flex-1">{commit.message}</span>
                  <span className="text-[9px] text-muted-foreground opacity-50 shrink-0">{shortDate(commit.date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!gitStatus && !loading && (
          <div className="text-muted-foreground opacity-50 text-center py-6">Not a git repository</div>
        )}
        {!gitStatus && loading && (
          <GitPanelSkeleton />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Diff Viewer component
// ---------------------------------------------------------------------------

function DiffView({ diff }: { diff: string }) {
  const lines = diff.split("\n");

  return (
    <div className="overflow-x-auto max-h-[300px] overflow-y-auto text-[10px] leading-[1.6]" data-scrollbar>
      {lines.map((line, i) => {
        let bg = "transparent";
        let color = "var(--term-text, #94a3b8)";

        if (line.startsWith("+") && !line.startsWith("+++")) {
          bg = "rgba(34,197,94,0.08)";
          color = "#4ade80";
        } else if (line.startsWith("-") && !line.startsWith("---")) {
          bg = "rgba(239,68,68,0.08)";
          color = "#f87171";
        } else if (line.startsWith("@@")) {
          bg = "rgba(59,130,246,0.06)";
          color = "#60a5fa";
        } else if (line.startsWith("diff ") || line.startsWith("index ") || line.startsWith("---") || line.startsWith("+++")) {
          color = "rgba(148,163,184,0.5)";
        }

        return (
          <div
            key={i}
            style={{ backgroundColor: bg, color, paddingLeft: 8, paddingRight: 8, minHeight: 16 }}
            className="whitespace-pre font-mono"
          >
            {line || " "}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(status: string): string {
  if (status.includes("M")) return "text-[#f59e0b]";
  if (status.includes("A") || status.includes("?")) return "text-[#22c55e]";
  if (status.includes("D")) return "text-[#ef4444]";
  return "text-muted-foreground";
}

function shortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch { return dateStr.slice(0, 10); }
}
