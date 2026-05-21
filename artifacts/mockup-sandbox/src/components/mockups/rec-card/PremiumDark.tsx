export function PremiumDark() {
  const card = {
    symbol: "RELIANCE",
    stockName: "Reliance Industries Ltd",
    signalType: "BUY" as "BUY" | "SELL",
    status: "active" as string,
    buyPrice: "2847.50",
    targetPrice: "2960.00",
    stopLoss: "2790.00",
    pnlPercent: null as number | null,
    riskLevel: "medium" as string,
    date: "21 May 2025",
  };

  const isBuy = card.signalType === "BUY";
  const signalColor = isBuy ? "#10B981" : "#EF4444";
  const signalGradient = isBuy
    ? "linear-gradient(135deg, #10B981, #059669)"
    : "linear-gradient(135deg, #EF4444, #DC2626)";

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: "#F59E0B", bg: "#F59E0B15" },
    target_hit: { label: "Target Hit", color: "#10B981", bg: "#10B98115" },
    stop_loss_hit: { label: "Stop Loss", color: "#EF4444", bg: "#EF444415" },
    closed: { label: "Closed", color: "#6B7280", bg: "#6B728015" },
  };
  const statusInfo = statusMap[card.status] ?? statusMap.active;

  const riskMap: Record<string, { color: string; label: string }> = {
    low: { color: "#10B981", label: "Low Risk" },
    medium: { color: "#F59E0B", label: "Med Risk" },
    high: { color: "#EF4444", label: "High Risk" },
  };
  const risk = riskMap[card.riskLevel] ?? riskMap.medium;

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0B1120 0%, #0F1729 100%)" }}>
      <div style={{ width: 360 }}>

        {/* Card */}
        <div
          style={{
            background: "linear-gradient(180deg, #141E33 0%, #111827 100%)",
            borderRadius: 20,
            border: `1px solid ${signalColor}30`,
            boxShadow: `0 8px 32px ${signalColor}15, 0 2px 8px rgba(0,0,0,0.5)`,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Top accent bar */}
          <div style={{ height: 3, background: signalGradient }} />

          {/* Header */}
          <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1E2D47" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Signal pill */}
              <div style={{
                background: signalGradient,
                borderRadius: 8,
                padding: "5px 12px",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d={isBuy ? "M5 1L9 9H1L5 1Z" : "M5 9L1 1H9L5 9Z"} fill="white"/>
                </svg>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 800, letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>
                  {card.signalType}
                </span>
              </div>
              {/* Intraday chip */}
              <div style={{
                background: "#818CF808",
                border: "1px solid #818CF830",
                borderRadius: 999,
                padding: "3px 8px",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="#818CF8">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                <span style={{ color: "#818CF8", fontSize: 10, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Intraday · 9:15 AM</span>
              </div>
            </div>
            {/* Status */}
            <div style={{
              background: statusInfo.bg,
              borderRadius: 8,
              padding: "4px 10px",
            }}>
              <span style={{ color: statusInfo.color, fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Stock Identity */}
          <div style={{ padding: "14px 18px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ color: "#F1F5F9", fontSize: 22, fontWeight: 800, fontFamily: "Inter, sans-serif", letterSpacing: -0.3 }}>
                  {card.symbol}
                </span>
                <span style={{
                  background: "#1E3A5F",
                  color: "#60A5FA",
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}>NSE</span>
              </div>
              <div style={{ color: "#64748B", fontSize: 12, fontFamily: "Inter, sans-serif", marginTop: 2 }}>
                {card.stockName}
              </div>
            </div>
            <div style={{
              background: risk.color + "15",
              border: `1px solid ${risk.color}30`,
              borderRadius: 8,
              padding: "5px 10px",
              textAlign: "center",
            }}>
              <div style={{ color: risk.color, fontSize: 10, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                {risk.label.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Price Grid */}
          <div style={{
            margin: "0 18px",
            background: "#0D1425",
            borderRadius: 12,
            border: "1px solid #1E2D47",
            display: "flex",
            overflow: "hidden",
          }}>
            {[
              { label: "Entry @ 9:15 AM", value: `₹${card.buyPrice}`, color: "#F1F5F9", icon: "🎯" },
              { label: "Target", value: `₹${card.targetPrice}`, color: "#10B981", icon: "↑" },
              { label: "Stop Loss", value: `₹${card.stopLoss}`, color: "#EF4444", icon: "↓" },
            ].map((item, i) => (
              <div key={i} style={{
                flex: 1,
                padding: "12px 0",
                textAlign: "center",
                borderRight: i < 2 ? "1px solid #1E2D47" : undefined,
                position: "relative",
              }}>
                <div style={{ color: "#475569", fontSize: 9.5, fontFamily: "Inter, sans-serif", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 }}>
                  {item.label}
                </div>
                <div style={{ color: item.color, fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* P&L row (shown when available) */}
          {card.pnlPercent !== null && (
            <div style={{ margin: "8px 18px 0", padding: "10px 14px", background: "#0D1425", borderRadius: 10, border: "1px solid #1E2D47", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#475569", fontSize: 11, fontFamily: "Inter, sans-serif" }}>P&amp;L</span>
              <span style={{ color: card.pnlPercent >= 0 ? "#10B981" : "#EF4444", fontSize: 15, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                {card.pnlPercent >= 0 ? "+" : ""}{card.pnlPercent}%
              </span>
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: "12px 18px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span style={{ color: "#475569", fontSize: 11, fontFamily: "Inter, sans-serif" }}>{card.date}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#475569", fontSize: 11, fontFamily: "Inter, sans-serif" }}>View details</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
            </div>
          </div>
        </div>

        {/* Label */}
        <div style={{ textAlign: "center", marginTop: 14, color: "#475569", fontSize: 12, fontFamily: "Inter, sans-serif" }}>
          Variant A — Premium Dark
        </div>
      </div>
    </div>
  );
}
