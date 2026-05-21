import React, { useState } from "react";
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

const INTERVALS = [
  { label: "1D", value: "D" },
  { label: "1W", value: "W" },
  { label: "1M", value: "M" },
  { label: "3M", value: "3M" },
];

interface StockChartProps {
  symbol: string;
}

function chartUrl(symbol: string, interval: string, isDark: boolean): string {
  const tvSymbol = encodeURIComponent(
    symbol.includes(":") ? symbol : `NSE:${symbol}`
  );
  const theme = isDark ? "dark" : "light";
  return (
    `https://www.tradingview.com/widgetembed/` +
    `?symbol=${tvSymbol}` +
    `&interval=${encodeURIComponent(interval)}` +
    `&theme=${theme}` +
    `&style=1` +
    `&timezone=Asia%2FKolkata` +
    `&locale=en` +
    `&hide_side_toolbar=1` +
    `&allow_symbol_change=0` +
    `&save_image=0` +
    `&studies=RSI%40tv-basicstudies`
  );
}

export function StockChart({ symbol }: StockChartProps) {
  const colors = useColors();
  const [interval, setInterval] = useState("D");
  const [loading, setLoading] = useState(true);
  const isDark =
    colors.background.toLowerCase() === "#0d1117" ||
    colors.background === "#0D1117";

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.webFallback,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.webFallbackText, { color: colors.mutedForeground }]}>
          Live chart available on the mobile app.
        </Text>
      </View>
    );
  }

  const url = chartUrl(symbol, interval, isDark);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Live Chart · {symbol}
        </Text>
        <View style={styles.intervals}>
          {INTERVALS.map((iv) => (
            <TouchableOpacity
              key={iv.value}
              onPress={() => {
                setInterval(iv.value);
                setLoading(true);
              }}
              style={[
                styles.ivBtn,
                {
                  backgroundColor:
                    interval === iv.value ? colors.primary : "transparent",
                  borderColor:
                    interval === iv.value ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.ivText,
                  {
                    color:
                      interval === iv.value ? "#fff" : colors.mutedForeground,
                  },
                ]}
              >
                {iv.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.chartWrap}>
        {loading && (
          <View
            style={[styles.loadingOverlay, { backgroundColor: colors.card }]}
          >
            <ActivityIndicator color={colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: colors.mutedForeground },
              ]}
            >
              Loading {symbol} chart…
            </Text>
          </View>
        )}
        <WebView
          key={`${symbol}-${interval}`}
          source={{ uri: url }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          originWhitelist={["*"]}
          mixedContentMode="always"
          thirdPartyCookiesEnabled
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  intervals: {
    flexDirection: "row",
    gap: 6,
  },
  ivBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  ivText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  chartWrap: {
    height: 320,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  webFallback: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  webFallbackText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
