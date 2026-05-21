import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CandlestickChart } from "react-native-gifted-charts";

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
      .then((d) => {
        if (!cancelled) { setData(d); setLoading(false); }
      })
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

const SCREEN_WIDTH = Dimensions.get("window").width;

export function StockChart({ symbol }: StockChartProps) {
  const colors = useColors();
  const [range, setRange] = useState("1mo");
  const { data, loading, error } = useStockChart(symbol, range);

  const pts = data?.points ?? [];

  const isUp = pts.length >= 2
    ? pts[pts.length - 1].close >= pts[0].close
    : true;

  const change = pts.length >= 2 ? pts[pts.length - 1].close - pts[0].close : 0;
  const changePct = pts.length >= 2 && pts[0].close !== 0
    ? (change / pts[0].close) * 100 : 0;

  const allHighs = pts.map((p) => p.high);
  const allLows  = pts.map((p) => p.low);
  const maxVal   = allHighs.length ? Math.max(...allHighs) : 0;
  const minVal   = allLows.length  ? Math.min(...allLows)  : 0;

  // gifted-charts candlestick data format
  const candleData = pts.map((p) => ({
    open:  p.open,
    high:  p.high,
    low:   p.low,
    close: p.close,
  }));

  const chartWidth = SCREEN_WIDTH - 64;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.symbolText, { color: colors.foreground }]}>
            {symbol} · Live Chart
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

      {/* Chart area */}
      <View style={styles.chartArea}>
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
            <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>{error}</Text>
          </View>
        )}

        {!loading && !error && candleData.length > 0 && (
          <CandlestickChart
            data={candleData}
            width={chartWidth}
            height={240}
            candleWidth={Math.max(4, Math.min(14, Math.floor(chartWidth / candleData.length) - 2))}
            candleStickWidth={1.5}
            bullColor="#10B981"
            bearColor="#EF4444"
            bullBorderColor="#10B981"
            bearBorderColor="#EF4444"
            lineWidth={1}
            maxValue={maxVal * 1.01}
            yAxisColor={colors.border}
            xAxisColor={colors.border}
            yAxisTextStyle={{ color: colors.mutedForeground, fontSize: 9 }}
            rulesColor={colors.border}
            rulesType="dashed"
            noOfSections={4}
            formatYLabel={(v: string) => `₹${Number(v).toFixed(0)}`}
            backgroundColor={colors.card}
            initialSpacing={6}
            endSpacing={6}
            showScrollIndicator
          />
        )}

        {!loading && !error && candleData.length === 0 && (
          <View style={[styles.center, { backgroundColor: colors.card }]}>
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>No data available</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      {data && (
        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          <Stat label="High"   value={`₹${maxVal.toLocaleString("en-IN")}`} colors={colors} />
          <Stat label="Low"    value={`₹${minVal.toLocaleString("en-IN")}`} colors={colors} />
          <Stat label="Change" value={`${isUp ? "+" : ""}${changePct.toFixed(2)}%`}
            valueColor={isUp ? "#10B981" : "#EF4444"} colors={colors} />
          <Stat label="Candles" value={String(candleData.length)} colors={colors} />
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
  chartArea:  { height: 260, justifyContent: "center" },
  center:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  statusText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  statusSub:  { fontSize: 11, fontFamily: "Inter_400Regular" },
  statsRow:   { flexDirection: "row", justifyContent: "space-around", paddingTop: 12, borderTopWidth: 1 },
  stat:       { alignItems: "center", gap: 2 },
  statLabel:  { fontSize: 10, fontFamily: "Inter_400Regular" },
  statValue:  { fontSize: 12, fontFamily: "Inter_700Bold" },
});
