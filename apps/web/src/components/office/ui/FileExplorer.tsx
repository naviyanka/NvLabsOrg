"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { sendCommand } from "@/lib/connection";
import { useOfficeStore } from "@/store/office-store";
import TermButton from "./primitives/TermButton";
import { FileExplorerSkeleton } from "./Skeleton";

interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
}

interface FileExplorerProps {
  rootPath: string;
}

export default function FileExplorer({ rootPath }: FileExplorerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lazy directory state: expanded dirs + per-dir children
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [dirChildren, setDirChildren] = useState<Map<string, FileEntry[]>>(new Map());
  const [loadingDirs, setLoadingDirs] = useState<Set<string>>(new Set());

  // Pending dir request tracking
  const pendingDirRef = useRef<string | null>(null);

  const fetchFiles = useCallback(() => {
    if (!rootPath) return;
    setLoading(true);
    pendingDirRef.current = rootPath;
    sendCommand({ type: "LIST_FILES", path: rootPath, depth: 1 });
  }, [rootPath]);

  // Initial fetch
  useEffect(() => {
    if (!rootPath) return;
    fetchFiles();
  }, [rootPath, fetchFiles]);

  // Listen for FILE_LIST events from the store
  const storeEntries = useOfficeStore((s) => s.fileExplorerEntries);
  const storeFileContent = useOfficeStore((s) => s.fileViewerContent);

  useEffect(() => {
    if (!storeEntries) return;

    const pending = pendingDirRef.current;
    if (pending) {
      // Store these as children of the pending dir
      setDirChildren(prev => {
        const next = new Map(prev);
        next.set(pending, storeEntries);
        return next;
      });
      setLoadingDirs(prev => {
        const next = new Set(prev);
        next.delete(pending);
        return next;
      });
      pendingDirRef.current = null;
      setLoading(false);
    }
  }, [storeEntries]);

  useEffect(() => {
    if (storeFileContent !== undefined) setFileContent(storeFileContent);
  }, [storeFileContent]);

  const handleToggleDir = useCallback((dirPath: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(dirPath)) {
        next.delete(dirPath);
      } else {
        next.add(dirPath);
        // Fetch if not yet loaded
        if (!dirChildren.has(dirPath)) {
          setLoadingDirs(p => new Set(p).add(dirPath));
          pendingDirRef.current = dirPath;
          sendCommand({ type: "LIST_FILES", path: dirPath, depth: 1 });
        }
      }
      return next;
    });
  }, [dirChildren]);

  const handleFileClick = useCallback((entry: FileEntry) => {
    if (entry.isDir) {
      handleToggleDir(entry.path);
      return;
    }
    setSelectedFile(entry.path);
    setFileContent(null);
    sendCommand({ type: "READ_FILE", path: entry.path });
  }, [handleToggleDir]);

  // Get root entries
  const rootEntries = dirChildren.get(rootPath) ?? [];

  return (
    <div className="flex flex-col h-full font-mono text-[11px]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[rgba(255,255,255,0.06)]">
        <TermButton variant="dim" size="sm" onClick={fetchFiles} disabled={loading}>
          {loading ? "..." : "Refresh"}
        </TermButton>
        <span className="text-[9px] text-muted-foreground truncate flex-1">{rootPath}</span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* File tree */}
        <div className="w-[200px] border-r border-[rgba(255,255,255,0.06)] overflow-y-auto p-2" data-scrollbar>
          {rootEntries.length === 0 && !loading && (
            <div className="text-muted-foreground opacity-50 text-center py-4">No files</div>
          )}
          {loading && rootEntries.length === 0 && (
            <FileExplorerSkeleton />
          )}
          {sortEntries(rootEntries).map((entry) => (
            <LazyTreeNode
              key={entry.path}
              entry={entry}
              depth={0}
              onSelect={handleFileClick}
              selectedPath={selectedFile}
              expandedDirs={expandedDirs}
              dirChildren={dirChildren}
              loadingDirs={loadingDirs}
            />
          ))}
        </div>

        {/* File content */}
        <div className="flex-1 overflow-auto p-3" data-scrollbar>
          {!selectedFile && (
            <div className="text-muted-foreground opacity-50 text-center py-8">Select a file to view</div>
          )}
          {selectedFile && fileContent === null && (
            <div className="text-muted-foreground opacity-50">Loading...</div>
          )}
          {selectedFile && fileContent !== null && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-2 truncate">{selectedFile}</div>
              <pre className="whitespace-pre-wrap text-[10px] text-foreground leading-relaxed bg-black/20 rounded p-2 border border-[rgba(255,255,255,0.04)]" style={{ wordBreak: "break-all" }}>
                {fileContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lazy Tree Node — recursively renders with on-demand expansion
// ---------------------------------------------------------------------------

function LazyTreeNode({
  entry,
  depth,
  onSelect,
  selectedPath,
  expandedDirs,
  dirChildren,
  loadingDirs,
}: {
  entry: FileEntry;
  depth: number;
  onSelect: (e: FileEntry) => void;
  selectedPath: string | null;
  expandedDirs: Set<string>;
  dirChildren: Map<string, FileEntry[]>;
  loadingDirs: Set<string>;
}) {
  const isExpanded = expandedDirs.has(entry.path);
  const isSelected = entry.path === selectedPath;
  const isLoading = loadingDirs.has(entry.path);
  const children = dirChildren.get(entry.path);

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer hover:bg-white/[0.04] ${isSelected ? "bg-accent/10 text-accent" : "text-muted-foreground"}`}
        style={{ paddingLeft: depth * 12 + 4 }}
        onClick={() => onSelect(entry)}
      >
        <span className="text-[10px] w-3 shrink-0">
          {entry.isDir ? (isLoading ? "⏳" : isExpanded ? "▾" : "▸") : " "}
        </span>
        <span className="text-[10px] shrink-0">{entry.isDir ? "📁" : "📄"}</span>
        <span className="truncate">{entry.name}</span>
        {!entry.isDir && entry.size !== undefined && (
          <span className="ml-auto text-[9px] opacity-40 shrink-0">{formatSize(entry.size)}</span>
        )}
      </div>
      {entry.isDir && isExpanded && children && (
        sortEntries(children).map((child) => (
          <LazyTreeNode
            key={child.path}
            entry={child}
            depth={depth + 1}
            onSelect={onSelect}
            selectedPath={selectedPath}
            expandedDirs={expandedDirs}
            dirChildren={dirChildren}
            loadingDirs={loadingDirs}
          />
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sortEntries(entries: FileEntry[]): FileEntry[] {
  const dirs = entries.filter(e => e.isDir).sort((a, b) => a.name.localeCompare(b.name));
  const files = entries.filter(e => !e.isDir).sort((a, b) => a.name.localeCompare(b.name));
  return [...dirs, ...files];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}
