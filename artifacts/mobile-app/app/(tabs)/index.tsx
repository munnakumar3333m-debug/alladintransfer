import { Feather } from "@expo/vector-icons";
import {
  useGetDashboardStats,
  useGetMe,
  useGetSubscriptionStatus,
  useGetTodayRecommendations,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
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

  const daysLeft = sub?.daysLeft ?? 0;

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
            Good {getGreeting()}, {user?.name?.split(" ")[0] ?? "Trader"}
          </Text>
          <Text style={[styles.date, { color: colors.foreground }]}>{today}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
            {(user?.name ?? "?")[0].toUpperCase()}
          </Text>
        </View>
      </View>

      {sub && (sub.type === "trial" || sub.type === "expired") && (
        <SubscriptionBanner
          type={sub.type === "expired" ? "expired" : "trial"}
          daysLeft={daysLeft > 0 ? daysLeft : undefined}
        />
      )}

      {stats && (
        <View style={styles.statsRow}>
          <StatsCard
            label="Total Picks"
            value={stats.totalRecommendations}
            accent
          />
          <StatsCard
            label="Win Rate"
            value={`${stats.winRate?.toFixed(1) ?? 0}%`}
            positive
          />
          <StatsCard
            label="Avg P&L"
            value={`${stats.avgPnl && stats.avgPnl >= 0 ? "+" : ""}${stats.avgPnl?.toFixed(1) ?? 0}%`}
            positive={!!stats.avgPnl && stats.avgPnl >= 0}
            negative={!!stats.avgPnl && stats.avgPnl < 0}
          />
        </View>
      )}

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
              Check back later. New recommendations are posted every morning.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
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
});
