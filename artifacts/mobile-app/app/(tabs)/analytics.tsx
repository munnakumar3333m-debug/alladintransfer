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

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: performance, isLoading: perfLoading } = useGetPerformanceData();

  const isLoading = statsLoading || perfLoading;

  const maxPnl = performance
    ? Math.max(...performance.map((p) => Math.abs(p.avgPnl ?? 0)), 1)
    : 1;

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
      ) : (
        <>
          {stats && (
            <View style={styles.grid}>
              <StatBlock
                label="Total Trades"
                value={String(stats.totalRecommendations)}
                icon="bar-chart-2"
                colors={colors}
                accent
              />
              <StatBlock
                label="Win Rate"
                value={`${stats.winRate?.toFixed(1) ?? 0}%`}
                icon="trending-up"
                colors={colors}
                positive
              />
              <StatBlock
                label="Avg P&L"
                value={`${(stats.avgPnl ?? 0) >= 0 ? "+" : ""}${stats.avgPnl?.toFixed(2) ?? "0"}%`}
                icon="percent"
                colors={colors}
                positive={(stats.avgPnl ?? 0) >= 0}
                negative={(stats.avgPnl ?? 0) < 0}
              />
              <StatBlock
                label="Active"
                value={String(stats.activeCount ?? 0)}
                icon="activity"
                colors={colors}
              />
              <StatBlock
                label="Target Hit"
                value={String(stats.targetHitCount ?? 0)}
                icon="check-circle"
                colors={colors}
                positive
              />
              <StatBlock
                label="Stop Loss"
                value={String(stats.stopLossCount ?? 0)}
                icon="x-circle"
                colors={colors}
                negative
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Monthly Performance
            </Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Average P&L % per month
            </Text>

            {!performance || performance.length === 0 ? (
              <View style={[styles.empty, { borderColor: colors.border }]}>
                <Feather name="bar-chart" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Performance data will appear after the first month
                </Text>
              </View>
            ) : (
              <View style={[styles.chart, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {performance.slice(-12).map((p, i) => {
                  const pnl = p.avgPnl ?? 0;
                  const positive = pnl >= 0;
                  const barHeight = Math.max(4, (Math.abs(pnl) / maxPnl) * 80);
                  return (
                    <View key={i} style={styles.barGroup}>
                      <Text
                        style={[styles.barValue, { color: positive ? colors.positive : colors.negative }]}
                        numberOfLines={1}
                      >
                        {positive ? "+" : ""}{pnl.toFixed(1)}%
                      </Text>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: barHeight,
                              backgroundColor: positive ? colors.positive : colors.negative,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
                        {p.month?.slice(5) ?? ""}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatBlock({
  label,
  value,
  icon,
  colors,
  positive,
  negative,
  accent,
}: {
  label: string;
  value: string;
  icon: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  positive?: boolean;
  negative?: boolean;
  accent?: boolean;
}) {
  const valueColor = positive
    ? colors.positive
    : negative
      ? colors.negative
      : accent
        ? colors.primary
        : colors.foreground;

  return (
    <View
      style={[
        styles.statBlock,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: valueColor + "22" }]}>
        <Feather name={icon as "activity"} size={16} color={valueColor} />
      </View>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
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
  chart: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 4,
    minHeight: 160,
  },
  barGroup: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barValue: {
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  barContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  bar: {
    width: "80%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
