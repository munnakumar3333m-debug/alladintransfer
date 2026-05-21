import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";

import { useColors } from "@/hooks/useColors";

const RANGES = [
  { label: "1D", value: "1d" },
  { label: "5D", value: "5d" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
];

interface ChartPoint {
  time: number;
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
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
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

function formatLabel(time: number, range: string): string {
  const d = new Date(time);
  if (range === "1d") {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const SCREEN_WIDTH = Dimensions.get("window").width;

export function StockChart({ symbol }: StockChartProps) {
  const colors = useColors();
  const [range, setRange] = useState("1mo");
  const { data, loading, error } = useStockChart(symbol, range);

  const pts = data?.points ?? [];

  const isUp =
    pts.length >= 2 ? pts[pts.length - 1].close >= pts[0].close : true;
  const lineColor = isUp ? "#10B981" : "#EF4444";
  const gradientFrom = isUp ? "#10B98140" : "#EF444440";

  const maxVal = pts.length ? Math.max(...pts.map((p) => p.close)) : 0;
  const minVal = pts.length ? Math.min(...pts.map((p) => p.close)) : 0;
  const change =
    pts.length >= 2
      ? pts[pts.length - 1].close - pts[0].close
      : 0;
  const changePct =
    pts.length >= 2 && pts[0].close !== 0
      ? (change / pts[0].close) * 100
      : 0;

  const step = Math.max(1, Math.floor(pts.length / 5));
  const chartData = pts.map((p, i) => ({
    value: p.close,
    label:
      i % step === 0 || i === pts.length - 1
        ? formatLabel(p.time, range)
        : "",
    labelTextStyle: {
      color: colors.mutedForeground,
      fontSize: 9,
      width: 48,
    },
  }));

  const chartWidth = SCREEN_WIDTH - 64;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.symbolText, { color: colors.foreground }]}>
            {symbol}
          </Text>
          {data && (
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.foreground }]}>
                ₹{data.currentPrice.toLocaleString("en-IN")}
              </Text>
              <Text
                style={[
                  styles.change,
                  { color: isUp ? "#10B981" : "#EF4444" },
                ]}
              >
                {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)} (
                {Math.abs(changePct).toFixed(2)}%)
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
                  backgroundColor:
                    range === r.value ? colors.primary : "transparent",
                  borderColor:
                    range === r.value ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.rangeText,
                  {
                    color:
                      range === r.value ? "#fff" : colors.mutedForeground,
                  },
                ]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.chartArea}>
        {loading && (
          <View style={[styles.center, { backgroundColor: colors.card }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
              Loading {symbol}…
            </Text>
          </View>
        )}
        {error && !loading && (
          <View style={[styles.center, { backgroundColor: colors.card }]}>
            <Text style={[styles.statusText, { color: "#EF4444" }]}>
              Could not load chart data
            </Text>
            <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>
              {error}
            </Text>
          </View>
        )}
        {!loading && !error && chartData.length > 0 && (
          <LineChart
            data={chartData}
            width={chartWidth}
            height={220}
            color={lineColor}
            thickness={2}
            startFillColor={gradientFrom}
            endFillColor="transparent"
            areaChart
            curved
            hideDataPoints
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            yAxisTextStyle={{ color: colors.mutedForeground, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.mutedForeground, fontSize: 9 }}
            rulesColor={colors.border}
            rulesType="dashed"
            yAxisTextNumberOfLines={1}
            maxValue={maxVal * 1.02}
            minValue={minVal * 0.98}
            noOfSections={4}
            formatYLabel={(v) => `₹${Number(v).toFixed(0)}`}
            backgroundColor={colors.card}
            initialSpacing={8}
            endSpacing={8}
            pointerConfig={{
              pointerStripHeight: 160,
              pointerStripColor: colors.border,
              pointerStripWidth: 1,
              pointerColor: lineColor,
              radius: 5,
              pointerLabelWidth: 120,
              pointerLabelHeight: 40,
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: true,
              pointerLabelComponent: (items: Array<{ value: number }>) => (
                <View
                  style={[
                    styles.tooltip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.tooltipText, { color: colors.foreground }]}>
                    ₹{items[0].value.toLocaleString("en-IN")}
                  </Text>
                </View>
              ),
            }}
          />
        )}
        {!loading && !error && chartData.length === 0 && (
          <View style={[styles.center, { backgroundColor: colors.card }]}>
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
              No data available
            </Text>
          </View>
        )}
      </View>

      {data && (
        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          <Stat label="High" value={`₹${maxVal.toLocaleString("en-IN")}`} colors={colors} />
          <Stat label="Low" value={`₹${minVal.toLocaleString("en-IN")}`} colors={colors} />
          <Stat
            label="Change"
            value={`${isUp ? "+" : ""}${changePct.toFixed(2)}%`}
            valueColor={isUp ? "#10B981" : "#EF4444"}
            colors={colors}
          />
        </View>
      )}
    </View>
  );
}

function Stat({
  label,
  value,
  valueColor,
  colors,
}: {
  label: string;
  value: string;
  valueColor?: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: valueColor ?? colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  symbolText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  change: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  ranges: {
    flexDirection: "row",
    gap: 5,
  },
  rangeBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  rangeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  chartArea: {
    height: 240,
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  statusSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  tooltip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tooltipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  stat: { alignItems: "center", gap: 2 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
