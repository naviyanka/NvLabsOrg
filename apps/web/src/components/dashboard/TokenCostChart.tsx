"use client";

export default function TokenCostChart() {
  // SVG area chart data (mock — will be connected to backend in Phase 8)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const tokenData = [20, 35, 50, 45, 80, 120, 150, 130, 100, 90, 110, 140, 180, 200, 170, 150, 130, 160, 190, 175, 140, 100, 80, 60];
  const costData = tokenData.map(t => t * 0.3);
  const maxVal = Math.max(...tokenData) * 1.1;

  const chartWidth = 600;
  const chartHeight = 120;
  const toPath = (data: number[]) => {
    const points = data.map((v, i) => ({
      x: (i / (data.length - 1)) * chartWidth,
      y: chartHeight - (v / maxVal) * chartHeight,
    }));
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  };
  const toArea = (data: number[]) => {
    const path = toPath(data);
    return `${path} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
  };

  return (
    <div className="v2-card">
      <div className="v2-section-header">
        <div className="v2-section-title">Token & Cost Overview</div>
        <select style={{
          background: "var(--v2-card)", border: "1px solid var(--v2-card-border)",
          borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "var(--v2-text-muted)", outline: "none",
        }}>
          <option>24 Hours</option>
          <option>7 Days</option>
          <option>30 Days</option>
        </select>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 12, height: 3, borderRadius: 2, background: "var(--v2-accent)" }} />
          <span style={{ color: "var(--v2-text-muted)" }}>Tokens</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 12, height: 3, borderRadius: 2, background: "var(--v2-green)" }} />
          <span style={{ color: "var(--v2-text-muted)" }}>Cost (USD)</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: "relative", height: chartHeight + 20, overflow: "hidden" }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: "100%", height: chartHeight }} preserveAspectRatio="none">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(y => (
            <line key={y} x1={0} y1={chartHeight * y} x2={chartWidth} y2={chartHeight * y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
          ))}
          {/* Token area */}
          <path d={toArea(tokenData)} fill="url(#tokenGrad)" opacity={0.3} />
          <path d={toPath(tokenData)} fill="none" stroke="var(--v2-accent)" strokeWidth={2} />
          {/* Cost area */}
          <path d={toArea(costData)} fill="url(#costGrad)" opacity={0.2} />
          <path d={toPath(costData)} fill="none" stroke="var(--v2-green)" strokeWidth={2} />
          {/* Gradients */}
          <defs>
            <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--v2-accent)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--v2-green)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>

        {/* X-axis labels */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4 }}>
          {["00:00", "06:00", "12:00", "18:00", "24:00"].map(t => (
            <span key={t} style={{ fontSize: 9, color: "var(--v2-text-dim)" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 32, marginTop: 16, borderTop: "1px solid var(--v2-card-border)", paddingTop: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--v2-text-muted)", marginBottom: 2 }}>Total Tokens</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>1.24M</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--v2-text-muted)", marginBottom: 2 }}>Total Cost</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>$42.68</div>
        </div>
      </div>
    </div>
  );
}
