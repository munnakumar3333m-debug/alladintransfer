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

const RISK_COLOR: Record<string, string> = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#EF4444",
};

export function RecommendationCard({ rec, onPress }: Props) {
  const colors = useColors();

  const pnl = rec.pnlPercent ? parseFloat(String(rec.pnlPercent)) : null;
  const isPositive = pnl !== null && pnl >= 0;
  const tradeColor = TRADE_COLOR[rec.tradeType] ?? colors.mutedForeground;
  const riskColor = RISK_COLOR[rec.riskLevel] ?? colors.mutedForeground;

  const isBuy = rec.signalType === "BUY";
  const signalColor = isBuy ? "#10B981" : "#EF4444";
  const signalBg = isBuy ? "#10B98120" : "#EF444420";
  const signalBorder = isBuy ? "#10B98140" : "#EF444440";
  const signalGlow = isBuy ? "#10B98115" : "#EF444415";

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
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: signalBorder,
          shadowColor: signalColor,
        },
      ]}
    >
      {/* Signal Banner */}
      <View style={[styles.signalBanner, { backgroundColor: signalBg, borderColor: signalBorder }]}>
        <View style={styles.signalLeft}>
          <View style={[styles.signalIconWrap, { backgroundColor: signalColor + "25" }]}>
            <Feather
              name={isBuy ? "arrow-up" : "arrow-down"}
              size={18}
              color={signalColor}
            />
          </View>
          <View>
            <Text style={[styles.signalLabel, { color: signalColor }]}>
              {isBuy ? "▲ BUY SIGNAL" : "▼ SELL SIGNAL"}
            </Text>
            <Text style={[styles.signalSub, { color: signalColor + "99" }]}>
              {isBuy ? "Bullish · Long Position" : "Bearish · Short Position"}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABEL[rec.status] ?? rec.status}
          </Text>
        </View>
      </View>

      {/* Stock identity */}
      <View style={styles.stockRow}>
        <View style={styles.symbolWrap}>
          <Text style={[styles.symbol, { color: colors.foreground }]}>
            {rec.nseSymbol}
          </Text>
          <Text style={[styles.stockName, { color: colors.mutedForeground }]} numberOfLines={1}>
            {rec.stockName}
          </Text>
        </View>
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: tradeColor + "22" }]}>
            <Text style={[styles.badgeText, { color: tradeColor }]}>
              {rec.tradeType.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: riskColor + "22" }]}>
            <Text style={[styles.badgeText, { color: riskColor }]}>
              {rec.riskLevel.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Price grid */}
      <View style={[styles.priceGrid, { borderColor: colors.border }]}>
        <PriceCell
          label="Entry Price"
          value={`₹${rec.buyPrice}`}
          labelColor={colors.mutedForeground}
          valueColor={colors.foreground}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <PriceCell
          label="Target"
          value={`₹${rec.targetPrice}`}
          labelColor={colors.mutedForeground}
          valueColor="#10B981"
          icon="target"
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <PriceCell
          label="Stop Loss"
          value={`₹${rec.stopLoss}`}
          labelColor={colors.mutedForeground}
          valueColor="#EF4444"
          icon="shield"
        />
        {pnl !== null && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <PriceCell
              label="P&L"
              value={`${isPositive ? "+" : ""}${pnl.toFixed(2)}%`}
              labelColor={colors.mutedForeground}
              valueColor={isPositive ? "#10B981" : "#EF4444"}
            />
          </>
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
        <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>View details</Text>
        <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

function PriceCell({
  label,
  value,
  labelColor,
  valueColor,
  icon,
}: {
  label: string;
  value: string;
  labelColor: string;
  valueColor: string;
  icon?: string;
}) {
  return (
    <View style={styles.priceCell}>
      <View style={styles.priceLabelRow}>
        {icon && <Feather name={icon as any} size={9} color={labelColor} style={{ marginRight: 3 }} />}
        <Text style={[styles.priceLabel, { color: labelColor }]}>{label}</Text>
      </View>
      <Text style={[styles.priceValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  signalBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  signalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  signalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  signalLabel: {
    fontSize: 15,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  signalSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  symbolWrap: {
    flex: 1,
    gap: 1,
  },
  symbol: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  stockName: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  badgesRow: {
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  priceGrid: {
    flexDirection: "row",
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  priceCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 4,
  },
  priceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    width: 1,
  },
  priceLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  priceValue: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  notes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingTop: 10,
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  spacer: { flex: 1 },
  tapHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginRight: 2,
  },
});
