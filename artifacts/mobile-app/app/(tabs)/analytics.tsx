import { Feather } from "@expo/vector-icons";
import {
  useGetDashboardStats,
  useGetPerformanceData,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
const CHART_HEIGHT = 180;
const HALF = CHART_HEIGHT / 2;

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
  selectedMonth: string | null;
  onSelectMonth: (month: string) => void;
}

function MonthlyBarChart({ bars, maxAbs, selectedMonth, onSelectMonth }: BarChartProps) {
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

      {bars.map((bar) => {
        const isPositive = bar.pnl >= 0;
        const isEmpty = Math.abs(bar.pnl) < 0.01;
        const isSelected = selectedMonth === bar.month;
        const barColor = isEmpty
          ? colors.border
          : isSelected
            ? colors.primary
            : isPositive
              ? colors.positive
              : colors.negative;
        const barH = Math.max(2, (Math.abs(bar.pnl) / safeMax) * HALF);

        return (
          <TouchableOpacity
            key={bar.month}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelectMonth(bar.month);
            }}
            style={[styles.barColumn, { width: BAR_WIDTH + BAR_GAP }]}
          >
            {/* Year divider */}
            {bar.isNewYear && (
              <View style={[styles.yearDivider, { borderColor: colors.border }]}>
                <Text style={[styles.yearLabel, { color: colors.primary, backgroundColor: colors.background }]}>
                  {bar.year}
                </Text>
              </View>
            )}

            {/* Selected ring */}
            {isSelected && (
              <View style={[styles.selectedRing, { borderColor: colors.primary + "60", top: 0, bottom: 24, left: (BAR_GAP / 2) - 2 }]} />
            )}

            {/* Full bar area */}
            <View style={{ height: CHART_HEIGHT, justifyContent: "center" }}>
              {/* Positive half */}
              <View style={{ height: HALF, justifyContent: "flex-end", alignItems: "center" }}>
                {isPositive && !isEmpty ? (
                  <>
                    <Text style={[styles.barValueLabel, { color: isSelected ? colors.primary : colors.positive }]}>
                      {fmtPct(bar.pnl)}
                    </Text>
                    <View style={[styles.bar, { height: barH, width: BAR_WIDTH, backgroundColor: barColor, borderTopLeftRadius: 5, borderTopRightRadius: 5 }]} />
                  </>
                ) : null}
              </View>

              {/* Zero line */}
              <View style={[styles.zeroLine, { backgroundColor: colors.border }]} />

              {/* Negative half */}
              <View style={{ height: HALF, justifyContent: "flex-start", alignItems: "center" }}>
                {!isPositive && !isEmpty ? (
                  <>
                    <View style={[styles.bar, { height: barH, width: BAR_WIDTH, backgroundColor: barColor, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }]} />
                    <Text style={[styles.barValueLabel, { color: isSelected ? colors.primary : colors.negative }]}>
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
            <Text style={[styles.monthLabel, { color: isSelected ? colors.primary : colors.mutedForeground, fontFamily: isSelected ? "Inter_700Bold" : "Inter_500Medium" }]}>
              {bar.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Month Detail Panel ───────────────────────────────────────────────────────

function MonthDetailPanel({ bar, onClose }: { bar: MonthBar; onClose: () => void }) {
  const colors = useColors();
  const pnlPositive = bar.pnl >= 0;
  const pnlColor = pnlPositive ? colors.positive : colors.negative;

  const rows = [
    { label: "Total Trades", val: String(bar.wins + bar.losses), color: colors.foreground, icon: "bar-chart-2" as const },
    { label: "Winning Trades", val: String(bar.wins), color: colors.positive, icon: "trending-up" as const },
    { label: "Losing Trades", val: String(bar.losses), color: colors.negative, icon: "trending-down" as const },
    { label: "Win Rate", val: `${bar.winRate.toFixed(1)}%`, color: bar.winRate >= 50 ? colors.positive : colors.negative, icon: "target" as const },
    { label: "Net P&L", val: fmtPct(bar.pnl), color: pnlColor, icon: "percent" as const },
    { label: "Best Trade", val: fmtPct(bar.best), color: colors.positive, icon: "award" as const },
    { label: "Worst Trade", val: fmtPct(bar.worst), color: colors.negative, icon: "alert-circle" as const },
  ];

  return (
    <View style={[styles.detailPanel, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <View style={styles.detailTitleRow}>
          <View style={[styles.detailDot, { backgroundColor: pnlColor }]} />
          <Text style={[styles.detailTitle, { color: colors.foreground }]}>
            {bar.label} {bar.year}
          </Text>
          <View style={[styles.detailPnlPill, { backgroundColor: pnlColor + "20", borderColor: pnlColor + "50" }]}>
            <Text style={[styles.detailPnlText, { color: pnlColor }]}>{fmtPct(bar.pnl)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Stats grid */}
      <View style={styles.detailGrid}>
        {rows.map((r) => (
          <View key={r.label} style={[styles.detailCell, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.detailCellIcon, { backgroundColor: r.color + "18" }]}>
              <Feather name={r.icon} size={12} color={r.color} />
            </View>
            <Text style={[styles.detailCellVal, { color: r.color }]}>{r.val}</Text>
            <Text style={[styles.detailCellLabel, { color: colors.mutedForeground }]}>{r.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Win Rate Breakdown Panel ─────────────────────────────────────────────────

function WinRateBreakdown({ wins, losses, winRate, onClose }: { wins: number; losses: number; winRate: number; onClose: () => void }) {
  const colors = useColors();
  const total = wins + losses;
  const winPct = total > 0 ? (wins / total) * 100 : 0;
  const lossPct = 100 - winPct;

  return (
    <View style={[styles.detailPanel, { backgroundColor: colors.card, borderColor: colors.positive + "40" }]}>
      <View style={styles.detailHeader}>
        <Text style={[styles.detailTitle, { color: colors.foreground }]}>Win Rate Breakdown</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.negative + "30" }]}>
        <View style={[styles.progressFill, { width: `${winPct}%` as any, backgroundColor: colors.positive }]} />
      </View>
      <View style={styles.progressLabels}>
        <View style={styles.progressLabelItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.positive }]} />
          <Text style={[styles.progressLabelText, { color: colors.mutedForeground }]}>{wins} wins ({winPct.toFixed(1)}%)</Text>
        </View>
        <View style={styles.progressLabelItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.negative }]} />
          <Text style={[styles.progressLabelText, { color: colors.mutedForeground }]}>{losses} losses ({lossPct.toFixed(1)}%)</Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        {[
          { label: "Total Trades", val: String(total), color: colors.primary, icon: "bar-chart-2" as const },
          { label: "Winning Trades", val: String(wins), color: colors.positive, icon: "trending-up" as const },
          { label: "Losing Trades", val: String(losses), color: colors.negative, icon: "trending-down" as const },
          { label: "Win Rate", val: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? colors.positive : colors.negative, icon: "target" as const },
        ].map((r) => (
          <View key={r.label} style={[styles.detailCell, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.detailCellIcon, { backgroundColor: r.color + "18" }]}>
              <Feather name={r.icon} size={12} color={r.color} />
            </View>
            <Text style={[styles.detailCellVal, { color: r.color }]}>{r.val}</Text>
            <Text style={[styles.detailCellLabel, { color: colors.mutedForeground }]}>{r.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const { data: stats, isLoading: statsLoading, isError: statsError } = useGetDashboardStats();
  const { data: performance, isLoading: perfLoading, isError: perfError } = useGetPerformanceData();

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showWinRate, setShowWinRate] = useState(false);

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
      return { month: m.month, label, year, pnl: m.totalPnlPercent, wins: m.wins, losses: m.losses, winRate: m.winRate, best: m.bestTradePercent, worst: m.worstTradePercent, isNewYear };
    });

    const maxAbs = Math.max(...bars.map((b) => Math.abs(b.pnl)), 1);
    const sorted = [...bars].sort((a, b) => b.pnl - a.pnl);
    const avgPnl = bars.reduce((s, b) => s + b.pnl, 0) / bars.length;

    return {
      bars,
      maxAbs,
      bestMonth: sorted[0] ?? null,
      worstMonth: sorted[sorted.length - 1] ?? null,
      avgPnl,
      positiveMonths: bars.filter((b) => b.pnl > 0).length,
      negativeMonths: bars.filter((b) => b.pnl < 0).length,
    };
  }, [performance]);

  const selectedBar = bars.find((b) => b.month === selectedMonth) ?? null;

  const handleSelectMonth = (month: string) => {
    setShowWinRate(false);
    setSelectedMonth((prev) => prev === month ? null : month);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const statItems = stats ? [
    {
      icon: "bar-chart-2" as const,
      val: String(stats.totalTrades ?? 0),
      label: "Total Trades",
      sub: "All picks ever",
      color: colors.primary,
      onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/history"); },
      arrow: true,
    },
    {
      icon: "trending-up" as const,
      val: `${stats.winRate?.toFixed(1) ?? 0}%`,
      label: "Win Rate",
      sub: "Tap for breakdown",
      color: colors.positive,
      onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedMonth(null); setShowWinRate((v) => !v); setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100); },
      arrow: true,
    },
    {
      icon: "percent" as const,
      val: `${(stats.monthlyProfitPercent ?? 0) >= 0 ? "+" : ""}${stats.monthlyProfitPercent?.toFixed(1) ?? "0"}%`,
      label: "Avg P&L",
      sub: "Monthly average",
      color: (stats.monthlyProfitPercent ?? 0) >= 0 ? colors.positive : colors.negative,
      onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); scrollRef.current?.scrollToEnd({ animated: true }); },
      arrow: false,
    },
    {
      icon: "activity" as const,
      val: String(stats.todayRecommendationsCount ?? 0),
      label: "Today's Picks",
      sub: "View active picks",
      color: colors.primary,
      onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/"); },
      arrow: true,
    },
    {
      icon: "clock" as const,
      val: String(stats.trialDaysRemaining ?? 0),
      label: "Trial Days Left",
      sub: "Tap to upgrade",
      color: colors.warning,
      onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/subscribe"); },
      arrow: true,
    },
    {
      icon: "award" as const,
      val: String(stats.premiumDaysRemaining ?? 0),
      label: "Premium Days",
      sub: "Tap to manage",
      color: colors.positive,
      onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/subscribe"); },
      arrow: true,
    },
  ] : [];

  return (
    <ScrollView
      ref={scrollRef}
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
            <>
              <View style={styles.grid}>
                {statItems.map((s) => (
                  <TouchableOpacity
                    key={s.label}
                    activeOpacity={0.72}
                    onPress={s.onPress}
                    style={[styles.statBlock, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.statBlockTop}>
                      <View style={[styles.statIcon, { backgroundColor: s.color + "22" }]}>
                        <Feather name={s.icon} size={15} color={s.color} />
                      </View>
                      {s.arrow && <Feather name="chevron-right" size={13} color={colors.mutedForeground} style={{ opacity: 0.6 }} />}
                    </View>
                    <Text style={[styles.statValue, { color: s.color }]}>{s.val}</Text>
                    <Text style={[styles.statLabel, { color: colors.foreground }]}>{s.label}</Text>
                    <Text style={[styles.statSub, { color: colors.mutedForeground }]}>{s.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Win Rate breakdown panel */}
              {showWinRate && stats && (
                <WinRateBreakdown
                  wins={Math.round(((stats.winRate ?? 0) / 100) * (stats.totalTrades ?? 0))}
                  losses={(stats.totalTrades ?? 0) - Math.round(((stats.winRate ?? 0) / 100) * (stats.totalTrades ?? 0))}
                  winRate={stats.winRate ?? 0}
                  onClose={() => setShowWinRate(false)}
                />
              )}
            </>
          ) : null}

          {/* ── Monthly performance chart ────────────────────────── */}
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.chartHeader}>
              <View style={styles.chartHeaderLeft}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Monthly Performance</Text>
                <Text style={[styles.chartSubtitle, { color: colors.mutedForeground }]}>
                  Tap any bar · Net P&L % per month · last {bars.length} months
                </Text>
              </View>
              {avgPnl !== 0 && (
                <View style={[styles.avgPill, { backgroundColor: (avgPnl >= 0 ? colors.positive : colors.negative) + "20", borderColor: (avgPnl >= 0 ? colors.positive : colors.negative) + "55" }]}>
                  <Text style={[styles.avgPillText, { color: avgPnl >= 0 ? colors.positive : colors.negative }]} numberOfLines={1}>
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
                    <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Selected</Text>
                  </View>
                </View>

                <MonthlyBarChart
                  bars={bars}
                  maxAbs={maxAbs}
                  selectedMonth={selectedMonth}
                  onSelectMonth={handleSelectMonth}
                />

                {/* Summary row — tappable to select month */}
                <View style={[styles.summaryRow, { borderTopColor: colors.border }]}>
                  <TouchableOpacity style={styles.summaryItem} activeOpacity={0.7} onPress={() => {}}>
                    <Text style={[styles.summaryVal, { color: colors.positive }]}>{positiveMonths}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Gain months</Text>
                  </TouchableOpacity>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <TouchableOpacity style={styles.summaryItem} activeOpacity={0.7} onPress={() => {}}>
                    <Text style={[styles.summaryVal, { color: colors.negative }]}>{negativeMonths}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Loss months</Text>
                  </TouchableOpacity>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <TouchableOpacity
                    style={styles.summaryItem}
                    activeOpacity={0.7}
                    onPress={() => bestMonth && handleSelectMonth(bestMonth.month)}
                  >
                    <Text style={[styles.summaryVal, { color: colors.positive }]}>
                      {bestMonth ? `${bestMonth.label} '${bestMonth.year.slice(2)}` : "—"}
                    </Text>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                      Best {bestMonth ? fmtPct(bestMonth.pnl) : ""}
                    </Text>
                    {bestMonth && <Feather name="chevron-up" size={10} color={colors.positive} style={{ marginTop: 1 }} />}
                  </TouchableOpacity>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <TouchableOpacity
                    style={styles.summaryItem}
                    activeOpacity={0.7}
                    onPress={() => worstMonth && handleSelectMonth(worstMonth.month)}
                  >
                    <Text style={[styles.summaryVal, { color: colors.negative }]}>
                      {worstMonth ? `${worstMonth.label} '${worstMonth.year.slice(2)}` : "—"}
                    </Text>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                      Worst {worstMonth ? fmtPct(worstMonth.pnl) : ""}
                    </Text>
                    {worstMonth && <Feather name="chevron-up" size={10} color={colors.negative} style={{ marginTop: 1 }} />}
                  </TouchableOpacity>
                </View>

                {/* Month detail panel */}
                {selectedBar && (
                  <MonthDetailPanel bar={selectedBar} onClose={() => setSelectedMonth(null)} />
                )}
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
  content: { paddingHorizontal: 16, gap: 14 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  loader: { marginTop: 60 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBlock: {
    width: "30%",
    flexGrow: 1,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    gap: 4,
  },
  statBlockTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  statSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },

  // Win rate breakdown
  progressTrack: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 16,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  progressLabelItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  progressLabelText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  // Chart
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
    gap: 10,
  },
  chartHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  chartSubtitle: {
    fontSize: 11,
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
  bar: { minHeight: 2 },
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
  selectedRing: {
    position: "absolute",
    right: 0,
    width: BAR_WIDTH + BAR_GAP,
    borderRadius: 8,
    borderWidth: 1.5,
    zIndex: 0,
  },

  // Summary row
  summaryRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    marginTop: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    gap: 2,
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

  // Detail panel
  detailPanel: {
    borderTopWidth: 1.5,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: "transparent",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  detailPnlPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  detailPnlText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailCell: {
    width: "30%",
    flexGrow: 1,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    gap: 4,
  },
  detailCellIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  detailCellVal: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  detailCellLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
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
