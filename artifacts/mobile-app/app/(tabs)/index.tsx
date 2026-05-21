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

function buildLabel(n: string) {
  return `Active Traders ${n}`;
}

function TradersOnlineWidget({ bottomOffset }: { bottomOffset: number }) {
  const [count, setCount] = useState(() => randomBetween(800, 2200));
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Dot pulse loop
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

  // Count update: quick fade out → swap → fade in
  const tick = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start(() => {
      setCount((prev) => naturalNext(prev));
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    });
  }, [fadeAnim]);

  useEffect(() => {
    const schedule = (): ReturnType<typeof setTimeout> => {
      return setTimeout(() => {
        tick();
        schedule();
      }, randomBetween(5000, 10000));
    };
    const id = schedule();
    return () => clearTimeout(id);
  }, [tick]);

  return (
    <View style={[styles.widget, { bottom: bottomOffset }]} pointerEvents="none">
      <Animated.View style={[styles.widgetInner, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
        <Text style={styles.widgetText} numberOfLines={1}>
          {buildLabel(formatCount(count))}
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
