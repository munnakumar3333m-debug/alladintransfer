import { useGetDashboardStats } from "@workspace/api-client-react";
import {
  Activity,
  CheckCircle2,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetDashboardStats();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={Users}
            color="emerald"
          />
          <StatCard
            label="Premium"
            value={stats?.premiumUsers ?? 0}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            label="Trial"
            value={stats?.trialUsers ?? 0}
            icon={Activity}
            color="amber"
          />
          <StatCard
            label="Expired"
            value={stats?.expiredUsers ?? 0}
            icon={TrendingDown}
            color="red"
          />
          <StatCard
            label="Total Revenue"
            value={`₹${((stats?.totalRevenue ?? 0) / 100).toFixed(0)}`}
            icon={IndianRupee}
            color="emerald"
            wide
          />
          <StatCard
            label="Recommendations"
            value={stats?.totalRecommendations ?? 0}
            icon={Activity}
            color="purple"
          />
          <StatCard
            label="Target Hit"
            value={stats?.targetHitCount ?? 0}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            label="Stop Loss"
            value={stats?.stopLossCount ?? 0}
            icon={XCircle}
            color="red"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Performance Snapshot</h2>
          <p className="text-slate-400 text-xs mb-5">Current key metrics</p>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Win Rate"
              value={`${stats?.winRate?.toFixed(1) ?? 0}%`}
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              label="Avg P&L"
              value={`${(stats?.avgPnl ?? 0) >= 0 ? "+" : ""}${stats?.avgPnl?.toFixed(2) ?? 0}%`}
              icon={TrendingUp}
              color="blue"
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Recommendation Mix</h2>
          <p className="text-slate-400 text-xs mb-5">Signal and outcome summary</p>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Total Signals"
              value={stats?.totalRecommendations ?? 0}
              icon={Activity}
              color="purple"
            />
            <StatCard
              label="Target Hits"
              value={stats?.targetHitCount ?? 0}
              icon={CheckCircle2}
              color="emerald"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-400",
  blue: "bg-blue-500/15 text-blue-400",
  amber: "bg-amber-500/15 text-amber-400",
  red: "bg-red-500/15 text-red-400",
  purple: "bg-purple-500/15 text-purple-400",
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  wide,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 ${wide ? "col-span-2" : ""}`}
    >
      <div className={`inline-flex p-2.5 rounded-xl mb-3 ${COLOR_MAP[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-slate-400 text-sm mt-0.5">{label}</p>
    </div>
  );
}

