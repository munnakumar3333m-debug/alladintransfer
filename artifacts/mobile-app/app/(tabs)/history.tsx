import { Feather } from "@expo/vector-icons";
import { useListRecommendations } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecommendationCard } from "@/components/RecommendationCard";
import { useColors } from "@/hooks/useColors";

type Filter = "all" | "intraday" | "swing" | "positional";
type StatusFilter = "all" | "active" | "target_hit" | "stop_loss_hit";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "intraday", label: "Intraday" },
  { key: "swing", label: "Swing" },
  { key: "positional", label: "Positional" },
];

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tradeFilter, setTradeFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useListRecommendations({
    tradeType: tradeFilter === "all" ? undefined : tradeFilter,
    page,
    limit: 20,
  });

  const recs = data?.data ?? [];

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>History</Text>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    tradeFilter === f.key ? colors.primary : colors.card,
                  borderColor:
                    tradeFilter === f.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setTradeFilter(f.key);
                setPage(1);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      tradeFilter === f.key
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                  },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator
          color={colors.primary}
          style={styles.loader}
          size="large"
        />
      ) : (
        <FlatList
          data={recs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <RecommendationCard
              rec={item}
              onPress={() => router.push(`/recommendation/${item.id}`)}
            />
          )}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom:
                (Platform.OS === "web" ? 34 : insets.bottom) + 100,
            },
          ]}
          ListEmptyComponent={
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather
                name="inbox"
                size={36}
                color={colors.mutedForeground}
              />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No recommendations
              </Text>
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                Recommendations will appear here once they're posted.
              </Text>
            </View>
          }
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}

      {data && data.total > 20 && (
        <View
          style={[styles.pagination, { borderTopColor: colors.border, backgroundColor: colors.background }]}
        >
          <TouchableOpacity
            disabled={page === 1}
            onPress={() => setPage((p) => p - 1)}
            style={[styles.pageBtn, { opacity: page === 1 ? 0.4 : 1 }]}
          >
            <Feather name="chevron-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.pageText, { color: colors.mutedForeground }]}>
            {page} / {Math.ceil(data.total / 20)}
          </Text>
          <TouchableOpacity
            disabled={page >= Math.ceil(data.total / 20)}
            onPress={() => setPage((p) => p + 1)}
            style={[
              styles.pageBtn,
              { opacity: page >= Math.ceil(data.total / 20) ? 0.4 : 1 },
            ]}
          >
            <Feather name="chevron-right" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  loader: {
    flex: 1,
    marginTop: 60,
  },
  list: {
    padding: 16,
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
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  pageBtn: {
    padding: 8,
  },
  pageText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
