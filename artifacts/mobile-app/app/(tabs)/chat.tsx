import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetChatMessages, useSendChatMessage } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

export default function ChatScreen() {
  const colors = useColors();
  const [text, setText] = useState("");
  const flatRef = useRef<FlatList>(null);
  const { data: messages = [], isLoading, refetch } = useGetChatMessages({
    query: { queryKey: ["chatMessages"], refetchInterval: 5000 },
  });
  const { mutate: send, isPending } = useSendChatMessage();

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    send(
      { data: { message: trimmed } },
      {
        onSuccess: () => {
          setText("");
          refetch();
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
        },
      }
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: "#10B981" }]}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]}>Alladin Support</Text>
          <Text style={[styles.headerSub, { color: "#10B981" }]}>● Online</Text>
        </View>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#10B981" />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Feather name="message-circle" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Ask us anything</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Send a message and our team will reply shortly.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isAdmin = item.isAdmin;
            return (
              <View style={[styles.msgRow, isAdmin ? styles.msgLeft : styles.msgRight]}>
                {isAdmin && (
                  <View style={[styles.msgAvatar, { backgroundColor: "#10B981" }]}>
                    <Text style={styles.msgAvatarText}>A</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    isAdmin
                      ? [styles.bubbleAdmin, { backgroundColor: colors.card, borderColor: colors.border }]
                      : styles.bubbleUser,
                  ]}
                >
                  <Text style={[styles.bubbleText, { color: isAdmin ? colors.foreground : "#fff" }]}>
                    {item.message}
                  </Text>
                  <Text style={[styles.bubbleTime, { color: isAdmin ? colors.mutedForeground : "rgba(255,255,255,0.6)" }]}>
                    {new Date(item.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || isPending}
            style={[styles.sendBtn, { opacity: !text.trim() || isPending ? 0.4 : 1 }]}
          >
            <Feather name="send" size={18} color="#fff" />
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  onlineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#10B981",
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "#0D1117",
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 32 },
  msgRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end", gap: 8 },
  msgLeft: { justifyContent: "flex-start" },
  msgRight: { justifyContent: "flex-end" },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  msgAvatarText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
  },
  bubbleAdmin: {
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: "#10B981",
    borderTopRightRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10, alignSelf: "flex-end" },
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
