import { Feather } from "@expo/vector-icons";
import type { Recommendation } from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

function isMarketOpen(): boolean {
  const now = new Date();
  const ist = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440;
  return ist >= 540 && ist <= 930;
}

async function fetchLtp(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/market/ltp?symbols=${encodeURIComponent(symbol)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { prices: Record<string, number> };
    return data.prices[symbol.toUpperCase()] ?? null;
  } catch {
    return null;
  }
}

function useLivePrice(symbol: string) {
  const [ltp, setLtp] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const price = await fetchLtp(symbol);
      if (alive) setLtp(price);
    };
    load();
    timerRef.current = setInterval(() => {
      if (isMarketOpen()) load();
    }, 30_000);
    return () => {
      alive = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [symbol]);

  return ltp;
}

interface Props {
  rec: Recommendation;
  onPress?: () => void;
}

function fmtPrice(val: string | number | null | undefined): string {
  if (val == null || String(val).trim() === "") return "—";
  const s = String(val).trim();
  return /^[\d.,]+$/.test(s) ? `₹${s}` : s;
}

function fmtStopLoss(val: string | number | null | undefined): string {
  if (val == null || String(val).trim() === "" || String(val).trim().toLowerCase() === "none") return "None";
  return fmtPrice(val);
}

function slColor(val: string | number | null | undefined, fallback: string): string {
  const s = String(val ?? "").trim().toLowerCase();
  if (!s || s === "none") return "#64748B";
  return fallback;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:         { label: "Active",        color: "#F59E0B", bg: "#F59E0B18" },
  executed:       { label: "Executed",      color: "#818CF8", bg: "#818CF818" },
  hold:           { label: "Hold",          color: "#F59E0B", bg: "#F59E0B18" },
  target_hit:     { label: "Target Hit",    color: "#10B981", bg: "#10B98118" },
  stop_loss_hit:  { label: "Stop Loss",     color: "#EF4444", bg: "#EF444418" },
  partial_profit: { label: "Partial Exit",  color: "#10B981", bg: "#10B98118" },
  closed:         { label: "Closed",        color: "#64748B", bg: "#64748B18" },
};

function isPast915IST(): boolean {
  const now = new Date();
  const istMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440;
  return istMinutes >= 555;
}


