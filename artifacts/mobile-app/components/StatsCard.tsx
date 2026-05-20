import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  positive?: boolean;
  negative?: boolean;
  accent?: boolean;
}

export function StatsCard({ label, value, sub, positive, negative, accent }: Props) {
  const colors = useColors();

  const valueColor = positive
    ? colors.positive
    : negative
      ? colors.negative
      : accent
        ? colors.primary
        : colors.foreground;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {sub && <Text style={[styles.sub, { color: colors.mutedForeground }]}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  sub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
