import { Feather } from "@expo/vector-icons";
import {
  useGetDashboardStats,
  useGetPerformanceData,
} from "@workspace/api-client-react";
import React from "react";
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

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: stats, isLoading: statsLoading, isError: statsError } = useGetDashboardStats();
  const { data: performance, isLoading: perfLoading, isError: perfError } = useGetPerformanceData();

  const isLoading = statsLoading || perfLoading;
  const hasError = statsError || perfError;

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
        <View style={[styles.empty, { borderColor: colors.border }]}>
          <Feather name="alert-triangle" size={36} color={colors.negative} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Analytics are temporarily unavailable</Text>
        </View>
      ) : (
        <>
          {stats ? (
            <View style={styles.grid}>
              <View style={[styles.statBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIcon, { backgroundColor: colors.primary + "22" }]}>
                  <Feather name="bar-chart-2" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.statValue, { color: colors.primary }]}>{String(stats.totalTrades ?? 0)}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Trades</Text>
              </View>
              <View style={[styles.statBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIcon, { backgroundColor: colors.positive + "22" }]}>
                  <Feather name="trending-up" size={16} color={colors.positive} />
                </View>
                <Text style={[styles.statValue, { color: colors.positive }]}>{`${stats.winRate?.toFixed(1) ?? 0}%`}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Win Rate</Text>
              </View>
              <View style={[styles.statBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View
                  style={[
                    styles.statIcon,
                    {
                      backgroundColor:
                        (stats.monthlyProfitPercent ?? 0) >= 0 ? colors.positive + "22" : colors.negative + "22",
                    },
                  ]}
                >
                  <Feather
                    name="percent"
                    size={16}
                    color={(stats.monthlyProfitPercent ?? 0) >= 0 ? colors.positive : colors.negative}
                  />
                </View>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color:
                        (stats.monthlyProfitPercent ?? 0) >= 0 ? colors.positive : colors.negative,
                    },
                  ]}
                >
                  {`${(stats.monthlyProfitPercent ?? 0) >= 0 ? "+" : ""}${stats.monthlyProfitPercent?.toFixed(2) ?? "0"}%`}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Avg P&amp;L</Text>
              </View>
              <View style={[styles.statBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIcon, { backgroundColor: colors.primary + "22" }]}>
                  <Feather name="activity" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.statValue, { color: colors.primary }]}>{String(stats.todayRecommendationsCount ?? 0)}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active</Text>
              </View>
              <View style={[styles.statBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIcon, { backgroundColor: colors.warning + "22" }]}>
                  <Feather name="clock" size={16} color={colors.warning} />
                </View>
                <Text style={[styles.statValue, { color: colors.warning }]}>{String(stats.trialDaysRemaining ?? 0)}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Trial</Text>
              </View>
              <View style={[styles.statBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIcon, { backgroundColor: colors.positive + "22" }]}>
                  <Feather name="award" size={16} color={colors.positive} />
                </View>
                <Text style={[styles.statValue, { color: colors.positive }]}>{String(stats.premiumDaysRemaining ?? 0)}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Premium</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Monthly Performance</Text>
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="bar-chart" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Performance chart is temporarily unavailable.</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },
  loader: {
    marginTop: 60,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
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
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  empty: {
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
