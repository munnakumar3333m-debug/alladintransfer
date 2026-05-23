import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import {
  generateFakeMessages,
  visibleFakeMessages,
  type FakeMessage,
} from "@/utils/communityFeed";

interface RealMessage {
  id: number;
  userId: number;
  userName: string;
  message: string;
  createdAt: string;
  isFake?: false;
}

type FeedItem = FakeMessage | RealMessage;

function todayISTString(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

function getAvatarInitial(name: string): string {
  return name ? name[0].toUpperCase() : "?";
}

const FAKE_AVATAR_COLORS = [
  "#10B981","#6366F1","#F59E0B","#EF4444","#8B5CF6",
  "#EC4899","#14B8A6","#F97316","#3B82F6","#84CC16",
];

function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = Math.imul(h, 31) + name.charCodeAt(i);
  return FAKE_AVATAR_COLORS[Math.abs(h) % FAKE_AVATAR_COLORS.length];
}

const FAKE_MEMBER_COUNT = 4247;

export default function CommunityScreen() {
  const colors = useColors();
  const { user, token } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [realMessages, setRealMessages] = useState<RealMessage[]>([]);
  const [fakeMessages, setFakeMessages] = useState<FakeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const flatRef = useRef<FlatList>(null);
  const dateStr = todayISTString();

  const fetchReal = useCallback(async () => {
    try {
      const res = await fetch("/api/community", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as RealMessage[];
        setRealMessages(data);
      }
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    const fakes = generateFakeMessages(dateStr, [], 180);
    setFakeMessages(fakes);
  }, [dateStr]);

  useEffect(() => {
    fetchReal().finally(() => setLoading(false));
    const interval = setInterval(fetchReal, 8000);
    return () => clearInterval(interval);
  }, [fetchReal]);

  const feed: FeedItem[] = React.useMemo(() => {
    const nowMs = Date.now();
    const visible = visibleFakeMessages(fakeMessages, nowMs);
    const all: FeedItem[] = [...visible, ...realMessages];
    all.sort((a, b) => {
      const ta = "timestampMs" in a ? a.timestampMs : new Date(a.createdAt).getTime();
      const tb = "timestampMs" in b ? b.timestampMs : new Date(b.createdAt).getTime();
      return ta - tb;
    });
    return all;
  }, [fakeMessages, realMessages]);

  useEffect(() => {
    if (feed.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [feed.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: trimmed }),
      });
      if (res.ok) {
        const msg = (await res.json()) as RealMessage;
        setRealMessages((prev) => [...prev, msg]);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
      }
    } catch { /* silent */ } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    const isFake = "isFake" in item && item.isFake;
    const isMe = !isFake && (item as RealMessage).userId === user?.id;
    const name = isFake ? (item as FakeMessage).userName : (item as RealMessage).userName;
    const avatarColor = isFake
      ? (item as FakeMessage).avatarColor
      : hashColor(name);
    const msgTime = isFake
      ? new Date((item as FakeMessage).timestampMs).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      : new Date((item as RealMessage).createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    if (isMe) {
      return (
        <View style={[styles.row, styles.rowRight]}>
          <View style={styles.bubbleMe}>
            <Text style={styles.bubbleMeText}>{item.message}</Text>
            <Text style={styles.bubbleTime}>{msgTime}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.row, styles.rowLeft]}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{getAvatarInitial(name)}</Text>
        </View>
        <View style={[styles.bubbleOther, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.senderName, { color: avatarColor }]}>{name}</Text>
          <Text style={[styles.bubbleOtherText, { color: colors.foreground }]}>{item.message}</Text>
          <Text style={[styles.bubbleTimeOther, { color: colors.mutedForeground }]}>{msgTime}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.communityIcon, { backgroundColor: "#10B98120" }]}>
          <Feather name="users" size={18} color="#10B981" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Community</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Live</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#10B981" />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={feed}
          keyExtractor={(item) => "isFake" in item && item.isFake ? item.id : `real-${(item as RealMessage).id}`}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="message-circle" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Community chat starts at 9 AM</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{"Users with loose talk, vulgarity or offensive words will be get banned immediately from our side.\nHere we only talk about markets.\n— TEAM ALLADIN"}</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Message the community..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={[styles.sendBtn, { opacity: !text.trim() || sending ? 0.4 : 1 }]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 12,
  },
  communityIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#10B981" },
  onlineText: { fontSize: 12, color: "#10B981", fontFamily: "Inter_400Regular" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 12, paddingBottom: 8, flexGrow: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  row: { flexDirection: "row", marginBottom: 10, alignItems: "flex-end", gap: 8 },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginBottom: 2,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 12, fontFamily: "Inter_700Bold" },
  bubbleOther: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    gap: 2,
  },
  senderName: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  bubbleOtherText: { fontSize: 13.5, lineHeight: 19, fontFamily: "Inter_400Regular" },
  bubbleTimeOther: { fontSize: 10, alignSelf: "flex-end", marginTop: 2, fontFamily: "Inter_400Regular" },
  bubbleMe: {
    maxWidth: "75%",
    backgroundColor: "#10B981",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
    borderTopRightRadius: 4,
    gap: 2,
  },
  bubbleMeText: { fontSize: 13.5, color: "#fff", lineHeight: 19, fontFamily: "Inter_400Regular" },
  bubbleTime: { fontSize: 10, color: "rgba(255,255,255,0.65)", alignSelf: "flex-end", fontFamily: "Inter_400Regular" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
});
