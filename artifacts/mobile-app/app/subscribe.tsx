import { Feather } from "@expo/vector-icons";
import { useGetSubscriptionStatus } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
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

export default function SubscribeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: sub } = useGetSubscriptionStatus();

  const expiryText = useMemo(() => {
    if (sub?.type === "premium") return "Your premium is active. Renew to extend by 30 days.";
    if (sub?.type === "trial") return "Your trial is active. Pay now to continue without interruption.";
    return "Your subscription has expired. Renew to regain access.";
  }, [sub?.type]);

  const handleCopy = async () => {
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(UPI_ID);
      }
    } catch {}
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", "UPI ID copied to clipboard");
  };

  const handlePay = async () => {
    try {
      await Linking.openURL(UPI_URL);
    } catch {
      Alert.alert("Error", "No UPI app found on this device.");
    }
  };

  const handlePaid = () => {
    Alert.alert(
      "Payment submitted",
      "The payment will be verified by the admin and your subscription will be extended by 30 days after approval.",
      [{ text: "OK" }]
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Subscription Renewal</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 24 },
        ]}
      >
        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
            <Feather name="credit-card" size={34} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>UPI Renewal</Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>{expiryText}</Text>
        </View>

        <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.primary + "66" }]}>
          <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Subscription price</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.currency, { color: colors.primary }]}>₹</Text>
            <Text style={[styles.price, { color: colors.foreground }]}>800</Text>
            <Text style={[styles.period, { color: colors.mutedForeground }]}>/ 30 days</Text>
          </View>
          <Text style={[styles.priceSub, { color: colors.mutedForeground }]}>Only UPI supported · Instant renewal after approval</Text>
        </View>

        <TouchableOpacity
          style={[styles.payBtn, { backgroundColor: colors.primary }]}
          onPress={handlePay}
          activeOpacity={0.85}
        >
          <Feather name="smartphone" size={18} color={colors.primaryForeground} />
          <Text style={[styles.payBtnText, { color: colors.primaryForeground }]}>Make Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.paidBtn, { borderColor: colors.border }]} onPress={handlePaid} activeOpacity={0.85}>
          <Feather name="check-circle" size={18} color={colors.foreground} />
          <Text style={[styles.paidBtnText, { color: colors.foreground }]}>I have paid</Text>
        </TouchableOpacity>

        <View style={[styles.upiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pay using UPI</Text>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Merchant Name</Text>
          <Text style={[styles.upiValue, { color: colors.foreground }]}>{MERCHANT_NAME}</Text>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 10 }]}>UPI ID</Text>
          <View style={styles.upiRow}>
            <Text style={[styles.upiValue, { color: colors.foreground }]}>{UPI_ID}</Text>
            <TouchableOpacity style={[styles.copyBtn, { borderColor: colors.primary + "55" }]} onPress={handleCopy}>
              <Feather name="copy" size={14} color={colors.primary} />
              <Text style={[styles.copyBtnText, { color: colors.primary }]}>Copy UPI ID</Text>
            </TouchableOpacity>
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
  backBtn: {
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
    padding: 24,
    gap: 18,
  },
  heroSection: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  heroSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  priceCard: {
    borderRadius: 18,
    padding: 22,
    borderWidth: 2,
    alignItems: "center",
    gap: 6,
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  currency: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 6,
  },
  price: {
    fontSize: 52,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 58,
  },
  period: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    alignSelf: "flex-end",
    marginBottom: 6,
    marginLeft: 4,
  },
  priceSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  paidBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  paidBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  upiCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  upiValue: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  upiRow: {
    gap: 10,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});