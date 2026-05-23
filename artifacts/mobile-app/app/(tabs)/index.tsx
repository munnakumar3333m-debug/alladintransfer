import { Feather } from "@expo/vector-icons";
import {
  useGetDashboardStats,
  useGetMe,
  useGetSkipToday,
  useGetSubscriptionStatus,
  useGetTodayRecommendations,
  useGetTodayQuote,
  useSkipToday,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecommendationCard } from "@/components/RecommendationCard";
import { useColors } from "@/hooks/useColors";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getISTHour(): number {
  return parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
    10,
  );
}

function getGreeting() {
  const h = getISTHour();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type MarketState = "open" | "closed" | "weekend" | "pre-market";

function getISTDateParts(): { day: number; mins: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const day = weekdayMap[get("weekday")] ?? 0;
  const h = parseInt(get("hour"), 10);
  const m = parseInt(get("minute"), 10);
  return { day, mins: h * 60 + m };
}

function getMarketStatus(): { open: boolean; label: string; next: string; status: MarketState } {
  const { day, mins } = getISTDateParts();
  const isWeekend = day === 0 || day === 6;
  const isOpen = !isWeekend && mins >= 555 && mins < 930; // 9:15 – 15:30

  let status: MarketState = "open";
  if (isWeekend) status = "weekend";
  else if (!isOpen && mins < 555) status = "pre-market";
  else if (!isOpen) status = "closed";

  const label = isWeekend
    ? "Weekend"
    : isOpen
      ? "Market Open"
      : mins < 555
        ? "Preparing Signals"
        : "Market Closed";
  const next = isOpen
    ? "Closes 3:30 PM IST"
    : isWeekend
      ? "Signals Monday 9 AM"
      : mins < 555
        ? "Signals Before 9:00 AM"
        : "Signals Tomorrow 9 AM";
  return { open: isOpen, label, next, status };
}

// ─── Market Status Banner ─────────────────────────────────────────────────────

function MarketStatusBanner({ status }: { status: MarketState }) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status !== "open") return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [status, pulse]);

  if (status === "open") {
    return (
      <View style={[mcStyles.banner, mcStyles.openBanner]}>
        {/* Pulsing dot */}
        <View style={mcStyles.openIconWrap}>
          <Animated.View style={[mcStyles.openPulseRing, { transform: [{ scale: pulse }] }]} />
          <View style={mcStyles.openIconBox}>
            <Feather name="zap" size={20} color="#fff" />
          </View>
        </View>
        <View style={mcStyles.textBlock}>
          <View style={mcStyles.titleRow}>
            <Text style={[mcStyles.title, { color: "#fff" }]}>Execute Your Trades Now!</Text>
            <View style={mcStyles.openChip}>
              <View style={mcStyles.openChipDot} />
              <Text style={mcStyles.openChipText}>LIVE</Text>
            </View>
          </View>
          <Text style={[mcStyles.body, { color: "rgba(255,255,255,0.75)" }]}>
            Market is open — enter at exact opening price via Limit or Market order and chill till 2% TP or end of the day (EOD).
          </Text>
        </View>
      </View>
    );
  }

  const config = {
    closed: {
      icon: "moon" as const,
      iconColor: "#F59E0B",
      bg: "#F59E0B",
      title: "Market Closed for Today",
      body: "NSE & BSE have wrapped up for the day. Fresh intraday signals for tomorrow will be posted before 9:00 AM IST.",
      chip: "Signals Tomorrow by 9 AM",
    },
    weekend: {
      icon: "sun" as const,
      iconColor: "#818CF8",
      bg: "#818CF8",
      title: "Enjoy the Weekend! 🎉",
      body: "Markets are closed — take a well-deserved break. We'll be back with high-quality Monday picks before 9:00 AM IST.",
      chip: "Signals on Monday",
    },
    "pre-market": {
      icon: "zap" as const,
      iconColor: "#10B981",
      bg: "#10B981",
      title: "Preparing Today's Signals",
      body: "Our analysts are curating high-quality intraday tips for today. Signals will be posted before 9:00 AM IST — check back soon!",
      chip: "Dropping Before 9:00 AM",
    },
  }[status];

  return (
    <View style={[mcStyles.banner, { backgroundColor: config.bg + "15", borderColor: config.bg + "40" }]}>
      <View style={[mcStyles.iconBox, { backgroundColor: config.bg + "25" }]}>
        <Feather name={config.icon} size={20} color={config.iconColor} />
      </View>
      <View style={mcStyles.textBlock}>
        <View style={mcStyles.titleRow}>
          <Text style={[mcStyles.title, { color: colors.foreground }]}>{config.title}</Text>
          <View style={[mcStyles.chip, { backgroundColor: config.bg + "22", borderColor: config.bg + "55" }]}>
            <Feather name="clock" size={9} color={config.iconColor} />
            <Text style={[mcStyles.chipText, { color: config.iconColor }]}>{config.chip}</Text>
          </View>
        </View>
        <Text style={[mcStyles.body, { color: colors.mutedForeground }]}>{config.body}</Text>
      </View>
    </View>
  );
}

