import { Feather } from "@expo/vector-icons";
import {
  useGetDashboardStats,
  useGetPerformanceData,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { CommunityModal } from "@/components/CommunityModal";

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

// ─── Pro: Grade helper ────────────────────────────────────────────────────────

function gradeFromWinRate(wr: number): { grade: string; color: string; label: string } {
  if (wr >= 70) return { grade: "A+", color: "#10B981", label: "Elite" };
  if (wr >= 60) return { grade: "A",  color: "#10B981", label: "Strong" };
  if (wr >= 50) return { grade: "B",  color: "#F59E0B", label: "Solid" };
  if (wr >= 40) return { grade: "C",  color: "#F97316", label: "Average" };
  return              { grade: "D",  color: "#EF4444", label: "Weak" };
}

function computeStreak(bars: MonthBar[]): { count: number; positive: boolean } {
  if (!bars.length) return { count: 0, positive: true };
  const rev = [...bars].reverse();
  const positive = (rev[0]?.pnl ?? 0) >= 0;
  let count = 0;
  for (const b of rev) {
    if ((b.pnl >= 0) === positive) count++;
    else break;
  }
  return { count, positive };
}

// ─── Pro: Signal Accuracy Card ───────────────────────────────────────────────

function SignalAccuracyCard({ winRate, wins, losses }: { winRate: number; wins: number; losses: number }) {
  const colors = useColors();
  const { grade, color, label } = gradeFromWinRate(winRate);

  return (
    <View style={[proStyles.accuracyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header badge */}
      <View style={proStyles.accuracyHeader}>
        <View style={[proStyles.liveDot, { backgroundColor: color }]} />
        <Text style={[proStyles.accuracyHeaderText, { color: colors.mutedForeground }]}>SIGNAL ACCURACY</Text>
        <View style={proStyles.headerSpacer} />
        <Feather name="shield" size={13} color={color} />
        <Text style={[proStyles.proTag, { color: color, borderColor: color + "50", backgroundColor: color + "12" }]}>{"PRO"}</Text>
      </View>

      {/* Ring + stats */}
      <View style={proStyles.accuracyBody}>
        {/* Outer glow ring */}
        <View style={[proStyles.ringOuter, { borderColor: color + "22" }]}>
          <View style={[proStyles.ringInner, { borderColor: color }]}>
            <Text style={[proStyles.ringValue, { color }]}>{winRate.toFixed(1)}%</Text>
            <Text style={[proStyles.ringLabel, { color: colors.mutedForeground }]}>win rate</Text>
          </View>
        </View>

        {/* Right side */}
        <View style={proStyles.accuracyRight}>
          <View style={[proStyles.gradeBadge, { backgroundColor: color + "15", borderColor: color + "40" }]}>
            <Text style={[proStyles.gradeText, { color }]}>{grade}</Text>
            <Text style={[proStyles.gradeSub, { color }]}>{label}</Text>
          </View>

          {[
            { icon: "check-circle" as const, label: `${wins} wins`,   color: colors.positive },
            { icon: "x-circle"     as const, label: `${losses} losses`, color: colors.negative },
            { icon: "layers"       as const, label: `${wins + losses} total`, color: colors.mutedForeground },
          ].map((r) => (
            <View key={r.label} style={proStyles.accuracyStatRow}>
              <Feather name={r.icon} size={12} color={r.color} />
              <Text style={[proStyles.accuracyStatText, { color: colors.foreground }]}>{r.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Pro: Performance Scorecard ──────────────────────────────────────────────

function PerformanceScorecard({ bars, winRate }: { bars: MonthBar[]; winRate: number }) {
  const colors = useColors();
  const { grade, color } = gradeFromWinRate(winRate);
  const streak = computeStreak(bars);
  const consistency = bars.length ? (bars.filter((b) => b.pnl > 0).length / bars.length) * 100 : 0;
  const streakColor = streak.positive ? colors.positive : colors.negative;
  const consistencyColor = consistency >= 60 ? colors.positive : consistency >= 40 ? "#F59E0B" : colors.negative;

  const cells = [
    {
      icon: "star"       as const,
      label: "Grade",
      val: grade,
      sub: gradeFromWinRate(winRate).label,
      color,
    },
    {
      icon: (streak.positive ? "trending-up" : "trending-down") as const,
      label: streak.positive ? "Win Streak" : "Loss Streak",
      val: `${streak.count}mo`,
      sub: "consecutive",
      color: streakColor,
    },
    {
      icon: "shield" as const,
      label: "Consistency",
      val: `${consistency.toFixed(0)}%`,
      sub: "profit months",
      color: consistencyColor,
    },
  ];

  return (
    <View style={proStyles.scorecardRow}>
      {cells.map((c) => (
        <View key={c.label} style={[proStyles.scorecardCell, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[proStyles.scorecardIcon, { backgroundColor: c.color + "18" }]}>
            <Feather name={c.icon} size={13} color={c.color} />
          </View>
          <Text style={[proStyles.scorecardVal, { color: c.color }]}>{c.val}</Text>
          <Text style={[proStyles.scorecardLabel, { color: colors.foreground }]}>{c.label}</Text>
          <Text style={[proStyles.scorecardSub, { color: colors.mutedForeground }]}>{c.sub}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Pro: Insights Strip ─────────────────────────────────────────────────────

function InsightsStrip({ bars, avgPnl, bestMonth }: { bars: MonthBar[]; avgPnl: number; bestMonth: MonthBar | null }) {
  const colors = useColors();
  const compound = bars.reduce((acc, b) => acc * (1 + b.pnl / 100), 1) - 1;
  const compoundPct = compound * 100;

  const items = [
    { icon: "database"     as const, text: `${bars.length} months of data`,  color: colors.primary },
    ...(bestMonth ? [{ icon: "award" as const, text: `Best: ${bestMonth.label} '${bestMonth.year.slice(2)} at ${fmtPct(bestMonth.pnl)}`, color: colors.positive }] : []),
    { icon: "percent"      as const, text: `Avg ${fmtPct(avgPnl)} / month`,  color: avgPnl >= 0 ? colors.positive : colors.negative },
    { icon: "activity"     as const, text: `Compounded: ${fmtPct(compoundPct)}`, color: compoundPct >= 0 ? colors.positive : colors.negative },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={proStyles.insightsScroll}
    >
      {items.map((ins, i) => (
        <View key={i} style={[proStyles.insightChip, { backgroundColor: ins.color + "14", borderColor: ins.color + "35" }]}>
          <Feather name={ins.icon} size={11} color={ins.color} />
          <Text style={[proStyles.insightText, { color: ins.color }]}>{ins.text}</Text>
        </View>
      ))}
    </ScrollView>
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
  const [chatOpen, setChatOpen] = useState(false);

  const isLoading = statsLoading || perfLoading;
  const hasError = statsError || perfError;

  const { bars, maxAbs, bestMonth, worstMonth, avgPnl, positiveMonths, negativeMonths, totalWins, totalLosses } = useMemo(() => {
    const months = performance?.months ?? [];
    if (!months.length) return { bars: [], maxAbs: 1, bestMonth: null, worstMonth: null, avgPnl: 0, positiveMonths: 0, negativeMonths: 0, totalWins: 0, totalLosses: 0 };

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
    const totalWins   = bars.reduce((s, b) => s + b.wins, 0);
    const totalLosses = bars.reduce((s, b) => s + b.losses, 0);

    return {
      bars,
      maxAbs,
      bestMonth: sorted[0] ?? null,
      worstMonth: sorted[sorted.length - 1] ?? null,
      avgPnl,
      positiveMonths: bars.filter((b) => b.pnl > 0).length,
      negativeMonths: bars.filter((b) => b.pnl < 0).length,
      totalWins,
      totalLosses,
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
    <View style={styles.flex}>
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

          {/* ── PRO: Signal Accuracy Card ───────────────────────── */}
          {stats && bars.length > 0 && (
            <SignalAccuracyCard
              winRate={stats.winRate ?? 0}
              wins={totalWins}
              losses={totalLosses}
            />
          )}

          {/* ── PRO: Performance Scorecard ──────────────────────── */}
          {bars.length > 0 && (
            <PerformanceScorecard bars={bars} winRate={stats?.winRate ?? 0} />
          )}

          {/* ── PRO: Insights Strip ─────────────────────────────── */}
          {bars.length > 0 && (
            <InsightsStrip bars={bars} avgPnl={avgPnl} bestMonth={bestMonth} />
          )}

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

      {/* Floating Community Chat Button */}
      <TouchableOpacity
        onPress={() => setChatOpen(true)}
        style={[styles.fab, { bottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100 }]}
        activeOpacity={0.85}
      >
        <Feather name="message-circle" size={16} color="#fff" />
      </TouchableOpacity>

      <CommunityModal visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fab: {
    position: "absolute",
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
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

// ─── Pro Styles ───────────────────────────────────────────────────────────────

const proStyles = StyleSheet.create({
  // Signal Accuracy Card
  accuracyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  accuracyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  headerSpacer: {
    flex: 1,
  },
  accuracyHeaderText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  proTag: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 6,
  },
  accuracyBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  ringOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  ringLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  accuracyRight: {
    flex: 1,
    gap: 10,
  },
  gradeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  gradeText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  gradeSub: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  accuracyStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  accuracyStatText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },

  // Performance Scorecard
  scorecardRow: {
    flexDirection: "row",
    gap: 8,
  },
  scorecardCell: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    gap: 4,
  },
  scorecardIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  scorecardVal: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  scorecardLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  scorecardSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },

  // Insights Strip
  insightsScroll: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  insightChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  insightText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
