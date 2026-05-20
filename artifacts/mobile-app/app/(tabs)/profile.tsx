import { Feather } from "@expo/vector-icons";
import {
  useGetMe,
  useGetMyReferralStats,
  useGetMyReferrals,
  useGetSubscriptionStatus,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Share,
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
  const [copied, setCopied] = useState(false);

  const { data: user, isError: userError } = useGetMe();
  const { data: sub, isError: subError } = useGetSubscriptionStatus();
  const { data: referralStats } = useGetMyReferralStats();
  const { data: myReferrals } = useGetMyReferrals();

  const handleCopyCode = async () => {
    if (!referralStats?.code) return;
    if (Platform.OS === "web") {
      try {
        await navigator.clipboard.writeText(referralStats.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        Alert.alert("Your code", referralStats.code);
      }
    } else {
      await Share.share({ message: `Use my referral code ${referralStats.code} to get 30 free days on Alladin!` });
    }
  };

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

      <View style={[styles.referralCard, { backgroundColor: colors.card, borderColor: colors.primary + "44" }]}> 
        <View style={styles.referralHeader}>
          <View style={[styles.referralIconWrap, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="gift" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.referralTitle, { color: colors.foreground }]}>Invite Friends, Earn Free Days</Text>
            <Text style={[styles.referralSub, { color: colors.mutedForeground }]}>Get 30 free premium days for every friend who subscribes</Text>
          </View>
        </View>

        {referralStats ? (
          <>
            <TouchableOpacity style={[styles.codeBox, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={handleCopyCode} activeOpacity={0.75}>
              <Text style={[styles.codeText, { color: colors.primary }]}>{referralStats.code}</Text>
              <View style={[styles.copyBtn, { backgroundColor: copied ? colors.primary : colors.primary + "22" }]}>
                <Feather name={copied ? "check" : "copy"} size={14} color={copied ? colors.primaryForeground : colors.primary} />
                <Text style={[styles.copyBtnText, { color: copied ? colors.primaryForeground : colors.primary }]}>{copied ? "Copied!" : "Copy"}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.referralStats}>
              <ReferralStat label="Total" value={referralStats.totalReferrals} colors={colors} />
              <ReferralStat label="Rewarded" value={referralStats.rewardedReferrals} colors={colors} highlight />
              <ReferralStat label="Pending" value={referralStats.pendingReferrals} colors={colors} />
              <ReferralStat label="Days Earned" value={`${referralStats.totalDaysEarned}d`} colors={colors} />
            </View>

            {myReferrals && myReferrals.length > 0 && (
              <View style={{ gap: 8, marginTop: 4 }}>
                <Text style={[styles.referralSubtitle, { color: colors.mutedForeground }]}>Your referrals</Text>
                {myReferrals.slice(0, 3).map((r) => (
                  <View key={r.id} style={[styles.referralRow, { borderColor: colors.border }]}> 
                    <View style={[styles.refAvatar, { backgroundColor: colors.primary + "22" }]}>
                      <Text style={[styles.refAvatarText, { color: colors.primary }]}>{r.referredName[0].toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.refName, { color: colors.foreground }]}>{r.referredName}</Text>
                      <Text style={[styles.refDate, { color: colors.mutedForeground }]}>{new Date(r.createdAt).toLocaleDateString("en-IN")}</Text>
                    </View>
                    <View style={[styles.refStatus, { backgroundColor: r.status === "rewarded" ? colors.positive + "22" : colors.warning + "22" }]}> 
                      <Text style={[styles.refStatusText, { color: r.status === "rewarded" ? colors.positive : colors.warning }]}>
                        {r.status === "rewarded" ? "+30d" : "Pending"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={[styles.codeBox, { backgroundColor: colors.background, borderColor: colors.border }]}> 
            <Text style={[styles.codeText, { color: colors.mutedForeground }]}>Loading code...</Text>
          </View>
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

function ReferralStat({ label, value, colors, highlight }: { label: string; value: string | number; colors: ReturnType<typeof import("@/hooks/useColors").useColors>; highlight?: boolean; }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", color: highlight ? colors.primary : colors.foreground }}>{value}</Text>
      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>{label}</Text>
    </View>
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
  referralCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  referralHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  referralIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  referralTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  referralSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  codeText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    flex: 1,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  copyBtnText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  referralStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
    marginTop: 2,
  },
  referralSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  referralRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  refAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  refAvatarText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  refName: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  refDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  refStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  refStatusText: {
    fontSize: 11,
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
