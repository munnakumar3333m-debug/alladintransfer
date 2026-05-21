import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  G,
  Line,
  Rect,
  Svg,
  Text as SvgText,
} from "react-native-svg";

import { useColors } from "@/hooks/useColors";

const RANGES = [
  { label: "1D", value: "1d" },
  { label: "5D", value: "5d" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
];

interface ChartPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartData {
  symbol: string;
  currency: string;
  currentPrice: number;
  points: ChartPoint[];
}

interface StockChartProps {
  symbol: string;
}

/* ── data fetching ─────────────────────────────────────── */
function useStockChart(symbol: string, range: string) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
    const url = `https://${domain}/api/stocks/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ChartData>;
      })
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [symbol, range]);

  return { data, loading, error };
}

/* ── SVG candlestick chart ─────────────────────────────── */
const CHART_HEIGHT   = 220;
const YAXIS_WIDTH    = 58;
const XAXIS_HEIGHT   = 24;
const CANDLE_GAP     = 2;
const PLOT_H         = CHART_HEIGHT - XAXIS_HEIGHT;

function lerp(v: number, minV: number, maxV: number, maxPx: number): number {
  if (maxV === minV) return maxPx / 2;
  return maxPx - ((v - minV) / (maxV - minV)) * maxPx;
}

interface CandleChartProps {
  points: ChartPoint[];
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}

function CandleChart({ points, colors }: CandleChartProps) {
  const screenW = Dimensions.get("window").width;
  const plotW   = screenW - 64 - YAXIS_WIDTH;
  const totalW  = Math.max(plotW, points.length * 14);

  const allHighs = points.map((p) => p.high);
  const allLows  = points.map((p) => p.low);
  const maxV     = Math.max(...allHighs);
  const minV     = Math.min(...allLows);
  const pad      = (maxV - minV) * 0.05;
  const hi       = maxV + pad;
  const lo       = minV - pad;

  const candleW  = Math.max(4, Math.min(14, totalW / points.length - CANDLE_GAP));
  const step     = totalW / points.length;

  // Y-axis labels
  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = lo + (hi - lo) * (i / yTicks);
    return { y: lerp(v, lo, hi, PLOT_H), label: `₹${v.toFixed(0)}` };
  });

  // X-axis labels — show ~5 evenly spaced
  const xStep = Math.max(1, Math.floor(points.length / 5));
  const xLabels = points
    .map((p, i) => ({ i, p }))
    .filter(({ i }) => i % xStep === 0 || i === points.length - 1);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexDirection: "row" }}
    >
      {/* Scrollable candle area */}
      <Svg width={totalW} height={CHART_HEIGHT}>
        <G>
          {/* Grid lines */}
          {yLabels.map(({ y }, i) => (
            <Line
              key={i}
              x1={0}
              y1={y}
              x2={totalW}
              y2={y}
              stroke={colors.border}
              strokeWidth={0.5}
              strokeDasharray="3,3"
            />
          ))}

          {/* Candles */}
          {points.map((p, i) => {
            const cx      = i * step + step / 2;
            const yHigh   = lerp(p.high,  lo, hi, PLOT_H);
            const yLow    = lerp(p.low,   lo, hi, PLOT_H);
            const yOpen   = lerp(p.open,  lo, hi, PLOT_H);
            const yClose  = lerp(p.close, lo, hi, PLOT_H);
            const bullish = p.close >= p.open;
            const fill    = bullish ? "#10B981" : "#EF4444";
            const bodyTop = Math.min(yOpen, yClose);
            const bodyH   = Math.max(1, Math.abs(yClose - yOpen));

            return (
              <G key={i}>
                {/* Wick */}
                <Line
                  x1={cx}
                  y1={yHigh}
                  x2={cx}
                  y2={yLow}
                  stroke={fill}
                  strokeWidth={1.5}
                />
                {/* Body */}
                <Rect
                  x={cx - candleW / 2}
                  y={bodyTop}
                  width={candleW}
                  height={bodyH}
                  fill={fill}
                  rx={1}
                />
              </G>
            );
          })}

          {/* X-axis labels */}
          {xLabels.map(({ i, p }) => {
            const cx = i * step + step / 2;
            const d  = new Date(p.time);
            const lbl =
              points.length <= 20
                ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
            return (
              <SvgText
                key={i}
                x={cx}
                y={CHART_HEIGHT - 4}
                fontSize={8}
                fill={colors.mutedForeground}
                textAnchor="middle"
              >
                {lbl}
              </SvgText>
            );
          })}
        </G>
      </Svg>

      {/* Fixed Y-axis */}
      <Svg width={YAXIS_WIDTH} height={CHART_HEIGHT} style={StyleSheet.absoluteFillObject}>
        {yLabels.map(({ y, label }, i) => (
          <SvgText
            key={i}
            x={YAXIS_WIDTH - 2}
            y={y + 4}
            fontSize={8}
            fill={colors.mutedForeground}
            textAnchor="end"
          >
            {label}
          </SvgText>
        ))}
      </Svg>
    </ScrollView>
  );
}

/* ── main component ────────────────────────────────────── */
const SCREEN_WIDTH = Dimensions.get("window").width;

export function StockChart({ symbol }: StockChartProps) {
  const colors = useColors();
  const [range, setRange] = useState("1mo");
  const { data, loading, error } = useStockChart(symbol, range);

  const pts      = data?.points ?? [];
  const isUp     = pts.length >= 2 ? pts[pts.length - 1].close >= pts[0].close : true;
  const change   = pts.length >= 2 ? pts[pts.length - 1].close - pts[0].close : 0;
  const changePct = pts.length >= 2 && pts[0].close !== 0
    ? (change / pts[0].close) * 100 : 0;
  const maxVal   = pts.length ? Math.max(...pts.map((p) => p.high))  : 0;
  const minVal   = pts.length ? Math.min(...pts.map((p) => p.low))   : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.symbolText, { color: colors.foreground }]}>
            {symbol} · Candlestick
          </Text>
          {data && (
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.foreground }]}>
                ₹{data.currentPrice.toLocaleString("en-IN")}
              </Text>
              <Text style={[styles.change, { color: isUp ? "#10B981" : "#EF4444" }]}>
                {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)} ({Math.abs(changePct).toFixed(2)}%)
              </Text>
            </View>
          )}
        </View>
        <View style={styles.ranges}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r.value}
              onPress={() => setRange(r.value)}
              style={[
                styles.rangeBtn,
                {
                  backgroundColor: range === r.value ? colors.primary : "transparent",
                  borderColor:     range === r.value ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.rangeText, { color: range === r.value ? "#fff" : colors.mutedForeground }]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chart */}
      <View style={[styles.chartArea, { borderColor: colors.border }]}>
        {loading && (
          <View style={[styles.center, { backgroundColor: colors.card }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
              Loading {symbol} candles…
            </Text>
          </View>
        )}
        {error && !loading && (
          <View style={[styles.center, { backgroundColor: colors.card }]}>
            <Text style={[styles.statusText, { color: "#EF4444" }]}>Could not load chart</Text>
            <Text style={[styles.statusSub,  { color: colors.mutedForeground }]}>{error}</Text>
          </View>
        )}
        {!loading && !error && pts.length > 0 && (
          <CandleChart points={pts} colors={colors} />
        )}
        {!loading && !error && pts.length === 0 && (
          <View style={[styles.center, { backgroundColor: colors.card }]}>
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>No data</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      {data && (
        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          <Stat label="High"    value={`₹${maxVal.toLocaleString("en-IN")}`} colors={colors} />
          <Stat label="Low"     value={`₹${minVal.toLocaleString("en-IN")}`} colors={colors} />
          <Stat label="Change"  value={`${isUp ? "+" : ""}${changePct.toFixed(2)}%`}
            valueColor={isUp ? "#10B981" : "#EF4444"} colors={colors} />
          <Stat label="Candles" value={String(pts.length)} colors={colors} />
        </View>
      )}
    </View>
  );
}

function Stat({ label, value, valueColor, colors }: {
  label: string; value: string; valueColor?: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  header:     { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  symbolText: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  priceRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  price:      { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold" },
  change:     { fontSize: 12, fontFamily: "Inter_500Medium" },
  ranges:     { flexDirection: "row", gap: 5 },
  rangeBtn:   { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, borderWidth: 1 },
  rangeText:  { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  chartArea:  { height: CHART_HEIGHT, borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  center:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  statusText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  statusSub:  { fontSize: 11, fontFamily: "Inter_400Regular" },
  statsRow:   { flexDirection: "row", justifyContent: "space-around", paddingTop: 12, borderTopWidth: 1 },
  stat:       { alignItems: "center", gap: 2 },
  statLabel:  { fontSize: 10, fontFamily: "Inter_400Regular" },
  statValue:  { fontSize: 12, fontFamily: "Inter_700Bold" },
});
