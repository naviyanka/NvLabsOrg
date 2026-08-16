"use client";

export default function DashboardTopBar() {
  return (
    <header className="v2-topbar">
      {/* Search */}
      <button
        style={{
          flex: 1, maxWidth: 400,
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--v2-card-border)",
          borderRadius: 8, cursor: "pointer",
          color: "var(--v2-text-muted)", fontSize: 13,
        }}
      >
        <span style={{ fontSize: 14 }}>🔍</span>
        <span style={{ flex: 1, textAlign: "left" }}>Search agents, tasks, pipelines...</span>
        <kbd style={{
          fontSize: 10, padding: "2px 6px",
          background: "rgba(255,255,255,0.06)", borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.1)",
          color: "var(--v2-text-dim)",
        }}>Ctrl K</kbd>
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Dashboard / Office toggle */}
      <div style={{
        display: "flex", borderRadius: 8, overflow: "hidden",
        border: "1px solid var(--v2-card-border)",
      }}>
        <button style={{
          padding: "6px 14px", fontSize: 12, fontWeight: 500,
          background: "var(--v2-card)", color: "var(--v2-text)",
          border: "none", cursor: "pointer",
        }}>Dashboard</button>
        <button style={{
          padding: "6px 14px", fontSize: 12, fontWeight: 500,
          background: "var(--v2-accent)", color: "#fff",
          border: "none", cursor: "pointer",
        }}>Office</button>
      </div>

      {/* Notification bell */}
      <button style={{
        width: 36, height: 36, borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "transparent", border: "1px solid var(--v2-card-border)",
        cursor: "pointer", fontSize: 16, position: "relative",
      }}>
        🔔
        <span style={{
          position: "absolute", top: -2, right: -2,
          width: 16, height: 16, borderRadius: "50%",
          background: "var(--v2-red)", fontSize: 9, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
        }}>3</span>
      </button>

      {/* User avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #a855f7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 600, color: "#fff",
        }}>NY</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--v2-text)" }}>Navi Yanka</div>
          <div style={{ fontSize: 10, color: "var(--v2-text-muted)" }}>Operator</div>
        </div>
      </div>
    </header>
  );
}
