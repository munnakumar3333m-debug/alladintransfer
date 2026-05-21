import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon?: keyof typeof Feather.glyphMap;
  positive?: boolean;
  negative?: boolean;
  accent?: boolean;
}

export function StatsCard({ label, value, sub, icon, positive, negative, accent }: Props) {
  const colors = useColors();

  const valueColor = positive
    ? colors.positive
    : negative
      ? colors.negative
      : accent
        ? colors.primary
        : colors.foreground;

  const iconBg = positive
    ? colors.positive + "20"
    : negative
      ? colors.negative + "20"
      : accent
        ? colors.primary + "20"
        : colors.border;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {icon && (
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Feather name={icon} size={14} color={valueColor} />
        </View>
      )}
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
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
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
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
