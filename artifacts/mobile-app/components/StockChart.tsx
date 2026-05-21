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

function buildHtml(symbol: string, interval: string, isDark: boolean): string {
  const tvSymbol = symbol.includes(":") ? symbol : `NSE:${symbol}`;
  const theme = isDark ? "dark" : "light";
  const bg = isDark ? "#0D1117" : "#ffffff";

  const config = JSON.stringify({
    autosize: true,
    symbol: tvSymbol,
    interval,
    timezone: "Asia/Kolkata",
    theme,
    style: "1",
    locale: "en",
    allow_symbol_change: false,
    calendar: false,
    hide_side_toolbar: true,
    support_host: "https://www.tradingview.com",
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:100%; height:100%; background:${bg}; overflow:hidden; }
  .tradingview-widget-container { width:100%; height:100%; }
  .tradingview-widget-container__widget { width:100%; height:100%; }
</style>
</head>
<body>
<div class="tradingview-widget-container">
  <div class="tradingview-widget-container__widget"></div>
  <script type="text/javascript"
    src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    async="true">${config}</script>
</div>
</body>
</html>`;
}

export function StockChart({ symbol }: StockChartProps) {
  const colors = useColors();
  const [interval, setInterval] = useState("D");
  const [loading, setLoading] = useState(true);
  const isDark = colors.background.toLowerCase() === "#0d1117";

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
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Loading {symbol} chart…
            </Text>
          </View>
        )}
        <WebView
          key={`${symbol}-${interval}`}
          source={{
            html: buildHtml(symbol, interval, isDark),
            baseUrl: "https://www.tradingview.com",
          }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          originWhitelist={["*"]}
          mixedContentMode="always"
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
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
