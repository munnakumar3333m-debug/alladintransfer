import { useState } from "react";
import { Bell, CheckCircle2, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "premium" | "trial">("all");
  const [sent, setSent] = useState(false);
  const history: Array<{ id: string; title: string; body: string; audience?: string; createdAt: string }> = [];
  const isPending = false;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    setSent(true);
    setTitle("");
    setBody("");
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-slate-400 text-sm mt-1">Send push notifications to users</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Send Notification</h2>

          {sent && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-emerald-400 text-sm">Notification sent successfully!</p>
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">Audience</Label>
              <div className="flex gap-2">
                {["all", "premium", "trial"].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAudience(a as typeof audience)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                      audience === a
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Stock Pick — RELIANCE"
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">Message</Label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. Today's intraday pick: Buy above ₹2850, Target ₹3100, SL ₹2750"
                required
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 resize-none h-28 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending || !title || !body}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold gap-2"
            >
              <Send className="w-4 h-4" />
              {isPending ? "Sending..." : "Send Notification"}
            </Button>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Recent Notifications</h2>
          {!history || history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 border border-dashed border-slate-700 rounded-xl">
              <Bell className="w-8 h-8 text-slate-600" />
              <p className="text-slate-500 text-sm">No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {history.map((n) => (
                <div
                  key={n.id}
                  className="bg-slate-800 rounded-xl p-4 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white font-medium text-sm">{n.title}</p>
                    <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                      <Users className="w-3 h-3" />
                      <span className="text-xs capitalize">{n.audience ?? "all"}</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2">{n.body}</p>
                  <p className="text-slate-600 text-xs">
                    {new Date(n.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
