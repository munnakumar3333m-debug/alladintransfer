export function StructuredPro() {
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

  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: "LIVE", color: "#10B981" },
    target_hit: { label: "TARGET HIT", color: "#10B981" },
    stop_loss_hit: { label: "STOPPED OUT", color: "#EF4444" },
    closed: { label: "CLOSED", color: "#6B7280" },
  };
  const statusInfo = statusMap[card.status] ?? statusMap.active;

  const riskColors: Record<string, string> = {
    low: "#10B981",
    medium: "#F59E0B",
    high: "#EF4444",
  };
  const riskColor = riskColors[card.riskLevel] ?? "#F59E0B";

  const upside = (
    ((parseFloat(card.targetPrice) - parseFloat(card.buyPrice)) /
      parseFloat(card.buyPrice)) * 100
  ).toFixed(1);
  const downside = (
    ((parseFloat(card.buyPrice) - parseFloat(card.stopLoss)) /
      parseFloat(card.buyPrice)) * 100
  ).toFixed(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#0A0F1E" }}>
      <div style={{ width: 360 }}>

        <div
          style={{
            background: "#0E1627",
            borderRadius: 16,
            border: "1px solid #1A2744",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {/* Status bar */}
          <div style={{
            background: isBuy ? "#10B98108" : "#EF444408",
            borderBottom: `1px solid ${signalColor}20`,
            padding: "9px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 7, height: 7, borderRadius: 999,
                background: signalColor,
                boxShadow: `0 0 6px ${signalColor}`,
              }} />
              <span style={{ color: signalColor, fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>
                {card.signalType} SIGNAL
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: 999, background: "#10B981", animation: "pulse 2s infinite" }} />
              <span style={{ color: statusInfo.color, fontSize: 10, fontWeight: 700, letterSpacing: 1.2 }}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Hero: Symbol + Name */}
          <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #1A2744" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: "#F8FAFC", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
                    {card.symbol}
                  </span>
                  <span style={{ color: "#334155", fontSize: 11, fontWeight: 500 }}>·</span>
                  <span style={{ color: "#94A3B8", fontSize: 11, fontWeight: 500 }}>NSE</span>
                </div>
                <div style={{ color: "#64748B", fontSize: 12 }}>{card.stockName}</div>
              </div>
              {/* Risk gauge */}
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#475569", fontSize: 9, letterSpacing: 1, marginBottom: 4 }}>RISK</div>
                <div style={{ display: "flex", gap: 3 }}>
                  {["low","medium","high"].map((r) => (
                    <div key={r} style={{
                      width: 18, height: 5, borderRadius: 2,
                      background: card.riskLevel === "low"
                        ? (r === "low" ? "#10B981" : "#1A2744")
                        : card.riskLevel === "medium"
                        ? (r !== "high" ? "#F59E0B" : "#1A2744")
                        : "#EF4444",
                      opacity: card.riskLevel === "low"
                        ? (r === "low" ? 1 : 0.25)
                        : card.riskLevel === "medium"
                        ? (r !== "high" ? 1 : 0.25)
                        : 1,
                    }}/>
                  ))}
                </div>
                <div style={{ color: riskColor, fontSize: 9, fontWeight: 700, letterSpacing: 1, marginTop: 3 }}>
                  {card.riskLevel.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Price table */}
          <div style={{ padding: "14px 16px" }}>
            {[
              { label: "Entry Price", sublabel: "Execute at 9:15 AM open", value: `₹${card.buyPrice}`, color: "#F1F5F9", accent: null },
              { label: "Target Price", sublabel: `+${upside}% upside`, value: `₹${card.targetPrice}`, color: "#10B981", accent: "#10B981" },
              { label: "Stop Loss", sublabel: `−${downside}% risk`, value: `₹${card.stopLoss}`, color: "#EF4444", accent: "#EF4444" },
            ].map((row, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                marginBottom: i < 2 ? 4 : 0,
                borderRadius: 10,
                background: i === 0 ? "#131F35" : row.accent ? row.accent + "08" : "#131F35",
                border: i === 0 ? "1px solid #1E3050" : row.accent ? `1px solid ${row.accent}20` : "1px solid #1E3050",
              }}>
                <div>
                  <div style={{ color: "#94A3B8", fontSize: 11, marginBottom: 2 }}>{row.label}</div>
                  <div style={{ color: "#475569", fontSize: 10 }}>{row.sublabel}</div>
                </div>
                <div style={{
                  color: row.color,
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: -0.3,
                }}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>

          {/* Execution banner */}
          <div style={{
            margin: "0 16px 14px",
            background: "#818CF808",
            border: "1px solid #818CF820",
            borderRadius: 10,
            padding: "9px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#818CF8">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <div>
              <span style={{ color: "#818CF8", fontSize: 11, fontWeight: 600 }}>Intraday · </span>
              <span style={{ color: "#64748B", fontSize: 11 }}>Open at 9:15 AM · Close before 3:15 PM</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            borderTop: "1px solid #1A2744",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ color: "#334155", fontSize: 11 }}>{card.date}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#475569", fontSize: 11 }}>View analysis</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 14, color: "#475569", fontSize: 12, fontFamily: "Inter, sans-serif" }}>
          Variant B — Structured Pro
        </div>
      </div>
    </div>
  );
}