const mcStyles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  textBlock: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  body: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  openBanner: {
    backgroundColor: "#059669",
    borderColor: "#10B981",
  },
  openIconWrap: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  openPulseRing: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(16,185,129,0.35)",
  },
  openIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  openChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  openChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  openChipText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.8,
  },
});

// ─── Traders Online Widget ────────────────────────────────────────────────────

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function naturalNext(current: number): number {
  const delta = randomBetween(30, 150) * (Math.random() > 0.45 ? 1 : -1);
  return Math.max(200, Math.min(3000, current + delta));
}

function TradersOnlineWidget({ bottomOffset }: { bottomOffset: number }) {
  const [count, setCount] = useState(() => randomBetween(800, 2200));
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const tick = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start(() => {
      setCount((prev) => naturalNext(prev));
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    });
  }, [fadeAnim]);

  useEffect(() => {
    const schedule = (): ReturnType<typeof setTimeout> => setTimeout(() => { tick(); schedule(); }, randomBetween(5000, 10000));
    const id = schedule();
    return () => clearTimeout(id);
  }, [tick]);

  return (
    <View style={[styles.widget, { bottom: bottomOffset }]} pointerEvents="none">
      <Animated.View style={[styles.widgetInner, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
        <Text style={styles.widgetText} numberOfLines={1}>
          {count.toLocaleString("en-IN")} traders online
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: user } = useGetMe();
  const { data: todayRecs, isLoading: recsLoading, refetch: refetchRecs } = useGetTodayRecommendations();
  const { data: stats, refetch: refetchStats } = useGetDashboardStats();
  const { data: sub } = useGetSubscriptionStatus();
  const { data: quote, refetch: refetchQuote } = useGetTodayQuote();
  const { data: skipStatus, refetch: refetchSkip } = useGetSkipToday();
  const { mutate: toggleSkip, isPending: skipPending } = useSkipToday();

  const isSkipped = skipStatus?.skipped ?? false;

  const handleSkip = () => {
    toggleSkip(undefined, { onSuccess: () => refetchSkip() });
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchRecs(), refetchStats(), refetchQuote()]);
    setIsRefreshing(false);
  };

  const market = getMarketStatus();
  const firstName = user?.name?.split(" ")[0] ?? "Trader";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const daysLeft = sub?.daysRemaining ?? 0;
  const widgetBottom = (Platform.OS === "web" ? 34 : insets.bottom) + 68;

  // Today's picks with outcomes updated by admin
  const closedTodayRecs = (todayRecs ?? []).filter((r) => r.pnlPercent != null);
  const todayWins = closedTodayRecs.filter((r) => Number(r.pnlPercent) > 0).length;
  const todayWinRate = closedTodayRecs.length > 0 ? (todayWins / closedTodayRecs.length) * 100 : 0;
  const todayAvgPnl =
    closedTodayRecs.length > 0
      ? closedTodayRecs.reduce((s, r) => s + Number(r.pnlPercent), 0) / closedTodayRecs.length
      : 0;

  // Show today's results only after market close (3:30–11:59 PM IST) and only if outcomes exist
  const showTodayStats = market.status === "closed" && closedTodayRecs.length > 0;
  const pnlPositive = todayAvgPnl >= 0;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
            paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >

        {/* ── App Header ─────────────────────────────────────────── */}
        <View style={styles.appHeader}>
          <View style={styles.appHeaderLeft}>
            <View style={[styles.appLogoBox, { backgroundColor: colors.primary }]}>
              <Feather name="trending-up" size={16} color={colors.primaryForeground} />
            </View>
            <View>
              <Text style={[styles.appName, { color: colors.foreground }]}>Alladin V1.0</Text>
              <Text style={[styles.appTagline, { color: colors.primary }]}>Powered by Blackrock India</Text>
            </View>
          </View>
          <View style={styles.appHeaderRight}>
            <View style={[styles.marketPill, { backgroundColor: market.open ? colors.positive + "18" : colors.border + "80", borderColor: market.open ? colors.positive + "40" : colors.border }]}>
              <View style={[styles.marketDot, { backgroundColor: market.open ? colors.positive : colors.mutedForeground }]} />
              <Text style={[styles.marketPillText, { color: market.open ? colors.positive : colors.mutedForeground }]}>
                {market.label}
              </Text>
            </View>
            <TouchableOpacity style={[styles.avatarBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                {(user?.name ?? "?")[0].toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Greeting card (+ inline quote if posted) ───────────── */}
        <View style={[styles.greetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.greetLeft}>
            <Text style={[styles.greetText, { color: colors.mutedForeground }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.greetName, { color: colors.foreground }]}>{firstName} 👋</Text>
            <View style={styles.greetMeta}>
              <Feather name="calendar" size={11} color={colors.mutedForeground} />
              <Text style={[styles.greetDate, { color: colors.mutedForeground }]}>{today}</Text>
            </View>
          </View>
          {quote && (
            <View style={[styles.greetQuote, { borderLeftColor: colors.border }]}>
              <Text style={[styles.greetQuoteOpenMark, { color: colors.primary }]}>"</Text>
              <Text style={[styles.greetQuoteText, { color: colors.mutedForeground }]}>{quote.quote}</Text>
              {quote.author ? (
                <Text style={[styles.greetQuoteAuthor, { color: colors.primary }]}>— {quote.author}</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* ── Market status banner ────────────────────────────────── */}
        <MarketStatusBanner status={market.status} />

        {/* ── Today's results (visible 3:30–11:59 PM IST, only once outcomes are set) */}
        {showTodayStats && (
          <View>
            <View style={styles.resultsSectionHeader}>
              <View style={[styles.resultsDot, { backgroundColor: colors.positive }]} />
              <Text style={[styles.resultsSectionTitle, { color: colors.foreground }]}>
                {"Today's Results"}
              </Text>
              <View style={[styles.resultsChip, { backgroundColor: colors.positive + "18", borderColor: colors.positive + "40" }]}>
                <Text style={[styles.resultsChipText, { color: colors.positive }]}>
                  {closedTodayRecs.length}/{todayRecs?.length ?? 0} settled
                </Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              {/* Win Rate */}
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIconBox, { backgroundColor: colors.positive + "20" }]}>
                  <Feather name="target" size={14} color={colors.positive} />
                </View>
                <Text style={[styles.statVal, { color: colors.positive }]}>
                  {todayWinRate.toFixed(1)}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Win Rate</Text>
              </View>

              {/* Total picks */}
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIconBox, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name="bar-chart-2" size={14} color={colors.primary} />
                </View>
                <Text style={[styles.statVal, { color: colors.primary }]}>
                  {closedTodayRecs.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Picks</Text>
              </View>

              {/* Avg P&L */}
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIconBox, { backgroundColor: (pnlPositive ? colors.positive : colors.negative) + "20" }]}>
                  <Feather name="percent" size={14} color={pnlPositive ? colors.positive : colors.negative} />
                </View>
                <Text style={[styles.statVal, { color: pnlPositive ? colors.positive : colors.negative }]}>
                  {pnlPositive ? "+" : ""}{todayAvgPnl.toFixed(1)}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Avg P&L</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Today's picks ───────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={[styles.picksHeader, { borderColor: colors.border }]}>
            <View style={styles.picksHeaderLeft}>
              <View style={[styles.picksDot, { backgroundColor: market.open ? colors.positive : colors.mutedForeground }]} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {"Today's Picks"}
              </Text>
              {todayRecs && todayRecs.length > 0 && (
                <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.countText, { color: colors.primaryForeground }]}>
                    {todayRecs.length}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.picksHeaderRight}>
              <TouchableOpacity
                style={[
                  styles.skipBtn,
                  isSkipped
                    ? { backgroundColor: "#EF444420", borderColor: "#EF4444" }
                    : { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={handleSkip}
                disabled={skipPending}
              >
                <Feather
                  name={isSkipped ? "x-circle" : "skip-forward"}
                  size={12}
                  color={isSkipped ? "#EF4444" : colors.mutedForeground}
                />
                <Text style={[styles.skipBtnText, { color: isSkipped ? "#EF4444" : colors.mutedForeground }]}>
                  {isSkipped ? "Unskip" : "Skip Today"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {isSkipped && (
            <View style={[styles.skipBanner, { backgroundColor: "#EF444415", borderColor: "#EF444440" }]}>
              <Feather name="moon" size={14} color="#EF4444" />
              <Text style={styles.skipBannerText}>You've skipped trading today. Stay disciplined!</Text>
            </View>
          )}

          {recsLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : todayRecs && todayRecs.length > 0 ? (
            <View style={styles.picksList}>
              {todayRecs.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  onPress={() => router.push(`/recommendation/${rec.id}`)}
                />
              ))}
            </View>
          ) : (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.emptyIconBox, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="bar-chart-2" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No picks today yet
              </Text>
              <View style={styles.executionRows}>
                <View style={styles.executionRow}>
                  <View style={[styles.executionBullet, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.executionText, { color: colors.mutedForeground }]}>
                    <Text style={[styles.executionBold, { color: colors.foreground }]}>Signals posted</Text>
                    {" before 9:00 AM IST every trading day"}
                  </Text>
                </View>
                <View style={styles.executionRow}>
                  <View style={[styles.executionBullet, { backgroundColor: colors.positive }]} />
                  <Text style={[styles.executionText, { color: colors.mutedForeground }]}>
                    <Text style={[styles.executionBold, { color: colors.foreground }]}>Entry at 9:15 AM</Text>
                    {" — opening price via Market or Limit order"}
                  </Text>
                </View>
                <View style={styles.executionRow}>
                  <View style={[styles.executionBullet, { backgroundColor: colors.negative }]} />
                  <Text style={[styles.executionText, { color: colors.mutedForeground }]}>
                    <Text style={[styles.executionBold, { color: colors.foreground }]}>Exit by 3:15 PM IST</Text>
                    {" — EOD square-off or on Target hit (whichever is first)"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <TradersOnlineWidget bottomOffset={widgetBottom} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },

  // App header
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  appHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  appLogoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 20,
  },
  appTagline: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
    lineHeight: 13,
  },
  appHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  marketPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  marketDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  marketPillText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },

  // Greeting card
  greetCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  greetLeft: {
    gap: 2,
  },
  greetText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  greetName: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  greetMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  greetDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  greetQuote: {
    flex: 1,
    paddingLeft: 12,
    borderLeftWidth: 1,
    gap: 3,
  },
  greetQuoteOpenMark: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    lineHeight: 18,
  },
  greetQuoteText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
    fontStyle: "italic",
  },
  greetQuoteAuthor: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },

  // Execution guidelines card
  executionCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  executionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  executionIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  executionTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  executionRows: {
    gap: 7,
    alignSelf: "stretch",
  },
  executionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  executionBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 5,
    flexShrink: 0,
  },
  executionText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    flex: 1,
  },
  executionBold: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },

  // Stats
  resultsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  resultsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultsSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  resultsChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  resultsChipText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    gap: 5,
  },
  statIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statVal: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },

  // Quote
  quoteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  quoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 4,
  },
  quoteIconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  quoteTag: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  quoteOpenMark: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    lineHeight: 32,
    marginBottom: -4,
    opacity: 0.35,
  },
  quoteText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    fontStyle: "italic",
  },
  quoteAuthor: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },

  // Picks section
  section: { gap: 0 },
  picksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  picksHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  picksHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  skipBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  skipBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  skipBannerText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  picksDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  historyBtnText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  picksList: {
    gap: 0,
  },
  loader: { marginTop: 40 },

  // Empty
  empty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 18,
    borderWidth: 1,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  emptyBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },

  // Widget
  widget: {
    position: "absolute",
    right: 12,
    alignItems: "flex-end",
  },
  widgetInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(10, 14, 20, 0.82)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  widgetText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
