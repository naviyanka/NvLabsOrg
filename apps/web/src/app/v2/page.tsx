"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardContent from "@/components/dashboard/DashboardContent";

export type NavSection = "overview" | "office" | "hr-room" | "agents" | "tasks" | "pipelines" | "memory" | "git" | "knowledge" | "activity" | "notifications" | "settings";

export default function V2Page() {
  const [activeNav, setActiveNav] = useState<NavSection>("overview");

  return (
    <div className="v2-dashboard">
      <DashboardSidebar activeNav={activeNav} onNavigate={setActiveNav} />
      <DashboardTopBar />
      <DashboardContent activeNav={activeNav} />
    </div>
  );
}
