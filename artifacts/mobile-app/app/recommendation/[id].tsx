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

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  target_hit: "Target Hit",
  stop_loss_hit: "Stop Loss Hit",
  hold: "Hold",
  partial_profit: "Partial Profit",
  closed: "Closed",
};

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

  const { data: rec, isLoading } = useGetRecommendation(Number(id));
  const screenshots = useMemo(() => {
    const list = rec?.screenshots?.length ? rec.screenshots : rec?.screenshotUrl ? [rec.screenshotUrl] : [];
    return list.filter(Boolean);
  }, [rec?.screenshotUrl, rec?.screenshots]);

  const pnl = rec?.pnlPercent ? parseFloat(rec.pnlPercent) : null;
  const isPositive = pnl !== null && pnl >= 0;

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
          {isLoading ? "Loading..." : (rec?.nseSymbol ?? "Detail")}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} size="large" />
      ) : rec ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 24,
            },
          ]}
        >
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.heroRow}>
              <View>
                <Text style={[styles.symbol, { color: colors.foreground }]}>{rec.nseSymbol}</Text>
                <Text style={[styles.stockName, { color: colors.mutedForeground }]}>{rec.stockName}</Text>
              </View>
              {pnl !== null && (
                <View style={[styles.pnlBadge, { backgroundColor: isPositive ? colors.positive + "22" : colors.negative + "22" }]}> 
                  <Text style={[styles.pnlText, { color: isPositive ? colors.positive : colors.negative }]}>
                    {isPositive ? "+" : ""}{pnl.toFixed(2)}%
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.tagsRow}>
              <Tag label={rec.tradeType.toUpperCase()} color="#818CF8" colors={colors} />
              <Tag label={STATUS_LABEL[rec.status] ?? rec.status} color={rec.status === "target_hit" ? colors.positive : rec.status === "stop_loss_hit" ? colors.negative : colors.warning} colors={colors} />
              <Tag label={`Risk: ${rec.riskLevel?.toUpperCase()}`} color={RISK_COLOR[rec.riskLevel ?? "medium"]} colors={colors} />
            </View>
          </View>

          <View style={[styles.priceGrid, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <PriceBlock label="Buy Price" value={`₹${rec.buyPrice}`} colors={colors} />
            <Divider colors={colors} />
            <PriceBlock label="Target" value={`₹${rec.targetPrice}`} color={colors.positive} colors={colors} />
            <Divider colors={colors} />
            <PriceBlock label="Stop Loss" value={`₹${rec.stopLoss}`} color={colors.negative} colors={colors} />
            {rec.exitPrice && (
              <>
                <Divider colors={colors} />
                <PriceBlock label="Exit Price" value={`₹${rec.exitPrice}`} colors={colors} accent />
              </>
            )}
          </View>

          {(pnl !== null || rec.pnlAbsolute) && (
            <View style={[styles.pnlCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>P&L Summary</Text>
              <View style={styles.pnlRow}>
                {pnl !== null && (
                  <View style={styles.pnlItem}>
                    <Text style={[styles.pnlLabel, { color: colors.mutedForeground }]}>Return</Text>
                    <Text style={[styles.pnlValue, { color: isPositive ? colors.positive : colors.negative }]}>
                      {isPositive ? "+" : ""}{pnl.toFixed(2)}%
                    </Text>
                  </View>
                )}
                {rec.pnlAbsolute && (
                  <View style={styles.pnlItem}>
                    <Text style={[styles.pnlLabel, { color: colors.mutedForeground }]}>Absolute</Text>
                    <Text style={[styles.pnlValue, { color: parseFloat(rec.pnlAbsolute) >= 0 ? colors.positive : colors.negative }]}>
                      {parseFloat(rec.pnlAbsolute) >= 0 ? "+" : ""}₹{rec.pnlAbsolute}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {screenshots.length > 0 && (
            <View style={[styles.screenshotCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stock Analysis Screenshot</Text>
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
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator color={colors.primary} />
                      </View>
                    </View>
                    <Text style={[styles.imageCaption, { color: colors.mutedForeground }]}>Screenshot {i + 1}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.dotsRow}>
                {screenshots.map((_, i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: i === index ? colors.primary : colors.border }]} />
                ))}
              </View>
            </View>
          )}

          {rec.notes && (
            <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Analysis</Text>
              <Text style={[styles.notes, { color: colors.mutedForeground }]}>{rec.notes}</Text>
            </View>
          )}

          <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <MetaRow icon="calendar" label="Date" value={rec.date} colors={colors} />
            {rec.createdAt && (
              <MetaRow icon="clock" label="Posted" value={new Date(rec.createdAt).toLocaleString("en-IN")} colors={colors} />
            )}
          </View>
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

function Tag({ label, color, colors }: { label: string; color: string; colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  return (
    <View style={[styles.tag, { backgroundColor: color + "22" }]}> 
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

function PriceBlock({ label, value, color, colors, accent }: {
  label: string;
  value: string;
  color?: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  accent?: boolean;
}) {
  const c = color ?? (accent ? colors.primary : colors.foreground);
  return (
    <View style={styles.priceBlock}>
      <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.priceValue, { color: c }]}>{value}</Text>
    </View>
  );
}

function MetaRow({ icon, label, value, colors }: {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={styles.metaRow}>
      <Feather name={icon as "calendar"} size={14} color={colors.mutedForeground} />
      <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: colors.foreground }]}>{value}</Text>
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
  heroCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  heroRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  symbol: { fontSize: 24, fontWeight: "700", fontFamily: "Inter_700Bold" },
  stockName: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 },
  pnlBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  pnlText: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  priceGrid: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center" },
  priceBlock: { flex: 1, alignItems: "center", gap: 4 },
  priceLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  priceValue: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  divider: { width: 1, height: 40 },
  pnlCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  pnlRow: { flexDirection: "row", gap: 24 },
  pnlItem: { gap: 4 },
  pnlLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  pnlValue: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  screenshotCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tapToZoom: { fontSize: 12, fontFamily: "Inter_400Regular" },
  imageSlide: { width: Dimensions.get("window").width - 64, marginRight: 12 },
  imageWrap: { borderRadius: 18, overflow: "hidden", backgroundColor: "#000", aspectRatio: 1.3, position: "relative" },
  image: { width: "100%", height: "100%" },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.12)" },
  imageCaption: { marginTop: 8, fontSize: 12, fontFamily: "Inter_400Regular" },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  notesCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  notes: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  metaCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  metaLabel: { fontSize: 13, fontFamily: "Inter_400Regular", width: 56 },
  metaValue: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center" },
  modalClose: { position: "absolute", top: 54, right: 18, zIndex: 2, width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)" },
  fullImage: { alignSelf: "center" },
});