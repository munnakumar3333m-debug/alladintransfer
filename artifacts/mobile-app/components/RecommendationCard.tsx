import { Feather } from "@expo/vector-icons";
import type { Recommendation } from "@workspace/api-client-react";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  rec: Recommendation;
  onPress?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  target_hit: "Target Hit",
  stop_loss_hit: "Stop Loss",
  hold: "Hold",
  partial_profit: "Partial Exit",
  closed: "Closed",
};

const TRADE_COLOR: Record<string, string> = {
  intraday: "#818CF8",
  swing: "#F59E0B",
  positional: "#06B6D4",
};

export function RecommendationCard({ rec, onPress }: Props) {
  const colors = useColors();

  const pnl = rec.pnlPercent ? parseFloat(rec.pnlPercent) : null;
  const isPositive = pnl !== null && pnl >= 0;
  const tradeColor = TRADE_COLOR[rec.tradeType] ?? colors.mutedForeground;
  const statusColor =
    rec.status === "target_hit"
      ? colors.positive
      : rec.status === "stop_loss_hit"
        ? colors.negative
        : rec.status === "active" || rec.status === "hold"
          ? colors.warning
          : colors.mutedForeground;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <View style={styles.symbolRow}>
          <Text style={[styles.symbol, { color: colors.foreground }]}>
            {rec.nseSymbol}
          </Text>
          <View style={[styles.badge, { backgroundColor: tradeColor + "22" }]}>
            <Text style={[styles.badgeText, { color: tradeColor }]}>
              {rec.tradeType.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABEL[rec.status] ?? rec.status}
          </Text>
        </View>
      </View>

      <Text style={[styles.stockName, { color: colors.mutedForeground }]} numberOfLines={1}>
        {rec.stockName}
      </Text>

      <View style={styles.priceRow}>
        <PriceItem label="Buy" value={`₹${rec.buyPrice}`} color={colors.mutedForeground} foreground={colors.foreground} />
        <PriceItem label="Target" value={`₹${rec.targetPrice}`} color={colors.mutedForeground} foreground={colors.positive} />
        <PriceItem label="SL" value={`₹${rec.stopLoss}`} color={colors.mutedForeground} foreground={colors.negative} />
        {pnl !== null && (
          <PriceItem
            label="P&L"
            value={`${isPositive ? "+" : ""}${pnl.toFixed(2)}%`}
            color={colors.mutedForeground}
            foreground={isPositive ? colors.positive : colors.negative}
          />
        )}
      </View>

      {rec.notes && (
        <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={2}>
          {rec.notes}
        </Text>
      )}

      <View style={styles.footer}>
        <Feather name="calendar" size={11} color={colors.mutedForeground} />
        <Text style={[styles.date, { color: colors.mutedForeground }]}> {rec.date}</Text>
        <View style={styles.spacer} />
        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

function PriceItem({
  label,
  value,
  color,
  foreground,
}: {
  label: string;
  value: string;
  color: string;
  foreground: string;
}) {
  return (
    <View style={styles.priceItem}>
      <Text style={[styles.priceLabel, { color }]}>{label}</Text>
      <Text style={[styles.priceValue, { color: foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  symbol: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  stockName: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  priceRow: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 4,
  },
  priceItem: {
    gap: 2,
  },
  priceLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  priceValue: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  notes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    paddingTop: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 4,
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  spacer: { flex: 1 },
});
