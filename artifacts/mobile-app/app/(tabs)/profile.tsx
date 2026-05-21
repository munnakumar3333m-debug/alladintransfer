import { Feather } from "@expo/vector-icons";
import {
  useGetMe,
  useGetSubscriptionStatus,
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
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
import { SubscriptionBanner } from "@/components/SubscriptionBanner";

interface ReferralStats {
  code: string;
  totalReferrals: number;
  rewardedReferrals: number;
  pendingReferrals: number;
  totalDaysEarned: number;
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, token } = useAuth();

  const { data: user, isError: userError } = useGetMe();
  const { data: sub, isError: subError } = useGetSubscriptionStatus();

  const { data: referral } = useQuery<ReferralStats>({
    queryKey: ["referral-code"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch("/api/referrals/my-code", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch referral code");
      return res.json();
    },
  });

  const handleCall = () => {
    Linking.openURL("tel:+918429054622").catch(() =>
      Alert.alert("Error", "Unable to open phone app.")
    );
  };

  const handleWhatsApp = () => {
    Linking.openURL("https://wa.me/918429054622").catch(() =>
      Alert.alert("Error", "WhatsApp is not available on this device.")
    );
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const handleCopyCode = () => {
    if (!referral?.code) return;
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referral.code).catch(() => {});
    }
    Alert.alert("Copied!", `Referral code "${referral.code}" copied to clipboard.`);
  };

  const handleShareCode = async () => {
    if (!referral?.code) return;
    try {
      await Share.share({
        message: `Join Alladin — India's best daily stock picks! 🚀\n\nUse my referral code ${referral.code} when you sign up and I instantly get 7 extra free days — no payment needed from you!\n\nDownload: https://alladin.app`,
        title: "Join Alladin",
      });
    } catch {}
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

      {sub && (sub.subscriptionType === "trial" || sub.subscriptionType === "expired") && (
        <SubscriptionBanner
          type={sub.subscriptionType === "expired" ? "expired" : "trial"}
          daysLeft={(sub.daysRemaining ?? 0) > 0 ? sub.daysRemaining : undefined}
        />
      )}

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

      {/* ── Referral Card ───────────────────────────────────────── */}
      <View style={[styles.referralCard, { backgroundColor: colors.card, borderColor: colors.primary + "55" }]}>
        <View style={styles.referralHeader}>
          <View style={[styles.referralIconBox, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="gift" size={18} color={colors.primary} />
          </View>
          <View style={styles.referralHeaderText}>
            <Text style={[styles.referralTitle, { color: colors.foreground }]}>Refer now for free TIPS</Text>
            <Text style={[styles.referralSubtitle, { color: colors.mutedForeground }]}>
              Get +7 free days the moment a friend joins — no payment needed
            </Text>
          </View>
        </View>

        <View style={[styles.howItWorks, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <View style={styles.howRow}>
            <View style={[styles.howStep, { backgroundColor: colors.primary }]}><Text style={styles.howStepNum}>1</Text></View>
            <Text style={[styles.howText, { color: colors.mutedForeground }]}>Share your code with a friend</Text>
          </View>
          <View style={styles.howRow}>
            <View style={[styles.howStep, { backgroundColor: colors.primary }]}><Text style={styles.howStepNum}>2</Text></View>
            <Text style={[styles.howText, { color: colors.mutedForeground }]}>Friend signs up using your code</Text>
          </View>
          <View style={styles.howRow}>
            <View style={[styles.howStep, { backgroundColor: "#10B981" }]}><Text style={styles.howStepNum}>✓</Text></View>
            <Text style={[styles.howText, { color: "#10B981" }]}>You instantly get 7 extra free days</Text>
          </View>
        </View>

        <View style={[styles.codeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.codeLabel, { color: colors.mutedForeground }]}>Your referral code</Text>
          <Text style={[styles.codeText, { color: colors.primary }]}>{referral?.code ?? "Loading..."}</Text>
        </View>

        <View style={styles.codeActions}>
          <TouchableOpacity
            style={[styles.codeBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "44" }]}
            onPress={handleCopyCode}
            activeOpacity={0.75}
          >
            <Feather name="copy" size={14} color={colors.primary} />
            <Text style={[styles.codeBtnText, { color: colors.primary }]}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.codeBtn, styles.codeBtnShare, { backgroundColor: colors.primary }]}
            onPress={handleShareCode}
            activeOpacity={0.8}
          >
            <Feather name="share-2" size={14} color={colors.primaryForeground} />
            <Text style={[styles.codeBtnText, { color: colors.primaryForeground }]}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{referral?.totalReferrals ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Friends{"\n"}Joined</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.positive }]}>{referral?.rewardedReferrals ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Rewards{"\n"}Given</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>+{referral?.totalDaysEarned ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Days{"\n"}Earned</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Support</Text>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleCall}
          activeOpacity={0.75}
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#10b98122" }]}>
            <Feather name="phone" size={16} color="#10b981" />
          </View>
          <Text style={[styles.menuText, { color: colors.foreground }]}>Call Support</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleWhatsApp}
          activeOpacity={0.75}
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#25D36622" }]}>
            <Feather name="message-circle" size={16} color="#25D366" />
          </View>
          <Text style={[styles.menuText, { color: colors.foreground }]}>Chat on WhatsApp</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
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
  // ── Referral ──────────────────────────────────────────────────
  howItWorks: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  howRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  howStep: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  howStepNum: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  howText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  referralCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    gap: 14,
  },
  referralHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  referralIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  referralHeaderText: {
    flex: 1,
    gap: 3,
  },
  referralTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  referralSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  codeBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  codeText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  codeActions: {
    flexDirection: "row",
    gap: 10,
  },
  codeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  codeBtnShare: {
    borderWidth: 0,
  },
  codeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 0,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  // ── Account ───────────────────────────────────────────────────
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
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextBlock: {
    flex: 1,
    gap: 2,
  },
  menuSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  version: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },
});
