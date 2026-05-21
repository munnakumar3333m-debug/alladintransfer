import { useGetTodayQuote, usePostDailyQuote } from "@workspace/api-client-react";
import { Quote } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function QuotesPage() {
  const { data: existing, isLoading, refetch } = useGetTodayQuote();
  const { mutate: post, isPending } = usePostDailyQuote({
    mutation: { onSuccess: () => refetch() },
  });

  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.trim()) return;
    post({ data: { quote: quote.trim(), author: author.trim() || undefined } });
  };

  const handleEdit = () => {
    if (existing) {
      setQuote(existing.quote);
      setAuthor(existing.author ?? "");
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Daily Quote</h1>
        <p className="text-slate-400 text-sm mt-1">
          Post today's investing or trading quote. It appears at the top of the home screen for all users.
        </p>
      </div>

      {/* Today's current quote */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Quote className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Today's Quote</span>
          <span className="ml-auto text-xs text-slate-500">
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {isLoading ? (
          <div className="h-10 bg-slate-800 rounded-lg animate-pulse" />
        ) : existing ? (
          <div className="space-y-2">
            <p className="text-white text-lg leading-relaxed italic">"{existing.quote}"</p>
            {existing.author && (
              <p className="text-slate-400 text-sm">— {existing.author}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-slate-700 text-slate-300 hover:text-white"
              onClick={handleEdit}
            >
              Edit Quote
            </Button>
          </div>
        ) : (
          <p className="text-slate-500 italic">No quote posted for today yet.</p>
        )}
      </div>

      {/* Post / update form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
        <h2 className="text-base font-semibold text-white">
          {existing ? "Update Today's Quote" : "Post Today's Quote"}
        </h2>

        <div className="space-y-2">
          <Label className="text-slate-300">Quote *</Label>
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="e.g. The stock market is a device for transferring money from the impatient to the patient."
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Author / Source <span className="text-slate-500 font-normal">(optional)</span></Label>
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. Warren Buffett"
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
          />
        </div>

        <Button
          type="submit"
          disabled={isPending || !quote.trim()}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold w-full"
        >
          {isPending ? "Posting..." : existing ? "Update Quote" : "Post Quote"}
        </Button>
      </form>
    </div>
  );
}
