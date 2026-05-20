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

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push("/subscribe")}
      style={[
        styles.banner,
        {
          backgroundColor: isExpired ? colors.negative + "22" : colors.warning + "22",
          borderColor: isExpired ? colors.negative + "55" : colors.warning + "55",
        },
      ]}
    >
      <Feather
        name={isExpired ? "alert-circle" : "clock"}
        size={16}
        color={isExpired ? colors.negative : colors.warning}
      />
      <Text style={[styles.text, { color: isExpired ? colors.negative : colors.warning }]}>
        {isExpired
          ? "Subscription expired · Tap to renew"
          : `Trial: ${daysLeft ?? 0} day${daysLeft === 1 ? "" : "s"} left · Tap to upgrade`}
      </Text>
      <Feather
        name="chevron-right"
        size={14}
        color={isExpired ? colors.negative : colors.warning}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
