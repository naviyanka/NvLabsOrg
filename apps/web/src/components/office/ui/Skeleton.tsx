"use client";

/**
 * Reusable skeleton/shimmer components for loading states.
 */

/** A single pulsing bar — configurable width/height */
export function SkeletonBar({ width, height = 12, className = "" }: { width?: string | number; height?: number; className?: string }) {
  return (
    <div
      className={`skeleton-shimmer rounded ${className}`}
      style={{
        width: width ?? "100%",
        height,
        backgroundColor: "rgba(255,255,255,0.04)",
      }}
    />
  );
}

/** A circular skeleton (for avatars) */
export function SkeletonCircle({ size = 32 }: { size?: number }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "rgba(255,255,255,0.04)",
        flexShrink: 0,
      }}
    />
  );
}

/** Dashboard skeleton — mimics the card layout */
export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      {/* Header */}
      <SkeletonBar width="40%" height={16} />
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-[rgba(255,255,255,0.06)] rounded-lg p-3 space-y-2">
            <SkeletonBar width="60%" height={10} />
            <SkeletonBar width="40%" height={20} />
          </div>
        ))}
      </div>
      {/* Agent list */}
      <div className="space-y-2">
        <SkeletonBar width="30%" height={10} />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 py-2">
            <SkeletonCircle size={28} />
            <div className="flex-1 space-y-1">
              <SkeletonBar width="50%" height={10} />
              <SkeletonBar width="30%" height={8} />
            </div>
          </div>
        ))}
      </div>
      {/* Quick actions */}
      <div className="flex gap-2">
        <SkeletonBar width={80} height={28} className="rounded-md" />
        <SkeletonBar width={80} height={28} className="rounded-md" />
        <SkeletonBar width={80} height={28} className="rounded-md" />
      </div>
    </div>
  );
}

/** File Explorer skeleton — tree + content pane */
export function FileExplorerSkeleton() {
  return (
    <div className="flex h-full animate-pulse">
      {/* Tree panel */}
      <div className="w-[200px] border-r border-[rgba(255,255,255,0.06)] p-3 space-y-2">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="flex items-center gap-2" style={{ paddingLeft: i % 3 === 0 ? 12 : 0 }}>
            <SkeletonBar width={12} height={12} className="rounded-sm" />
            <SkeletonBar width={`${50 + Math.random() * 40}%`} height={10} />
          </div>
        ))}
      </div>
      {/* Content panel */}
      <div className="flex-1 p-4 space-y-2">
        <SkeletonBar width="60%" height={10} />
        <div className="mt-3 space-y-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <SkeletonBar key={i} width={`${40 + Math.random() * 50}%`} height={9} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Git Panel skeleton */
export function GitPanelSkeleton() {
  return (
    <div className="p-3 space-y-4 animate-pulse">
      {/* Branch */}
      <div className="space-y-2">
        <SkeletonBar width="20%" height={9} />
        <SkeletonBar width="35%" height={14} />
      </div>
      {/* Changes */}
      <div className="space-y-2">
        <SkeletonBar width="30%" height={9} />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonBar width={16} height={10} className="rounded-sm" />
            <SkeletonBar width={`${40 + Math.random() * 40}%`} height={10} />
          </div>
        ))}
      </div>
      {/* Commits */}
      <div className="space-y-2">
        <SkeletonBar width="30%" height={9} />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonBar width={48} height={9} />
            <SkeletonBar width={`${30 + Math.random() * 50}%`} height={9} />
            <SkeletonBar width={40} height={8} className="ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
