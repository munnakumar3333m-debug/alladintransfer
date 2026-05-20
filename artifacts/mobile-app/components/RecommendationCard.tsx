import type { Recommendation } from "@workspace/api-client-react";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  rec: Recommendation;
  onPress?: () => void;
}

export function RecommendationCard({ rec, onPress }: Props) {
  const colors = useColors();
  const isBuy = rec.signalType === "BUY";
  const signalColor = isBuy ? "#10B981" : "#EF4444";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: signalColor + "44",
          shadowColor: signalColor,
        },
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.stockName, { color: colors.foreground }]} numberOfLines={1}>
          {rec.stockName}
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: signalColor + "18",
              borderColor: signalColor + "44",
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: signalColor }]}>
            {isBuy ? "BUY" : "SELL"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  stockName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  badge: {
    minWidth: 66,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: 0.8,
  },
});
