import { useState, useEffect, useRef } from "react";
import { useGetChatConversations, useGetConversationMessages, useSendAdminMessage, useMarkConversationRead } from "@workspace/api-client-react";
import { MessageCircle, Send, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], refetch: refetchConvs } = useGetChatConversations({
    query: { refetchInterval: 5000 },
  });

  const { data: messages = [], refetch: refetchMsgs } = useGetConversationMessages(
    selectedUserId ?? 0,
    { query: { enabled: !!selectedUserId, refetchInterval: 4000 } }
  );

  const { mutate: sendMsg, isPending } = useSendAdminMessage();
  const { mutate: markRead } = useMarkConversationRead();

  useEffect(() => {
    if (selectedUserId) {
      markRead({ userId: selectedUserId });
      refetchConvs();
    }
  }, [selectedUserId, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!selectedUserId || !message.trim() || isPending) return;
    sendMsg(
      { userId: selectedUserId, data: { message: message.trim() } },
      {
        onSuccess: () => {
          setMessage("");
          refetchMsgs();
          refetchConvs();
        },
      }
    );
  };

  const selectedConv = conversations.find((c) => c.userId === selectedUserId);

  return (
    <div className="flex h-full">
      {/* Sidebar — conversation list */}
      <div className="w-72 shrink-0 border-r border-slate-800 flex flex-col bg-slate-950">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            Conversations
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No messages yet</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.userId}
                onClick={() => setSelectedUserId(conv.userId)}
                className={`w-full text-left px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors ${selectedUserId === conv.userId ? "bg-slate-800" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <span className="text-emerald-400 text-xs font-bold">{conv.userName[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-white text-sm font-medium">{conv.userName}</span>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-emerald-500 text-slate-950 text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs truncate pl-10">{conv.lastMessage}</p>
                <p className="text-slate-600 text-xs pl-10 mt-0.5">{conv.userPhone}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-slate-900">
        {!selectedUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
            <MessageCircle className="w-16 h-16 opacity-30" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm">Choose a user from the left to view messages</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <span className="text-emerald-400 font-bold">{selectedConv?.userName[0]?.toUpperCase()}</span>
              </div>
              <div>
                <p className="text-white font-semibold">{selectedConv?.userName}</p>
                <p className="text-slate-500 text-xs">{selectedConv?.userPhone}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm pt-10">No messages yet. Start the conversation!</div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}>
                  {!msg.isAdmin && (
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center mr-2 shrink-0 self-end">
                      <User className="w-3 h-3 text-slate-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.isAdmin
                        ? "bg-emerald-500 text-slate-950 rounded-tr-sm font-medium"
                        : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700"
                    }`}
                  >
                    <p className="leading-relaxed">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.isAdmin ? "text-emerald-900/70" : "text-slate-500"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-800 flex gap-3">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type a reply..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isPending}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
