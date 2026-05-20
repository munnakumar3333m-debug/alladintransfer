import {
  useGetDashboardStats,
  useGetPerformanceData,
  useGetRevenueAnalytics,
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

const RADIAN = Math.PI / 180;

export default function AnalyticsPage() {
  const { data: stats } = useGetDashboardStats();
  const { data: performance } = useGetPerformanceData();
  const { data: revenue } = useGetRevenueAnalytics();

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
            label: "Total Revenue",
            value: `₹${((revenue?.totalRevenue ?? 0) / 100).toFixed(0)}`,
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
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
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
