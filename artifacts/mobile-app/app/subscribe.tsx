import { Feather } from "@expo/vector-icons";
import {
  useCreatePaymentOrder,
  useGetSubscriptionStatus,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
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

const FEATURES = [
  "Daily stock recommendations (intraday, swing & positional)",
  "Evening P&L updates on all recommendations",
  "Monthly performance analytics & charts",
  "Real-time market insights & notes",
  "WhatsApp & push notification alerts",
  "Priority customer support",
];

export default function SubscribeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: sub } = useGetSubscriptionStatus();
  const { mutate: createOrder, isPending } = useCreatePaymentOrder({
    mutation: {
      onSuccess: (data) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Payment Integration",
          `Razorpay order created!\n\nOrder ID: ${data.orderId}\nAmount: ₹${(data.amount / 100).toFixed(0)}\n\n(Razorpay payment sheet would open here in production)`,
          [{ text: "OK" }]
        );
      },
      onError: () => {
        Alert.alert("Error", "Could not create payment order. Please try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    },
  });

  const isExpired = sub?.type === "expired";

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
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Premium</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 120 },
        ]}
      >
        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
            <Feather name="zap" size={36} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            AlphaTrade Pro
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            {isExpired
              ? "Your subscription has expired. Renew to regain access."
              : "Upgrade to premium and unlock all stock picks"}
          </Text>
        </View>

        <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.primary + "66" }]}>
          <View style={styles.priceRow}>
            <Text style={[styles.currency, { color: colors.primary }]}>₹</Text>
            <Text style={[styles.price, { color: colors.foreground }]}>2,000</Text>
            <Text style={[styles.period, { color: colors.mutedForeground }]}>/month</Text>
          </View>
          <Text style={[styles.priceSub, { color: colors.mutedForeground }]}>
            No hidden charges · Cancel anytime
          </Text>
        </View>

        <View style={styles.features}>
          <Text style={[styles.featuresTitle, { color: colors.foreground }]}>
            Everything included
          </Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.checkIcon, { backgroundColor: colors.positive + "22" }]}>
                <Feather name="check" size={12} color={colors.positive} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 16) + 8,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.payBtn,
            { backgroundColor: colors.primary, opacity: isPending ? 0.7 : 1 },
          ]}
          onPress={() => createOrder({})}
          activeOpacity={0.85}
          disabled={isPending}
        >
          <Feather name="credit-card" size={18} color={colors.primaryForeground} />
          <Text style={[styles.payBtnText, { color: colors.primaryForeground }]}>
            {isPending ? "Processing..." : "Pay ₹2,000 via Razorpay"}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.footerSub, { color: colors.mutedForeground }]}>
          Secured by Razorpay · UPI, Cards, Netbanking
        </Text>
      </View>
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
    gap: 24,
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
    padding: 24,
    borderWidth: 2,
    alignItems: "center",
    gap: 8,
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
  },
  features: {
    gap: 14,
  },
  featuresTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
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
  footerSub: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
