import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  type: "trial" | "expired";
  daysLeft?: number;
}

export function SubscriptionBanner({ type, daysLeft }: Props) {
  const colors = useColors();
  const router = useRouter();
  const isExpired = type === "expired";
  const accent = isExpired ? colors.negative : colors.warning;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push("/subscribe")}
      style={[styles.banner, { backgroundColor: accent + "15", borderColor: accent + "45" }]}
    >
      <View style={[styles.iconBox, { backgroundColor: accent + "25" }]}>
        <Feather name={isExpired ? "alert-circle" : "clock"} size={15} color={accent} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: accent }]}>
          {isExpired ? "Subscription Expired" : `Trial ends in ${daysLeft ?? 0} day${daysLeft === 1 ? "" : "s"}`}
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {isExpired ? "Renew now to restore access to all picks" : "Upgrade to Premium to keep getting daily picks"}
        </Text>
      </View>
      <View style={[styles.cta, { backgroundColor: accent }]}>
        <Text style={styles.ctaText}>{isExpired ? "Renew" : "Upgrade"}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  sub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
  },
  cta: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
});
