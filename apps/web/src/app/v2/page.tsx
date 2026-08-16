"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { connect, sendCommand } from "@/lib/connection";
import { getConnection } from "@/lib/storage";
import { useOfficeStore } from "@/store/office-store";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardContent from "@/components/dashboard/DashboardContent";

export type NavSection = "overview" | "office" | "hr-room" | "agents" | "tasks" | "pipelines" | "memory" | "git" | "knowledge" | "activity" | "notifications" | "settings";

export default function V2Page() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<NavSection>("overview");
  const [connected, setConnected] = useState(false);
  const storeConnected = useOfficeStore((s) => s.connected);

  // Connect to gateway on mount (same logic as office page, simplified)
  useEffect(() => {
    const conn = getConnection();
    if (!conn || !conn.sessionToken) {
      router.push("/pair");
      return;
    }

    const detectAndConnect = async () => {
      useOfficeStore.getState().hydrate();

      if (conn.mode === "ably") {
        connect(conn);
        return;
      }

      // WS mode: detect gateway port
      const isDev = window.location.port === "3000" || window.location.port === "3002";
      const ports = isDev ? [9099, 9090, 9091] : [9090, 9091, 9099];

      // Try same-origin first (production bundled mode)
      if (!isDev) {
        try {
          const res = await fetch(`${window.location.origin}/connect`, { signal: AbortSignal.timeout(500) });
          if (res.ok) {
            const data = await res.json();
            const freshConn = { ...conn, wsUrl: window.location.origin.replace(/^http/, "ws"), sessionToken: data.sessionToken };
            connect(freshConn);
            return;
          }
        } catch { /* fall through to port scan */ }
      }

      // Port scan
      for (const port of ports) {
        try {
          const base = `http://localhost:${port}`;
          const res = await fetch(`${base}/connect`, { signal: AbortSignal.timeout(400) });
          if (res.ok) {
            const data = await res.json();
            const wsUrl = `ws://localhost:${port}`;
            connect({ ...conn, wsUrl, sessionToken: data.sessionToken });
            return;
          }
        } catch { /* try next */ }
      }

      // Fallback: use stored URL
      if (conn.wsUrl) connect(conn);
    };

    detectAndConnect();
  }, [router]);

  // Fetch initial data once connected
  useEffect(() => {
    if (storeConnected && !connected) {
      setConnected(true);
      sendCommand({ type: "PING" });
      sendCommand({ type: "GET_CONFIG" });
      sendCommand({ type: "GET_METRICS" });
      sendCommand({ type: "LIST_PIPELINES" });
      sendCommand({ type: "LIST_SKILLS" });
    }
  }, [storeConnected, connected]);

  return (
    <div className="v2-dashboard">
      <DashboardSidebar activeNav={activeNav} onNavigate={setActiveNav} />
      <DashboardTopBar />
      <DashboardContent activeNav={activeNav} />
    </div>
  );
}
