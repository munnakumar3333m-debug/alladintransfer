import {
  useGetDashboardStats,
  useGetPerformanceData,
} from "@workspace/api-client-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDown, ArrowUp } from "lucide-react";

const RADIAN = Math.PI / 180;

export default function AnalyticsPage() {
  const { data: stats } = useGetDashboardStats();
  const { data: performance } = useGetPerformanceData();
  const signalCompareData = [
    {
      name: "BUY",
      winRate: stats?.buyWinRate ?? 0,
    },
    {
      name: "SELL",
      winRate: stats?.sellWinRate ?? 0,
    },
  ].filter((entry) => entry.winRate > 0);
  const adminStats = {
    buySignalCount: stats?.buyWinRate ? 1 : 0,
    sellSignalCount: stats?.sellWinRate ? 1 : 0,
  };
  const revenue = {
    monthly: performance?.map((month) => ({
      month: month.month,
      revenue: month.totalPnlPercent ?? 0,
    })) ?? [],
  };

  const pieData = stats
    ? [
        { name: "Target Hit", value: stats.targetHitCount ?? 0, color: "#10b981" },
        { name: "Stop Loss", value: stats.stopLossCount ?? 0, color: "#ef4444" },
        { name: "Active/Hold", value: stats.activeCount ?? 0, color: "#f59e0b" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Platform performance overview</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Win Rate",
            value: `${stats?.winRate?.toFixed(1) ?? 0}%`,
            color: "text-emerald-400",
          },
          {
            label: "Avg P&L",
            value: `${(stats?.avgPnl ?? 0) >= 0 ? "+" : ""}${stats?.avgPnl?.toFixed(2) ?? 0}%`,
            color: (stats?.avgPnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400",
          },
          {
            label: "Total Trades",
            value: stats?.totalTrades ?? 0,
            color: "text-blue-400",
          },
          {
            label: "Recommendations",
            value: stats?.totalRecommendations ?? 0,
            color: "text-purple-400",
          },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* BUY vs SELL signal accuracy */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-white font-semibold">BUY vs SELL Signal Performance</h2>
          <p className="text-slate-400 text-xs mt-1">Accuracy and volume comparison</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* BUY card */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <ArrowUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-emerald-400 font-bold text-sm">BUY SIGNALS</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-slate-400 text-xs">Total Signals</p>
                <p className="text-white text-2xl font-bold">{stats?.todayRecommendationsCount ?? 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Win Rate</p>
                <p className="text-emerald-400 text-2xl font-bold">{stats?.winRate?.toFixed(1) ?? 0}%</p>
              </div>
            </div>
            {/* Win rate bar */}
            <div className="mt-3">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(stats?.winRate ?? 0, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* SELL card */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <ArrowDown className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-red-400 font-bold text-sm">SELL SIGNALS</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-slate-400 text-xs">Total Signals</p>
                <p className="text-white text-2xl font-bold">{stats?.totalTrades ?? 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Win Rate</p>
                <p className="text-red-400 text-2xl font-bold">{stats?.monthlyProfitPercent?.toFixed(1) ?? 0}%</p>
              </div>
            </div>
            {/* Win rate bar */}
            <div className="mt-3">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${Math.min(stats?.monthlyProfitPercent ?? 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-side bar chart */}
        {signalCompareData.length > 0 && (adminStats?.buySignalCount ?? 0) + (adminStats?.sellSignalCount ?? 0) > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={signalCompareData} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(val: number) => [`${val?.toFixed(1)}%`, "Win Rate"]}
              />
              <Bar dataKey="winRate" radius={[6, 6, 0, 0]}>
                {signalCompareData.map((entry, i) => (
                  <Cell key={i} fill={entry.name === "BUY" ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-20 flex items-center justify-center text-slate-500 text-sm">
            P&L data required to show accuracy
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Monthly P&L Performance</h2>
          <p className="text-slate-400 text-xs mb-5">Average return % per month</p>
          {performance && performance.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={performance.slice(-12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(val: number) => [`${val?.toFixed(2)}%`, "Avg P&L"]}
                />
                <Bar dataKey="avgPnl" radius={[4, 4, 0, 0]}>
                  {performance.slice(-12).map((p, i) => (
                    <Cell key={i} fill={(p.avgPnl ?? 0) >= 0 ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Trade Outcomes</h2>
          <p className="text-slate-400 text-xs mb-5">Distribution of results</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + r * Math.cos(-midAngle * RADIAN);
                    const y = cy + r * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11}>
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 xl:col-span-2">
          <h2 className="text-white font-semibold mb-1">Revenue Trend</h2>
          <p className="text-slate-400 text-xs mb-5">Monthly revenue (₹)</p>
          {revenue?.monthly && revenue.monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenue.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#10b981" }}
                  formatter={(val: number) => [`₹${val?.toFixed(0)}`, "Revenue"]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[240px] flex items-center justify-center border border-dashed border-slate-700 rounded-xl">
      <p className="text-slate-500 text-sm">No data yet</p>
    </div>
  );
}
