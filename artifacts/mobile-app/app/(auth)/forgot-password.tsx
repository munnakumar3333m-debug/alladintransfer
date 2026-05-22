import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

// ─── Support contact config — change these to your own numbers ────────────────
const SUPPORT_WHATSAPP = "919999999999"; // international format, no + or spaces
const SUPPORT_EMAIL = "support@alladin.in";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!phone.trim() || phone.trim().length < 10) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
  };

  const openWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hi, I need help resetting my password for my Alladin account.\n\nMy registered phone number: ${phone.trim() || "not provided"}\n\nPlease help me recover access.`,
    );
    Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}?text=${msg}`);
  };

  const openEmail = () => {
    const subject = encodeURIComponent("Password Reset Request — Alladin");
    const body = encodeURIComponent(
      `Hi Support,\n\nI need help resetting my password.\n\nMy registered phone: ${phone.trim() || "not provided"}\n\nThank you.`,
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            paddingBottom: insets.bottom + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconArea}>
          <View style={[styles.iconBox, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
            <Feather name="lock" size={32} color={colors.primary} />
          </View>
        </View>

        {!submitted ? (
          /* ── Step 1: Enter phone ── */
          <View style={styles.form}>
            <Text style={[styles.heading, { color: colors.foreground }]}>
              Forgot Password?
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              Enter your registered phone number and we'll connect you with our support team to reset it.
            </Text>

            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.flag, { color: colors.mutedForeground }]}>🇮🇳 +91</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Phone number"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[
                styles.btn,
                {
                  backgroundColor: phone.trim().length >= 10 ? colors.primary : colors.border,
                  opacity: phone.trim().length >= 10 ? 1 : 0.6,
                },
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={phone.trim().length < 10}
            >
              <Text style={[styles.btnText, { color: phone.trim().length >= 10 ? colors.primaryForeground : colors.mutedForeground }]}>
                Request Password Reset
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Step 2: Contact options ── */
          <View style={styles.form}>
            <Text style={[styles.heading, { color: colors.foreground }]}>
              Contact Support
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              We received your request for{" "}
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>
                +91 {phone}
              </Text>
              . Choose how you'd like to reach us — we'll reset your password within a few minutes.
            </Text>

            {/* Info card */}
            <View style={[styles.infoCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>
                Reset is done manually by our team. Share your registered phone number and we'll verify & reset it for you.
              </Text>
            </View>

            {/* WhatsApp button */}
            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: "#25D366" }]}
              onPress={openWhatsApp}
              activeOpacity={0.85}
            >
              <View style={styles.contactBtnInner}>
                <View style={styles.contactBtnLeft}>
                  <Feather name="message-circle" size={20} color="#fff" />
                  <View>
                    <Text style={styles.contactBtnTitle}>Chat on WhatsApp</Text>
                    <Text style={styles.contactBtnSub}>Fastest — usually under 5 minutes</Text>
                  </View>
                </View>
                <Feather name="arrow-right" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Email button */}
            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
              onPress={openEmail}
              activeOpacity={0.85}
            >
              <View style={styles.contactBtnInner}>
                <View style={styles.contactBtnLeft}>
                  <Feather name="mail" size={20} color={colors.primary} />
                  <View>
                    <Text style={[styles.contactBtnTitle, { color: colors.foreground }]}>Send an Email</Text>
                    <Text style={[styles.contactBtnSub, { color: colors.mutedForeground }]}>{SUPPORT_EMAIL}</Text>
                  </View>
                </View>
                <Feather name="arrow-right" size={16} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>

            {/* Back to try different number */}
            <TouchableOpacity
              onPress={() => setSubmitted(false)}
              style={styles.retryRow}
              activeOpacity={0.7}
            >
              <Text style={[styles.retryText, { color: colors.mutedForeground }]}>
                Wrong number?{" "}
                <Text style={{ color: colors.primary }}>Enter a different one</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Back to login */}
        <TouchableOpacity
          style={styles.backToLogin}
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
          <Text style={[styles.backToLoginText, { color: colors.mutedForeground }]}>
            Back to <Text style={{ color: colors.primary }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginBottom: 24,
  },
  iconArea: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  form: {
    gap: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  sub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  flag: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    width: 1,
    height: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  btn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  contactBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  contactBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  contactBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  contactBtnTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    marginBottom: 2,
  },
  contactBtnSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  retryRow: {
    alignItems: "center",
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  backToLogin: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 40,
    paddingVertical: 8,
  },
  backToLoginText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
