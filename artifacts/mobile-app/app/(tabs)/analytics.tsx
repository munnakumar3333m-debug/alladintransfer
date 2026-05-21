import { Feather } from "@expo/vector-icons";
import {
  useGetDashboardStats,
  useGetPerformanceData,
} from "@workspace/api-client-react";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseMonth(m: string): { label: string; year: string } {
  const [y, mo] = m.split("-");
  return { label: MONTH_SHORT[parseInt(mo, 10) - 1] ?? mo, year: y ?? "" };
}

function fmtPct(v: number): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

const BAR_WIDTH = 36;
const BAR_GAP = 10;
const CHART_HEIGHT = 180; // total area for bars (above + below baseline)
const HALF = CHART_HEIGHT / 2;   // 90px each side

interface MonthBar {
  month: string;
  label: string;
  year: string;
  pnl: number;
  wins: number;
  losses: number;
  winRate: number;
  best: number;
  worst: number;
  isNewYear: boolean;
}

interface BarChartProps {
  bars: MonthBar[];
  maxAbs: number;
}

function MonthlyBarChart({ bars, maxAbs }: BarChartProps) {
  const colors = useColors();
  const safeMax = maxAbs < 0.01 ? 1 : maxAbs;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.chartScroll, { paddingHorizontal: 12 }]}
    >
      {/* Y-axis labels */}
      <View style={[styles.yAxis, { height: CHART_HEIGHT + 32 }]}>
        <Text style={[styles.yLabel, { color: colors.positive }]}>+{safeMax.toFixed(0)}%</Text>
        <Text style={[styles.yLabel, { color: colors.mutedForeground }]}>0%</Text>
        <Text style={[styles.yLabel, { color: colors.negative }]}>-{safeMax.toFixed(0)}%</Text>
      </View>

      {bars.map((bar, i) => {
        const isPositive = bar.pnl >= 0;
        const barColor = isPositive ? colors.positive : colors.negative;
        const barH = Math.max(2, (Math.abs(bar.pnl) / safeMax) * HALF);
        const isEmpty = Math.abs(bar.pnl) < 0.01;

        return (
          <View key={bar.month} style={[styles.barColumn, { width: BAR_WIDTH + BAR_GAP }]}>
            {/* Year divider */}
            {bar.isNewYear && (
              <View style={[styles.yearDivider, { borderColor: colors.border }]}>
                <Text style={[styles.yearLabel, { color: colors.primary, backgroundColor: colors.background }]}>
                  {bar.year}
                </Text>
              </View>
            )}

            {/* Full bar area */}
            <View style={{ height: CHART_HEIGHT, justifyContent: "center" }}>
              {/* Positive half (above baseline) */}
              <View style={{ height: HALF, justifyContent: "flex-end", alignItems: "center" }}>
                {isPositive && !isEmpty ? (
                  <>
                    <Text style={[styles.barValueLabel, { color: colors.positive }]}>
                      {fmtPct(bar.pnl)}
                    </Text>
                    <View style={[styles.bar, { height: barH, width: BAR_WIDTH, backgroundColor: barColor, borderTopLeftRadius: 5, borderTopRightRadius: 5 }]} />
                  </>
                ) : null}
              </View>

              {/* Zero line */}
              <View style={[styles.zeroLine, { backgroundColor: colors.border }]} />

              {/* Negative half (below baseline) */}
              <View style={{ height: HALF, justifyContent: "flex-start", alignItems: "center" }}>
                {!isPositive && !isEmpty ? (
                  <>
                    <View style={[styles.bar, { height: barH, width: BAR_WIDTH, backgroundColor: barColor, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }]} />
                    <Text style={[styles.barValueLabel, { color: colors.negative }]}>
                      {fmtPct(bar.pnl)}
                    </Text>
                  </>
                ) : null}
                {isEmpty && (
                  <View style={[styles.bar, { height: 2, width: BAR_WIDTH, backgroundColor: colors.border }]} />
                )}
              </View>
            </View>

            {/* Month label */}
            <Text style={[styles.monthLabel, { color: colors.mutedForeground }]}>{bar.label}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: stats, isLoading: statsLoading, isError: statsError } = useGetDashboardStats();
  const { data: performance, isLoading: perfLoading, isError: perfError } = useGetPerformanceData();

  const isLoading = statsLoading || perfLoading;
  const hasError = statsError || perfError;

  const { bars, maxAbs, bestMonth, worstMonth, avgPnl, positiveMonths, negativeMonths } = useMemo(() => {
    const months = performance?.months ?? [];
    if (!months.length) return { bars: [], maxAbs: 1, bestMonth: null, worstMonth: null, avgPnl: 0, positiveMonths: 0, negativeMonths: 0 };

    let prevYear = "";
    const bars: MonthBar[] = months.map((m) => {
      const { label, year } = parseMonth(m.month);
      const isNewYear = year !== prevYear;
      prevYear = year;
      return {
        month: m.month,
        label,
        year,
        pnl: m.totalPnlPercent,
        wins: m.wins,
        losses: m.losses,
        winRate: m.winRate,
        best: m.bestTradePercent,
        worst: m.worstTradePercent,
        isNewYear,
      };
    });

    const maxAbs = Math.max(...bars.map((b) => Math.abs(b.pnl)), 1);
    const sorted = [...bars].sort((a, b) => b.pnl - a.pnl);
    const avgPnl = bars.reduce((s, b) => s + b.pnl, 0) / bars.length;
    const positiveMonths = bars.filter((b) => b.pnl > 0).length;
    const negativeMonths = bars.filter((b) => b.pnl < 0).length;

    return {
      bars,
      maxAbs,
      bestMonth: sorted[0] ?? null,
      worstMonth: sorted[sorted.length - 1] ?? null,
      avgPnl,
      positiveMonths,
      negativeMonths,
    };
  }, [performance]);

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Analytics</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      ) : hasError ? (
        <View style={[styles.emptyCard, { borderColor: colors.border }]}>
          <Feather name="alert-triangle" size={36} color={colors.negative} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Analytics are temporarily unavailable</Text>
        </View>
      ) : (
        <>
          {/* ── Stat grid ───────────────────────────────────────── */}
          {stats ? (
            <View style={styles.grid}>
              {[
                { icon: "bar-chart-2" as const, val: String(stats.totalTrades ?? 0), label: "Total Trades", color: colors.primary },
                { icon: "trending-up" as const, val: `${stats.winRate?.toFixed(1) ?? 0}%`, label: "Win Rate", color: colors.positive },
                {
                  icon: "percent" as const,
                  val: `${(stats.monthlyProfitPercent ?? 0) >= 0 ? "+" : ""}${stats.monthlyProfitPercent?.toFixed(1) ?? "0"}%`,
                  label: "Avg P&L",
                  color: (stats.monthlyProfitPercent ?? 0) >= 0 ? colors.positive : colors.negative,
                },
                { icon: "activity" as const, val: String(stats.todayRecommendationsCount ?? 0), label: "Active", color: colors.primary },
                { icon: "clock" as const, val: String(stats.trialDaysRemaining ?? 0), label: "Trial Days", color: colors.warning },
                { icon: "award" as const, val: String(stats.premiumDaysRemaining ?? 0), label: "Premium Days", color: colors.positive },
              ].map((s) => (
                <View key={s.label} style={[styles.statBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIcon, { backgroundColor: s.color + "22" }]}>
                    <Feather name={s.icon} size={16} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.val}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* ── Monthly performance chart ────────────────────────── */}
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Monthly Performance</Text>
                <Text style={[styles.chartSubtitle, { color: colors.mutedForeground }]}>
                  Net P&amp;L % per month · last {bars.length} months
                </Text>
              </View>
              {avgPnl !== 0 && (
                <View style={[styles.avgPill, { backgroundColor: (avgPnl >= 0 ? colors.positive : colors.negative) + "20", borderColor: (avgPnl >= 0 ? colors.positive : colors.negative) + "55" }]}>
                  <Text style={[styles.avgPillText, { color: avgPnl >= 0 ? colors.positive : colors.negative }]}>
                    Avg {fmtPct(avgPnl)}
                  </Text>
                </View>
              )}
            </View>

            {bars.length === 0 ? (
              <View style={[styles.emptyCard, { borderColor: colors.border, marginTop: 8 }]}>
                <Feather name="bar-chart" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No trade history yet</Text>
              </View>
            ) : (
              <>
                {/* Legend */}
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.positive }]} />
                    <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Gain</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.negative }]} />
                    <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Loss</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
                    <Text style={[styles.legendText, { color: colors.mutedForeground }]}>No trades</Text>
                  </View>
                </View>

                <MonthlyBarChart bars={bars} maxAbs={maxAbs} />

                {/* Summary row */}
                <View style={[styles.summaryRow, { borderTopColor: colors.border }]}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryVal, { color: colors.positive }]}>{positiveMonths}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Gain months</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryVal, { color: colors.negative }]}>{negativeMonths}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Loss months</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryVal, { color: colors.positive }]}>
                      {bestMonth ? `${bestMonth.label} '${bestMonth.year.slice(2)}` : "—"}
                    </Text>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                      Best {bestMonth ? fmtPct(bestMonth.pnl) : ""}
                    </Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryVal, { color: colors.negative }]}>
                      {worstMonth ? `${worstMonth.label} '${worstMonth.year.slice(2)}` : "—"}
                    </Text>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                      Worst {worstMonth ? fmtPct(worstMonth.pnl) : ""}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },
  loader: { marginTop: 60 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  statBlock: {
    width: "30%",
    flexGrow: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 6,
    alignItems: "flex-start",
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  chartCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingTop: 18,
    paddingBottom: 0,
    overflow: "hidden",
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  chartSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  avgPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  avgPillText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },

  legend: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  chartScroll: {
    alignItems: "flex-end",
    paddingBottom: 8,
  },
  yAxis: {
    width: 38,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 6,
    paddingBottom: 24,
  },
  yLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },

  barColumn: {
    alignItems: "center",
    position: "relative",
  },
  bar: {
    minHeight: 2,
  },
  zeroLine: {
    height: 1.5,
    width: BAR_WIDTH + BAR_GAP,
  },
  barValueLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginVertical: 2,
  },
  monthLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
    textAlign: "center",
  },
  yearDivider: {
    position: "absolute",
    top: 0,
    left: -1,
    bottom: 0,
    borderLeftWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "flex-start",
    zIndex: 1,
    paddingTop: 2,
  },
  yearLabel: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 2,
    letterSpacing: 0.3,
    position: "absolute",
    top: -16,
    left: 2,
  },

  summaryRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    marginTop: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 3,
  },
  summaryDivider: {
    width: 1,
    marginVertical: 10,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  emptyCard: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
