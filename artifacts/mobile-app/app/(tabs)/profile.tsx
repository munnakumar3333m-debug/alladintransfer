import { Feather } from "@expo/vector-icons";
import {
  useGetMe,
  useGetSubscriptionStatus,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();

  const { data: user, isError: userError } = useGetMe();
  const { data: sub, isError: subError } = useGetSubscriptionStatus();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const isPremium = sub?.subscriptionType === "premium";
  const isTrial = sub?.subscriptionType === "trial";
  const isExpired = sub?.subscriptionType === "expired" || (!isPremium && !isTrial);
  const subColor = isPremium ? colors.positive : isTrial ? colors.warning : colors.negative;
  const subLabel = isPremium ? "Premium" : isTrial ? "Trial" : "Expired";
  const initial = user?.name?.[0]?.toUpperCase() ?? "?";

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
      <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>

      {userError || subError ? (
        <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="alert-triangle" size={20} color={colors.negative} />
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Profile data is temporarily unavailable</Text>
        </View>
      ) : null}

      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{initial}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name ?? "Loading..."}</Text>
          <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>{user?.phone ?? ""}</Text>
          {user?.email ? <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>{user.email}</Text> : null}
        </View>
      </View>

      <View style={[styles.subCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.subRow}>
          <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Subscription</Text>
          <View style={[styles.subBadge, { backgroundColor: subColor + "22" }]}>
            <Text style={[styles.subBadgeText, { color: subColor }]}>{subLabel}</Text>
          </View>
        </View>
        {sub?.expiryDate && (
          <Text style={[styles.subExpiry, { color: colors.mutedForeground }]}>
            {isExpired ? "Expired" : "Expires"} {new Date(sub.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
        )}
        {sub?.daysRemaining !== undefined && sub.daysRemaining > 0 && (
          <Text style={[styles.daysLeft, { color: subColor }]}>{sub.daysRemaining} day{sub.daysRemaining === 1 ? "" : "s"} remaining</Text>
        )}
        {!isPremium && (
          <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/subscribe")} activeOpacity={0.8}>
            <Feather name="zap" size={14} color={colors.primaryForeground} />
            <Text style={[styles.upgradeBtnText, { color: colors.primaryForeground }]}>{isExpired ? "Renew Subscription" : "Upgrade to Premium"}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleLogout} activeOpacity={0.75}>
          <Feather name="log-out" size={18} color={colors.negative} />
          <Text style={[styles.menuText, { color: colors.negative }]}>Sign Out</Text>
          <Feather name="chevron-right" size={16} color={colors.negative} style={styles.menuArrow} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>ALLADIN  v1.0{"\n"}Powered by Fluxloom capitals</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  userPhone: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  subCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  subRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  subBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  subBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  subExpiry: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  daysLeft: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  upgradeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  menuArrow: {
    marginLeft: "auto",
  },
  version: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },
});
