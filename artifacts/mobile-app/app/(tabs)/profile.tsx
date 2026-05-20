import { Feather } from "@expo/vector-icons";
import {
  useGetMe,
  useGetMyReferralStats,
  useGetMyReferrals,
  useGetPaymentHistory,
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

  const { data: user } = useGetMe();
  const { data: sub } = useGetSubscriptionStatus();
  const { data: payments } = useGetPaymentHistory();
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

  const subColor =
    sub?.type === "premium"
      ? colors.positive
      : sub?.type === "trial"
        ? colors.warning
        : colors.negative;

  const subLabel =
    sub?.type === "premium"
      ? "Premium"
      : sub?.type === "trial"
        ? "Trial"
        : "Expired";

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

      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
            {(user?.name ?? "?")[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {user?.name ?? "Loading..."}
          </Text>
          <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>
            {user?.phone ?? ""}
          </Text>
          {user?.email && (
            <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>
              {user.email}
            </Text>
          )}
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
            {sub.type === "expired" ? "Expired" : "Expires"}{" "}
            {new Date(sub.expiryDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        )}
        {sub?.daysLeft !== undefined && sub.daysLeft > 0 && (
          <Text style={[styles.daysLeft, { color: subColor }]}>
            {sub.daysLeft} day{sub.daysLeft === 1 ? "" : "s"} remaining
          </Text>
        )}
        {(sub?.type === "trial" || sub?.type === "expired") && (
          <TouchableOpacity
            style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/subscribe")}
            activeOpacity={0.8}
          >
            <Feather name="zap" size={14} color={colors.primaryForeground} />
            <Text style={[styles.upgradeBtnText, { color: colors.primaryForeground }]}>
              {sub.type === "expired" ? "Renew Subscription" : "Upgrade to Premium"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {payments && payments.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Payment History
          </Text>
          {payments.slice(0, 5).map((payment) => (
            <View
              key={payment.id}
              style={[styles.paymentRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.paymentIcon, { backgroundColor: colors.positive + "22" }]}>
                <Feather name="check-circle" size={16} color={colors.positive} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={[styles.paymentAmount, { color: colors.foreground }]}>
                  ₹{payment.amount}
                </Text>
                <Text style={[styles.paymentDate, { color: colors.mutedForeground }]}>
                  {new Date(payment.createdAt).toLocaleDateString("en-IN")}
                </Text>
              </View>
              <View
                style={[
                  styles.paymentStatus,
                  {
                    backgroundColor:
                      payment.status === "success"
                        ? colors.positive + "22"
                        : colors.negative + "22",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.paymentStatusText,
                    {
                      color:
                        payment.status === "success" ? colors.positive : colors.negative,
                    },
                  ]}
                >
                  {payment.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Referral Card */}
      <View style={[styles.referralCard, { backgroundColor: colors.card, borderColor: colors.primary + "44" }]}>
        <View style={styles.referralHeader}>
          <View style={[styles.referralIconWrap, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="gift" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.referralTitle, { color: colors.foreground }]}>Invite Friends, Earn Free Days</Text>
            <Text style={[styles.referralSub, { color: colors.mutedForeground }]}>
              Get 30 free premium days for every friend who subscribes
            </Text>
          </View>
        </View>

        {referralStats ? (
          <>
            <TouchableOpacity
              style={[styles.codeBox, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleCopyCode}
              activeOpacity={0.75}
            >
              <Text style={[styles.codeText, { color: colors.primary }]}>{referralStats.code}</Text>
              <View style={[styles.copyBtn, { backgroundColor: copied ? colors.primary : colors.primary + "22" }]}>
                <Feather name={copied ? "check" : "copy"} size={14} color={copied ? colors.primaryForeground : colors.primary} />
                <Text style={[styles.copyBtnText, { color: copied ? colors.primaryForeground : colors.primary }]}>
                  {copied ? "Copied!" : "Copy"}
                </Text>
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
                      <Text style={[styles.refAvatarText, { color: colors.primary }]}>
                        {r.referredName[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.refName, { color: colors.foreground }]}>{r.referredName}</Text>
                      <Text style={[styles.refDate, { color: colors.mutedForeground }]}>
                        {new Date(r.createdAt).toLocaleDateString("en-IN")}
                      </Text>
                    </View>
                    <View style={[
                      styles.refStatus,
                      { backgroundColor: r.status === "rewarded" ? colors.positive + "22" : colors.warning + "22" }
                    ]}>
                      <Text style={[
                        styles.refStatusText,
                        { color: r.status === "rewarded" ? colors.positive : colors.warning }
                      ]}>
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
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleLogout}
          activeOpacity={0.75}
        >
          <Feather name="log-out" size={18} color={colors.negative} />
          <Text style={[styles.menuText, { color: colors.negative }]}>Sign Out</Text>
          <Feather name="chevron-right" size={16} color={colors.negative} style={styles.menuArrow} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        Alladin v1.0
      </Text>
    </ScrollView>
  );
}

function ReferralStat({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: string | number;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  highlight?: boolean;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", color: highlight ? colors.primary : colors.foreground }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
        {label}
      </Text>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  userPhone: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  subCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  subBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  subBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  subExpiry: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  daysLeft: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  upgradeBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentInfo: { flex: 1 },
  paymentAmount: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  paymentDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  paymentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  menuArrow: { marginLeft: "auto" },
  referralCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  referralHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  referralIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  referralTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  referralSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 17,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  codeText: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  referralStats: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  referralSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  referralRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  refAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  refAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  refName: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  refDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  refStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  refStatusText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    paddingBottom: 8,
  },
});