export function RecommendationCard({ rec, onPress }: Props) {
  const colors = useColors();
  const ltp = useLivePrice(rec.nseSymbol);

  const pnl = rec.pnlPercent ? parseFloat(String(rec.pnlPercent)) : null;
  const isPositive = pnl !== null && pnl >= 0;

  const isBuy = rec.signalType === "BUY";
  const signalColor   = isBuy ? "#10B981" : "#EF4444";
  const signalColors  = isBuy ? (["#10B981", "#059669"] as const) : (["#EF4444", "#DC2626"] as const);
  const cardBorder    = signalColor + "30";

  const effectiveStatus = rec.status === "active" && isPast915IST() ? "executed" : rec.status;
  const status = STATUS_META[effectiveStatus] ?? STATUS_META.active;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: cardBorder,
          shadowColor: signalColor,
        },
      ]}
    >
      {/* ── Top accent bar ──────────────────────────────── */}
      <LinearGradient
        colors={signalColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />

      {/* ── Header row ──────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {/* BUY / SELL pill */}
          <LinearGradient
            colors={signalColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.signalPill}
          >
            <Feather
              name="triangle"
              size={9}
              color="#fff"
              style={isBuy ? styles.buyTriangle : styles.sellTriangle}
            />
            <Text style={styles.signalLabel}>{rec.signalType}</Text>
          </LinearGradient>

          {/* Intraday chip */}
          <View style={styles.intradayChip}>
            <Feather name="zap" size={9} color="#818CF8" />
            <Text style={styles.intradayText}>Intraday · 9:15 AM</Text>
          </View>
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* ── Stock identity ──────────────────────────────── */}
      <View style={styles.stockRow}>
        <View style={styles.symbolWrap}>
          <View style={styles.symbolLine}>
            <Text style={[styles.symbol, { color: colors.foreground }]}>{rec.nseSymbol}</Text>
            <View style={styles.nseBadge}>
              <Text style={styles.nseText}>NSE</Text>
            </View>
          </View>
          <Text style={[styles.stockName, { color: colors.mutedForeground }]} numberOfLines={1}>
            {rec.stockName}
          </Text>
        </View>

        {/* Live price */}
        {ltp != null && (
          <View style={styles.ltpWrap}>
            <View style={styles.liveDot} />
            <View>
              <Text style={styles.ltpLabel}>Current Price</Text>
              <Text style={styles.ltpValue}>₹{ltp.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Price grid ──────────────────────────────────── */}
      <View style={[styles.priceGrid, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <PriceCell label="Opening Price"     value={fmtPrice(rec.buyPrice)}    valueColor={colors.foreground} />
        <View style={[styles.priceDivider, { backgroundColor: colors.border }]} />
        <PriceCell label="Target"          value={fmtPrice(rec.targetPrice)} valueColor="#10B981" />
        <View style={[styles.priceDivider, { backgroundColor: colors.border }]} />
        <PriceCell label="Stop Loss"       value={fmtStopLoss(rec.stopLoss)} valueColor={slColor(rec.stopLoss, "#EF4444")} />
      </View>

      {/* ── P&L row (when available) ─────────────────── */}
      {pnl !== null && (
        <View style={[styles.pnlRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.pnlLabel, { color: colors.mutedForeground }]}>P&L</Text>
          <Text style={[styles.pnlValue, { color: isPositive ? "#10B981" : "#EF4444" }]}>
            {isPositive ? "+" : ""}{pnl.toFixed(2)}%
          </Text>
        </View>
      )}

      {/* ── Notes ──────────────────────────────────────── */}
      {rec.notes && (
        <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={2}>
          {rec.notes}
        </Text>
      )}

      {/* ── Footer ─────────────────────────────────────── */}
      <View style={styles.footer}>
        <Feather name="calendar" size={11} color={colors.mutedForeground} />
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{rec.date}</Text>
        <View style={styles.spacer} />
        <Text style={[styles.viewDetails, { color: colors.mutedForeground }]}>View details</Text>
        <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

function PriceCell({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <View style={styles.priceCell}>
      <Text style={styles.priceCellLabel}>{label}</Text>
      <Text style={[styles.priceCellValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },

  accentBar: {
    height: 3,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },

  signalPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
  },
  signalLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  buyTriangle:  { transform: [{ rotate: "0deg" }] },
  sellTriangle: { transform: [{ rotate: "180deg" }] },

  intradayChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#818CF80E",
    borderWidth: 1,
    borderColor: "#818CF830",
  },
  intradayText: {
    color: "#818CF8",
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 10,
  },
  symbolWrap: { flex: 1, gap: 2 },
  ltpWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10B98112",
    borderWidth: 1,
    borderColor: "#10B98130",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginLeft: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  ltpLabel: {
    color: "#10B981",
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0,
  },
  ltpValue: {
    color: "#10B981",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  symbolLine: { flexDirection: "row", alignItems: "center", gap: 7 },
  symbol: {
    fontSize: 21,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  nseBadge: {
    backgroundColor: "#1E3A5F",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nseText: {
    color: "#60A5FA",
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  stockName: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  riskBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  riskText: {
    fontSize: 9.5,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },

  priceGrid: {
    flexDirection: "row",
    marginHorizontal: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  priceCell: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 4,
  },
  priceCellLabel: {
    color: "#475569",
    fontSize: 8,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  priceCellValue: {
    fontSize: 13.5,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  priceDivider: {
    width: 1,
  },

  pnlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  pnlLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  pnlValue: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },

  notes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 2,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 4,
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginLeft: 2,
  },
  spacer: { flex: 1 },
  viewDetails: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
