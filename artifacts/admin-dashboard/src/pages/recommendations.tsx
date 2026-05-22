import {
  useCreateRecommendation,
  useDeleteRecommendation,
  useListRecommendations,
  useUpdateRecommendationPnl,
} from "@workspace/api-client-react";
import type { Recommendation } from "@workspace/api-client-react";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function fmtPrice(val: string | number | null | undefined): string {
  if (val == null) return "—";
  const s = String(val).trim();
  return /^[\d.,]+$/.test(s) ? `₹${s}` : s;
}

const STATUS_COLOR: Record<string, string> = {
  active: "text-amber-400 bg-amber-500/10",
  target_hit: "text-emerald-400 bg-emerald-500/10",
  stop_loss_hit: "text-red-400 bg-red-500/10",
  hold: "text-blue-400 bg-blue-500/10",
  partial_profit: "text-purple-400 bg-purple-500/10",
  closed: "text-slate-400 bg-slate-800",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  target_hit: "Target Hit",
  stop_loss_hit: "Stop Loss",
  hold: "Hold",
  partial_profit: "Partial",
  closed: "Closed",
};

export default function RecommendationsPage() {
  const [page, setPage] = useState(1);
  const [signalFilter, setSignalFilter] = useState<"" | "BUY" | "SELL">("");
  const [showCreate, setShowCreate] = useState(false);
  const [pnlModal, setPnlModal] = useState<Recommendation | null>(null);

  const { data, isLoading, refetch } = useListRecommendations({
    page,
    limit: 20,
    ...(signalFilter ? { signalType: signalFilter } : {}),
  });
  const { mutate: create, isPending: creating } = useCreateRecommendation({
    mutation: { onSuccess: () => { refetch(); setShowCreate(false); } },
  });
  const { mutate: deleteFn } = useDeleteRecommendation({
    mutation: { onSuccess: () => refetch() },
  });
  const { mutate: updatePnl, isPending: updatingPnl } = useUpdateRecommendationPnl({
    mutation: { onSuccess: () => { refetch(); setPnlModal(null); } },
  });

  const recs = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Recommendations</h1>
          <p className="text-slate-400 text-sm mt-1">{data?.total ?? 0} total</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold gap-2">
          <Plus className="w-4 h-4" /> New Pick
        </Button>
      </div>

      <div className="flex gap-2">
        {(["", "BUY", "SELL"] as const).map((f) => (
          <button
            key={f || "all"}
            onClick={() => { setSignalFilter(f); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              signalFilter === f
                ? f === "BUY"
                  ? "bg-emerald-500 text-slate-950"
                  : f === "SELL"
                    ? "bg-red-500 text-white"
                    : "bg-slate-700 text-white"
                : "bg-slate-900 border border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {f === "BUY" && <ArrowUp className="w-3.5 h-3.5" />}
            {f === "SELL" && <ArrowDown className="w-3.5 h-3.5" />}
            {f === "" ? "All Signals" : `${f} Signals`}
          </button>
        ))}
      </div>

      {showCreate && (
        <CreateForm
          onCreate={(d) => create({ data: d })}
          isPending={creating}
          onClose={() => setShowCreate(false)}
        />
      )}

      {pnlModal && (
        <PnlModal
          rec={pnlModal}
          onSave={(d) => updatePnl({ id: pnlModal.id, data: d })}
          isPending={updatingPnl}
          onClose={() => setPnlModal(null)}
        />
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : recs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No recommendations found</div>
        ) : (
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-800">
                {["Signal", "Symbol", "Stock", "Entry", "Target", "SL", "Type", "Status", "P&L", "Date", "Screenshots", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recs.map((r) => {
                const pnl = r.pnlPercent ? parseFloat(String(r.pnlPercent)) : null;
                const pos = pnl !== null && pnl >= 0;
                const isBuy = r.signalType === "BUY";
                return (
                  <tr key={r.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${isBuy ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
                        {isBuy ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {r.signalType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-bold">{r.nseSymbol}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[140px] truncate">{r.stockName}</td>
                    <td className="px-4 py-3 text-slate-300">{fmtPrice(String(r.buyPrice))}</td>
                    <td className="px-4 py-3 text-emerald-400">{fmtPrice(String(r.targetPrice))}</td>
                    <td className="px-4 py-3 text-red-400">{fmtPrice(String(r.stopLoss))}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs text-purple-300 bg-purple-500/10 capitalize">{r.tradeType}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLOR[r.status] ?? "text-slate-400 bg-slate-800"}`}>{STATUS_LABEL[r.status] ?? r.status}</span></td>
                    <td className="px-4 py-3">{pnl !== null ? <span className={`flex items-center gap-1 text-sm font-semibold ${pos ? "text-emerald-400" : "text-red-400"}`}>{pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{pos ? "+" : ""}{pnl.toFixed(2)}%</span> : <span className="text-slate-600">—</span>}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{r.date}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{(r.screenshots?.length ?? (r.screenshotUrl ? 1 : 0))} images</td>
                    <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => setPnlModal(r)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Update P&L"><Edit3 className="w-3.5 h-3.5" /></button><button onClick={() => { if (confirm(`Delete ${r.nseSymbol}?`)) deleteFn({ id: r.id }); }} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="bg-slate-900 border-slate-700 text-slate-300"><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-slate-400 text-sm">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="bg-slate-900 border-slate-700 text-slate-300"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      )}
    </div>
  );
}

function CreateForm({ onCreate, isPending, onClose }: {
  onCreate: (data: Parameters<ReturnType<typeof useCreateRecommendation>["mutate"]>[0]["data"]) => void;
  isPending: boolean;
  onClose: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [signalType, setSignalType] = useState<"BUY" | "SELL">("BUY");
  const [screenshotText, setScreenshotText] = useState("");
  const [form, setForm] = useState({
    stockName: "",
    nseSymbol: "",
    buyPrice: "Opening Price",
    targetPrice: "2%",
    stopLoss: "None",
    tradeType: "intraday" as const,
    riskLevel: "medium" as const,
    notes: "",
    date: today,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...form,
      signalType,
    } as any);
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-4">New Recommendation</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-slate-300 text-xs">Signal Type</Label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setSignalType("BUY")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border-2 ${signalType === "BUY" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500"}`}><ArrowUp className="w-4 h-4" />BUY SIGNAL</button>
            <button type="button" onClick={() => setSignalType("SELL")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border-2 ${signalType === "SELL" ? "bg-red-500/20 border-red-500 text-red-400" : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500"}`}><ArrowDown className="w-4 h-4" />SELL SIGNAL</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FormField label="Stock Name" value={form.stockName} onChange={set("stockName")} required />
          <FormField label="NSE Symbol" value={form.nseSymbol} onChange={set("nseSymbol")} required />
          <FormField label="Date" type="date" value={form.date} onChange={set("date")} required />
          <FormField label="Entry Price" value={form.buyPrice} onChange={set("buyPrice")} placeholder="e.g. 245.50 or CMP" required />
          <FormField label="Target Price" value={form.targetPrice} onChange={set("targetPrice")} placeholder="e.g. 280 or 280-300" required />
          <FormField label="Stop Loss" value={form.stopLoss} onChange={set("stopLoss")} placeholder="e.g. 230 or Below 230" required />
          <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Trade Type</Label><select value={form.tradeType} onChange={set("tradeType") as any} className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2"><option value="intraday">Intraday</option><option value="swing">Swing</option><option value="positional">Positional</option></select></div>
          <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Risk Level</Label><select value={form.riskLevel} onChange={set("riskLevel") as any} className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          <div className="space-y-1.5 col-span-2 md:col-span-3"><Label className="text-slate-300 text-xs">Notes (optional)</Label><textarea value={form.notes} onChange={set("notes")} className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 resize-none h-20" placeholder="Analysis notes..." /></div>
          <div className="space-y-1.5 col-span-2 md:col-span-3"><Label className="text-slate-300 text-xs">Screenshot URLs (optional, one per line)</Label><textarea value={screenshotText} onChange={(e) => setScreenshotText(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 resize-none h-24" placeholder="https://...jpg\nhttps://...png" /></div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400">Cancel</Button>
          <Button type="submit" disabled={isPending} className={`font-semibold ${signalType === "BUY" ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950" : "bg-red-500 hover:bg-red-400 text-white"}`}>{isPending ? "Creating..." : `Create ${signalType} Signal`}</Button>
        </div>
      </form>
    </div>
  );
}

function PnlModal({ rec, onSave, isPending, onClose }: { rec: Recommendation; onSave: (d: { exitPrice: number; pnlPercent: number; pnlAbsolute: number; status: "target_hit" | "stop_loss_hit" | "partial_profit" | "closed" }) => void; isPending: boolean; onClose: () => void; }) {
  const [exitPrice, setExitPrice] = useState(rec.exitPrice ?? "");
  const [status, setStatus] = useState<string>(rec.status === "active" ? "target_hit" : rec.status);
  const handleSave = () => {
    const ep = parseFloat(String(exitPrice));
    const bp = parseFloat(String(rec.buyPrice));
    if (isNaN(ep) || isNaN(bp)) return;
    const pnlPercent = ((ep - bp) / bp) * 100;
    const pnlAbsolute = ep - bp;
    onSave({ exitPrice: ep, pnlPercent, pnlAbsolute, status: status as any });
  };
  const isBuy = rec.signalType === "BUY";
  return (<div className={`bg-slate-900 border rounded-2xl p-6 space-y-4 ${isBuy ? "border-emerald-500/30" : "border-red-500/30"}`}><div className="flex items-center gap-3"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${isBuy ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>{isBuy ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{rec.signalType}</span><h3 className="text-white font-semibold">Update P&L — {rec.nseSymbol}</h3></div><p className="text-slate-400 text-sm">Entry: ₹{rec.buyPrice} · Target: ₹{rec.targetPrice} · SL: ₹{rec.stopLoss}</p><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><Label className="text-slate-300 text-xs">Exit Price</Label><Input value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} type="number" placeholder="Exit price" className="bg-slate-800 border-slate-700 text-white" /></div><div className="space-y-1.5"><Label className="text-slate-300 text-xs">Status</Label><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2"><option value="target_hit">Target Hit</option><option value="stop_loss_hit">Stop Loss Hit</option><option value="partial_profit">Partial Profit</option><option value="closed">Closed</option></select></div></div>{exitPrice && (<div className="bg-slate-800 rounded-xl p-3"><p className="text-slate-400 text-xs mb-1">Preview P&L</p>{(() => { const ep = parseFloat(String(exitPrice)); const bp = parseFloat(String(rec.buyPrice)); const pnl = isNaN(ep) || isNaN(bp) ? null : ((ep - bp) / bp) * 100; return pnl !== null ? (<p className={`text-lg font-bold ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%</p>) : null; })()}</div>)}<div className="flex gap-3 justify-end"><Button variant="ghost" onClick={onClose} className="text-slate-400">Cancel</Button><Button onClick={handleSave} disabled={isPending} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold">{isPending ? "Saving..." : "Save P&L"}</Button></div></div>);
}

function FormField({ label, value, onChange, type = "text", required, placeholder }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; required?: boolean; placeholder?: string; }) {
  return (<div className="space-y-1.5"><Label className="text-slate-300 text-xs">{label}</Label><Input value={value} onChange={onChange} type={type} required={required} placeholder={placeholder} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" /></div>);
}
