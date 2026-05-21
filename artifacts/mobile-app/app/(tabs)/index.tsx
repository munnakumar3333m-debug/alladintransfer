import { Feather } from "@expo/vector-icons";
import {
  useGetDashboardStats,
  useGetMe,
  useGetSubscriptionStatus,
  useGetTodayRecommendations,
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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecommendationCard } from "@/components/RecommendationCard";
import { StatsCard } from "@/components/StatsCard";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { useColors } from "@/hooks/useColors";

// ─── Traders Online Widget ──────────────────────────────────────────────────

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function naturalNext(current: number): number {
  // Small realistic delta: ±30–150, biased slightly upward during "market hours"
  const delta = randomBetween(30, 150) * (Math.random() > 0.45 ? 1 : -1);
  const next = current + delta;
  return Math.max(200, Math.min(3000, next));
}

function formatCount(n: number) {
  return n.toLocaleString("en-IN");
}

const LABELS = [
  (n: string) => `🔥 ${n} Traders Online`,
  (n: string) => `${n} Traders Active`,
  (n: string) => `🔥 ${n} Traders Online`,
  (n: string) => `${n} Live Traders`,
];

function TradersOnlineWidget({ bottomOffset }: { bottomOffset: number }) {
  const [count, setCount] = useState(() => randomBetween(800, 2200));
  const [labelIdx, setLabelIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Blinking/pulse loop for the live dot
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 700, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Count update with fade+slide transition
  const tick = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: -6, duration: 180, useNativeDriver: false }),
    ]).start(() => {
      setCount((prev) => naturalNext(prev));
      setLabelIdx((prev) => (Math.random() > 0.7 ? (prev + 1) % LABELS.length : prev));
      slideAnim.setValue(6);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: false }),
        Animated.timing(slideAnim, { toValue: 0, duration: 240, useNativeDriver: false }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const schedule = () => {
      const delay = randomBetween(5000, 10000);
      return setTimeout(() => {
        tick();
        const id = schedule();
        return id;
      }, delay);
    };
    const id = schedule();
    return () => clearTimeout(id);
  }, [tick]);

  return (
    <View
      style={[
        styles.widget,
        { bottom: bottomOffset },
      ]}
      pointerEvents="none"
    >
      {/* Green glow ring */}
      <View style={styles.glowRing} />

      <Animated.View
        style={[
          styles.widgetInner,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Live dot */}
        <View style={styles.dotWrapper}>
          <View style={styles.dotBase} />
          <Animated.View style={[styles.dotPulse, { opacity: pulseAnim }]} />
        </View>

        <Text style={styles.widgetText} numberOfLines={1}>
          {LABELS[labelIdx](formatCount(count))}
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

  const isRefreshing = false;
  const onRefresh = async () => {
    await Promise.all([refetchRecs(), refetchStats()]);
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const daysLeft = sub?.daysRemaining ?? 0;

  // Widget sits just above tab bar
  const widgetBottom = (Platform.OS === "web" ? 34 : insets.bottom) + 68;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
            paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {"Good "}
              {getGreeting()}
              {", "}
              {user?.name?.split(" ")[0] ?? "Trader"}
            </Text>
            <Text style={[styles.date, { color: colors.foreground }]}>{today}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
              {(user?.name ?? "?")[0].toUpperCase()}
            </Text>
          </View>
        </View>

        {sub && (sub.subscriptionType === "trial" || sub.subscriptionType === "expired") && (
          <SubscriptionBanner
            type={sub.subscriptionType === "expired" ? "expired" : "trial"}
            daysLeft={daysLeft > 0 ? daysLeft : undefined}
          />
        )}

        {stats ? (
          <View style={styles.statsRow}>
            <StatsCard
              label="Total Picks"
              value={stats.totalTrades}
              accent
            />
            <StatsCard
              label="Win Rate"
              value={`${stats.winRate?.toFixed(1) ?? 0}%`}
              positive
            />
            <StatsCard
              label="Avg P&L"
              value={`${stats.monthlyProfitPercent && stats.monthlyProfitPercent >= 0 ? "+" : ""}${stats.monthlyProfitPercent?.toFixed(1) ?? 0}%`}
              positive={!!stats.monthlyProfitPercent && stats.monthlyProfitPercent >= 0}
              negative={!!stats.monthlyProfitPercent && stats.monthlyProfitPercent < 0}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Today's Intraday Picks
            </Text>
            {todayRecs && todayRecs.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.countText, { color: colors.primaryForeground }]}>
                  {todayRecs.length}
                </Text>
              </View>
            )}
          </View>

          {recsLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : todayRecs && todayRecs.length > 0 ? (
            todayRecs.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onPress={() => router.push(`/recommendation/${rec.id}`)}
              />
            ))
          ) : (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="bar-chart-2" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No picks today
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {"Check back later. New recommendations are posted every morning."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TradersOnlineWidget bottomOffset={widgetBottom} />
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  date: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  section: {
    gap: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  countBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  // ── Widget ──────────────────────────────────────────────────────────────────
  widget: {
    position: "absolute",
    right: 14,
    alignItems: "flex-end",
  },
  glowRing: {
    position: "absolute",
    inset: -4,
    borderRadius: 24,
    // green glow via shadow
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: "transparent",
  },
  widgetInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(13, 17, 23, 0.88)",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
    // fallback shadow
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dotWrapper: {
    width: 9,
    height: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  dotBase: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#10b981",
    position: "absolute",
  },
  dotPulse: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#10b981",
    position: "absolute",
  },
  widgetText: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
});
