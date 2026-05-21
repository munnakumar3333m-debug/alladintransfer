import { Feather } from "@expo/vector-icons";
import { useGetRecommendation } from "@workspace/api-client-react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { StockChart } from "@/components/StockChart";

const RISK_COLOR: Record<string, string> = {
  low: "#06B6D4",
  medium: "#F59E0B",
  high: "#FF4D4D",
};

export default function RecommendationDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const [scrollEnabled, setScrollEnabled] = useState(true);

  const { data: rec, isLoading } = useGetRecommendation(Number(id));
  const screenshots = useMemo(() => {
    const list = rec?.screenshots?.length ? rec.screenshots : rec?.screenshotUrl ? [rec.screenshotUrl] : [];
    return list.filter(Boolean);
  }, [rec?.screenshotUrl, rec?.screenshots]);

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
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>
          {isLoading ? "Loading..." : (rec?.nseSymbol ?? "View Details")}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} size="large" />
      ) : rec ? (
        <ScrollView
          scrollEnabled={scrollEnabled}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 24,
            },
          ]}
        >
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.heroRow}>
              <View style={styles.titleWrap}>
                <Text style={[styles.symbol, { color: colors.foreground }]}>{rec.nseSymbol}</Text>
                <Text style={[styles.stockName, { color: colors.mutedForeground }]}>{rec.stockName}</Text>
              </View>
              <View style={[styles.signalBadge, { backgroundColor: rec.signalType === "BUY" ? "#10B98122" : "#EF444422" }]}>
                <Text style={[styles.signalText, { color: rec.signalType === "BUY" ? "#10B981" : "#EF4444" }]}>
                  {rec.signalType}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.priceGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <PriceBlock label="Entry Price" value={fmtPrice(rec.buyPrice)} colors={colors} />
            <Divider colors={colors} />
            <PriceBlock label="Target Price" value={fmtPrice(rec.targetPrice)} color={colors.positive} colors={colors} />
            <Divider colors={colors} />
            <PriceBlock label="Stop Loss" value={fmtPrice(rec.stopLoss)} color={colors.negative} colors={colors} />
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <InfoRow label="Risk Level" value={rec.riskLevel?.toUpperCase() ?? "-"} valueColor={RISK_COLOR[rec.riskLevel ?? "medium"]} colors={colors} />
            <InfoRow label="Trade Type" value={rec.tradeType.toUpperCase()} colors={colors} />
          </View>

          <StockChart
            symbol={rec.nseSymbol}
            onInteractionStart={() => setScrollEnabled(false)}
            onInteractionEnd={() => setScrollEnabled(true)}
          />

          {screenshots.length > 0 && (
            <View style={[styles.screenshotCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Charts / Analysis Screenshot</Text>
                <Text style={[styles.tapToZoom, { color: colors.mutedForeground }]}>Tap to zoom</Text>
              </View>

              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const pageWidth = Dimensions.get("window").width - 64 + 12;
                  const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
                  setIndex(Math.max(0, Math.min(next, screenshots.length - 1)));
                }}
              >
                {screenshots.map((uri, i) => (
                  <TouchableOpacity key={uri + i} onPress={() => setActiveImage(uri)} activeOpacity={0.9} style={styles.imageSlide}>
                    <View style={styles.imageWrap}>
                      <Image source={{ uri }} style={styles.image} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                    </View>
                    <Text style={[styles.imageCaption, { color: colors.mutedForeground }]}>Screenshot {i + 1}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.dotsRow}>
                {screenshots.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          i === index ? colors.primary : colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {rec.notes && (
            <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notes / Explanation</Text>
              <Text style={[styles.notes, { color: colors.mutedForeground }]}>{rec.notes}</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.loader}>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Recommendation not found</Text>
        </View>
      )}

      <Modal visible={!!activeImage} transparent animationType="fade" onRequestClose={() => setActiveImage(null)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setActiveImage(null)}>
            <Feather name="x" size={22} color="#fff" />
          </TouchableOpacity>
          {activeImage && (
            <ScrollView maximumZoomScale={3} minimumZoomScale={1} centerContent showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
              <Image source={{ uri: activeImage }} style={[styles.fullImage, { width: Dimensions.get("window").width, height: Dimensions.get("window").height * 0.8 }]} contentFit="contain" cachePolicy="memory-disk" />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

function fmtPrice(val: string | number | null | undefined): string {
  if (val == null) return "—";
  const s = String(val).trim();
  return /^[\d.,]+$/.test(s) ? `₹${s}` : s;
}

function Divider({ colors }: { colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

function PriceBlock({ label, value, color, colors }: {
  label: string;
  value: string;
  color?: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={styles.priceBlock}>
      <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.priceValue, { color: color ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value, valueColor, colors }: {
  label: string;
  value: string;
  valueColor?: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  navBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  content: { padding: 16, gap: 12 },
  heroCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  heroRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  titleWrap: { flex: 1 },
  symbol: { fontSize: 24, fontWeight: "700", fontFamily: "Inter_700Bold" },
  stockName: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 },
  signalBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  signalText: { fontSize: 13, fontWeight: "800", fontFamily: "Inter_800ExtraBold", letterSpacing: 0.8 },
  priceGrid: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center" },
  priceBlock: { flex: 1, alignItems: "center", gap: 4 },
  priceLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  priceValue: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  divider: { width: 1, height: 40 },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  infoLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "right", flex: 1 },
  screenshotCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  tapToZoom: { fontSize: 12, fontFamily: "Inter_400Regular" },
  imageSlide: { width: Dimensions.get("window").width - 64, marginRight: 12 },
  imageWrap: { borderRadius: 18, overflow: "hidden", backgroundColor: "#000", aspectRatio: 1.3, position: "relative" },
  image: { width: "100%", height: "100%" },
  imageCaption: { marginTop: 8, fontSize: 12, fontFamily: "Inter_400Regular" },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  notesCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  notes: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center" },
  modalClose: { position: "absolute", top: 54, right: 18, zIndex: 2, width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)" },
  fullImage: { alignSelf: "center" },
});
