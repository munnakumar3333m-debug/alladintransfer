import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { useColors } from "@/hooks/useColors";

/* ── interval mapping ──────────────────────────────────── */
const RANGES: { label: string; tv: string }[] = [
  { label: "1D",  tv: "1" },   // 1-minute candles for 1 day
  { label: "1W",  tv: "15" },  // 15-minute candles for 1 week
  { label: "1M",  tv: "D" },   // daily candles for 1 month
  { label: "3M",  tv: "D" },   // daily candles for 3 months
  { label: "1Y",  tv: "W" },   // weekly candles for 1 year
];

interface StockChartProps {
  symbol: string;
}

/* ── injected JS: hide nav/header, force dark, set symbol ─ */
function buildInjectScript(symbol: string, interval: string): string {
  const tvSymbol = `NSE:${symbol}`;
  return `
    (function() {
      try {
        // Remove top header bar
        const selectors = [
          '.tv-header', '#tv-header', '[class*="header-"]',
          '[class*="Header"]', '[data-role="header"]',
        ];
        selectors.forEach(s => {
          document.querySelectorAll(s).forEach(el => el.style.display = 'none');
        });
      } catch(e) {}
    })();
    true;
  `;
}

function chartUrl(symbol: string, interval: string, isDark: boolean): string {
  const tvSymbol = encodeURIComponent(`NSE:${symbol}`);
  const theme    = isDark ? "dark" : "light";
  // Use TradingView's full chart app — not the embed widget
  return (
    `https://www.tradingview.com/chart/` +
    `?symbol=${tvSymbol}` +
    `&interval=${encodeURIComponent(interval)}` +
    `&theme=${theme}` +
    `&style=1` +           // 1 = candlestick
    `&timezone=Asia%2FKolkata` +
    `&locale=en` +
    `&hide_top_toolbar=0` +
    `&hide_legend=0` +
    `&allow_symbol_change=0` +
    `&save_image=0` +
    `&hide_side_toolbar=0` +
    `&studies=RSI%40tv-basicstudies` // RSI indicator
  );
}

/* ── JS to switch interval without reloading ──────────────── */
function switchIntervalScript(interval: string): string {
  return `
    (function() {
      try {
        if (window.tvWidget && window.tvWidget.chart) {
          window.tvWidget.chart().setResolution('${interval}');
        }
      } catch(e) {}
    })();
    true;
  `;
}

export function StockChart({ symbol }: StockChartProps) {
  const colors     = useColors();
  const webviewRef = useRef<WebView>(null);
  const [rangeIdx, setRangeIdx] = useState(2); // default 1M
  const [loading, setLoading]   = useState(true);

  const isDark = colors.background.toLowerCase() === "#0d1117";
  const range  = RANGES[rangeIdx];
  const url    = chartUrl(symbol, range.tv, isDark);

  function handleRangeChange(idx: number) {
    setRangeIdx(idx);
    setLoading(true);
    // Try injecting interval change first; if widget isn't available the key change will reload
    webviewRef.current?.injectJavaScript(switchIntervalScript(RANGES[idx].tv));
  }

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
          {symbol} · Live Chart
        </Text>
        <View style={styles.ranges}>
          {RANGES.map((r, i) => (
            <TouchableOpacity
              key={r.label}
              onPress={() => handleRangeChange(i)}
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

      {/* Chart */}
      <View style={styles.chartWrap}>
        {loading && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.card }]}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Loading {symbol} chart…
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
            webviewRef.current?.injectJavaScript(buildInjectScript(symbol, range.tv));
          }}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={["*"]}
          mixedContentMode="always"
          userAgent={
            "Mozilla/5.0 (Linux; Android 13; Pixel 7) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/120.0.0.0 Mobile Safari/537.36"
          }
          onError={() => setLoading(false)}
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
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 12, zIndex: 10 },
  loadingText:    { fontSize: 13, fontFamily: "Inter_400Regular" },
  webFallback:    { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  webFallbackText:{ fontSize: 13, fontFamily: "Inter_400Regular" },
});
