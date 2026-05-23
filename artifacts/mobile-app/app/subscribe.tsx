import { Feather } from "@expo/vector-icons";
import { useGetSubscriptionStatus } from "@workspace/api-client-react";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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

import { useColors } from "@/hooks/useColors";

const UPI_ID = "8429054622@ptaxis";
const UPI_AMOUNT = 800;
const MERCHANT_NAME = "Alladin";
const UPI_URL = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${UPI_AMOUNT}&cu=INR`;

const FEATURES = [
  { icon: "trending-up" as const, text: "Daily BUY / SELL stock picks" },
  { icon: "bar-chart-2" as const, text: "Live P&L tracking on every pick" },
  { icon: "activity" as const, text: "Advanced portfolio analytics" },
  { icon: "bell" as const, text: "Real-time push alerts" },
  { icon: "award" as const, text: "Priority customer support" },
];

const STEPS = [
  { n: "1", label: 'Tap "Pay via UPI"', desc: "Opens your UPI app with details pre-filled" },
  { n: "2", label: "Complete payment", desc: `Pay \u20B9${UPI_AMOUNT} and return to Alladin` },
  { n: "3", label: "Tap \"I've Paid\"", desc: "Notify us so we can verify instantly" },
  { n: "4", label: "Get confirmed", desc: "Admin approves and your 30 days begin" },
];

export default function SubscribeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: sub } = useGetSubscriptionStatus();
  const [copied, setCopied] = useState(false);

  const { badge, expiryText } = useMemo(() => {
    if (sub?.subscriptionType === "premium") return {
      badge: "ACTIVE",
      expiryText: "Your premium is active. Renew now to stack another 30 days.",
    };
    if (sub?.subscriptionType === "trial") return {
      badge: "TRIAL",
      expiryText: "Upgrade before your trial ends to enjoy uninterrupted access.",
    };
    return {
      badge: "EXPIRED",
      expiryText: "Your subscription has expired. Renew to regain full access.",
    };
  }, [sub?.subscriptionType]);

  const badgeColor = badge === "ACTIVE" ? colors.positive : badge === "TRIAL" ? colors.primary : colors.negative;

  const handleCopy = async () => {
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(UPI_ID);
      } else {
        await Clipboard.setStringAsync(UPI_ID);
      }
    } catch {}
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePay = async () => {
    try {
      await Linking.openURL(UPI_URL);
    } catch {
      Alert.alert("No UPI App Found", "Please use the UPI ID below to pay manually from any UPI app.");
    }
  };

  const handlePaid = () => {
    Alert.alert(
      "✅ Payment Submitted",
      "Our team will verify your payment shortly. Your subscription will be extended by 30 days once approved — usually within a few hours.",
      [{ text: "Got it", style: "default" }]
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.navBar,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Premium Plan</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero ─────────────────────────────────────────────── */}
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <View style={[styles.statusPill, { backgroundColor: "#FFFFFF22" }]}>
                <View style={[styles.statusDot, { backgroundColor: badgeColor === colors.primary ? "#FFFFFF" : badgeColor }]} />
                <Text style={styles.statusPillText}>{badge}</Text>
              </View>
              <Text style={styles.heroTitle}>Alladin V1.0 Premium</Text>
              <Text style={styles.heroTagline}>Developed by TRADEQ securities</Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.priceCurrency}>₹</Text>
              <Text style={styles.priceAmount}>800</Text>
              <Text style={styles.pricePeriod}>/mo</Text>
            </View>
          </View>
          <Text style={styles.heroCaption}>{expiryText}</Text>
        </View>

        {/* ─── Features ─────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardHeading, { color: colors.foreground }]}>What's included</Text>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: colors.primary + "20" }]}>
                <Feather name={f.icon} size={15} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* ─── CTA Buttons ──────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={handlePay}
          activeOpacity={0.85}
        >
          <Feather name="smartphone" size={18} color={colors.primaryForeground} />
          <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Pay ₹800 via UPI</Text>
          <Feather name="arrow-right" size={16} color={colors.primaryForeground} style={{ opacity: 0.8 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={handlePaid}
          activeOpacity={0.85}
        >
          <Feather name="check-circle" size={17} color={colors.positive} />
          <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>I've already paid</Text>
        </TouchableOpacity>

        {/* ─── UPI Details ──────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardHeading, { color: colors.foreground }]}>Manual UPI Payment</Text>
          <Text style={[styles.cardCaption, { color: colors.mutedForeground }]}>
            Open any UPI app and send to the details below.
          </Text>

          <View style={[styles.upiDetailRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.upiDetailLeft}>
              <Text style={[styles.upiDetailLabel, { color: colors.mutedForeground }]}>Merchant</Text>
              <Text style={[styles.upiDetailValue, { color: colors.foreground }]}>{MERCHANT_NAME}</Text>
            </View>
            <Feather name="user" size={16} color={colors.mutedForeground} />
          </View>

          <View style={[styles.upiDetailRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.upiDetailLeft}>
              <Text style={[styles.upiDetailLabel, { color: colors.mutedForeground }]}>UPI ID</Text>
              <Text style={[styles.upiDetailValue, { color: colors.foreground }]}>{UPI_ID}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: copied ? colors.positive + "20" : colors.primary + "18", borderColor: copied ? colors.positive + "55" : colors.primary + "44" }]}
              onPress={handleCopy}
              activeOpacity={0.75}
            >
              <Feather name={copied ? "check" : "copy"} size={13} color={copied ? colors.positive : colors.primary} />
              <Text style={[styles.copyBtnText, { color: copied ? colors.positive : colors.primary }]}>
                {copied ? "Copied!" : "Copy"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.upiDetailRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.upiDetailLeft}>
              <Text style={[styles.upiDetailLabel, { color: colors.mutedForeground }]}>Amount</Text>
              <Text style={[styles.upiDetailValue, { color: colors.foreground }]}>₹{UPI_AMOUNT}.00</Text>
            </View>
            <Feather name="tag" size={16} color={colors.mutedForeground} />
          </View>
        </View>

        {/* ─── How it works ─────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardHeading, { color: colors.foreground }]}>How it works</Text>
          {STEPS.map((s, i) => (
            <View key={s.n} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumText}>{s.n}</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={[styles.stepLabel, { color: colors.foreground }]}>{s.label}</Text>
                <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepConnector, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>

        {/* ─── Trust footer ─────────────────────────────────────── */}
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Feather name="lock" size={13} color={colors.mutedForeground} />
            <Text style={[styles.trustText, { color: colors.mutedForeground }]}>Secure UPI</Text>
          </View>
          <View style={[styles.trustDivider, { backgroundColor: colors.border }]} />
          <View style={styles.trustItem}>
            <Feather name="clock" size={13} color={colors.mutedForeground} />
            <Text style={[styles.trustText, { color: colors.mutedForeground }]}>Quick approval</Text>
          </View>
          <View style={[styles.trustDivider, { backgroundColor: colors.border }]} />
          <View style={styles.trustItem}>
            <Feather name="shield" size={13} color={colors.mutedForeground} />
            <Text style={[styles.trustText, { color: colors.mutedForeground }]}>No auto-debit</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },

  content: {
    padding: 20,
    gap: 14,
  },

  heroCard: {
    borderRadius: 22,
    padding: 22,
    gap: 14,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroLeft: {
    flex: 1,
    gap: 4,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  heroTagline: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#FFFFFFAA",
    letterSpacing: 0.5,
  },
  priceBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginTop: 6,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: "900",
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    lineHeight: 54,
  },
  pricePeriod: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFFBB",
    alignSelf: "flex-end",
    marginBottom: 8,
    marginLeft: 2,
  },
  heroCaption: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFFCC",
    lineHeight: 19,
  },

  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 10,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  cardCaption: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    marginTop: -4,
    marginBottom: 2,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    borderRadius: 16,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: "center",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  upiDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  upiDetailLeft: {
    gap: 2,
  },
  upiDetailLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  upiDetailValue: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    position: "relative",
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  stepBody: {
    flex: 1,
    paddingBottom: 18,
    gap: 2,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  stepDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  stepConnector: {
    position: "absolute",
    left: 13,
    top: 28,
    width: 2,
    height: "100%",
    zIndex: 0,
  },

  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  trustText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  trustDivider: {
    width: 1,
    height: 14,
    opacity: 0.5,
  },
});
