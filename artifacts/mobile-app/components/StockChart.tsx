import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { useColors } from "@/hooks/useColors";

/* ── interval mapping ──────────────────────────────────── */
const RANGES: { label: string; tv: string }[] = [
  { label: "1D",  tv: "1" },
  { label: "1W",  tv: "15" },
  { label: "1M",  tv: "D" },
  { label: "3M",  tv: "D" },
  { label: "1Y",  tv: "W" },
];

interface StockChartProps {
  symbol: string;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

function chartUrl(symbol: string, interval: string, isDark: boolean): string {
  const tvSymbol = encodeURIComponent(`NSE:${symbol}`);
  const theme    = isDark ? "dark" : "light";
  return (
    `https://www.tradingview.com/chart/` +
    `?symbol=${tvSymbol}` +
    `&interval=${encodeURIComponent(interval)}` +
    `&theme=${theme}` +
    `&style=1` +
    `&timezone=Asia%2FKolkata` +
    `&locale=en` +
    `&hide_top_toolbar=0` +
    `&hide_legend=0` +
    `&allow_symbol_change=0` +
    `&save_image=0` +
    `&hide_side_toolbar=0` +
    `&hide_volume=1` +
    `&withdateranges=1`
  );
}

/* ── JS injected after load: remove volume pane if still visible ── */
const INJECT_JS = `
(function() {
  function hideVolume() {
    document.querySelectorAll(
      '[data-name="volume"], .pane-legend-title--volume, [class*="volumePane"]'
    ).forEach(function(el) { el.style.display = 'none'; });
  }
  hideVolume();
  setTimeout(hideVolume, 1500);
  setTimeout(hideVolume, 3000);
})();
true;
`;

export function StockChart({ symbol, onInteractionStart, onInteractionEnd }: StockChartProps) {
  const colors     = useColors();
  const webviewRef = useRef<WebView>(null);
  const [rangeIdx, setRangeIdx] = useState(2);
  const [loading, setLoading]   = useState(true);

  const isDark = colors.card === "#111827" || colors.background === "#0d1117" || colors.background.toLowerCase() < "#888888";
  const range  = RANGES[rangeIdx];
  const url    = chartUrl(symbol, range.tv, isDark);

  if (Platform.OS === "web") {
    return (
      <View style={[styles.webFallback, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.webFallbackText, { color: colors.mutedForeground }]}>
          Live chart available on the mobile app.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>

      {/* Title + range selector */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {symbol}
        </Text>
        <View style={styles.ranges}>
          {RANGES.map((r, i) => (
            <TouchableOpacity
              key={r.label}
              onPress={() => { setRangeIdx(i); setLoading(true); }}
              style={[
                styles.rangeBtn,
                {
                  backgroundColor: i === rangeIdx ? colors.primary : "transparent",
                  borderColor:     i === rangeIdx ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.rangeText, { color: i === rangeIdx ? "#fff" : colors.mutedForeground }]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chart — touch handlers lock parent scroll */}
      <View
        style={styles.chartWrap}
        onTouchStart={onInteractionStart}
        onTouchEnd={onInteractionEnd}
        onTouchCancel={onInteractionEnd}
      >
        {loading && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.card }]}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Loading {symbol}…
            </Text>
          </View>
        )}
        <WebView
          key={`${symbol}-${rangeIdx}`}
          ref={webviewRef}
          source={{ uri: url }}
          style={styles.webview}
          onLoadEnd={() => {
            setLoading(false);
            webviewRef.current?.injectJavaScript(INJECT_JS);
          }}
          onError={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          scrollEnabled
          nestedScrollEnabled
          originWhitelist={["*"]}
          mixedContentMode="always"
          userAgent={
            "Mozilla/5.0 (Linux; Android 13; Pixel 7) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/120.0.0.0 Mobile Safari/537.36"
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  title:          { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  ranges:         { flexDirection: "row", gap: 5 },
  rangeBtn:       { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, borderWidth: 1 },
  rangeText:      { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  chartWrap:      { height: 420, borderRadius: 12, overflow: "hidden", position: "relative" },
  webview:        { flex: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 12, zIndex: 10, borderRadius: 12 },
  loadingText:    { fontSize: 13, fontFamily: "Inter_400Regular" },
  webFallback:    { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  webFallbackText:{ fontSize: 13, fontFamily: "Inter_400Regular" },
});
