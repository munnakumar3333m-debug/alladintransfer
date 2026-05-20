import { CheckCircle2, Clock, Gift, Users } from "lucide-react";

export default function ReferralsPage() {
  const referrals = [];
  const isLoading = false;
  const total = 0;
  const rewarded = 0;
  const pending = 0;
  const totalDays = 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Referrals</h1>
        <p className="text-slate-400 text-sm mt-1">
          Users earn 30 free premium days for every friend who subscribes
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Referrals", value: total, icon: Users, color: "emerald" },
          { label: "Rewarded", value: rewarded, icon: CheckCircle2, color: "blue" },
          { label: "Pending", value: pending, icon: Clock, color: "amber" },
          { label: "Days Given Out", value: `${totalDays}d`, icon: Gift, color: "purple" },
        ].map(({ label, value, icon: Icon, color }) => {
          const colorMap: Record<string, string> = {
            emerald: "bg-emerald-500/15 text-emerald-400",
            blue: "bg-blue-500/15 text-blue-400",
            amber: "bg-amber-500/15 text-amber-400",
            purple: "bg-purple-500/15 text-purple-400",
          };
          return (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className={`inline-flex p-2.5 rounded-xl mb-3 ${colorMap[color]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-slate-400 text-sm mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : !referrals || referrals.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Gift className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-500">No referrals yet</p>
            <p className="text-slate-600 text-sm">
              Users share their referral code from the Profile tab in the mobile app
            </p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800">
                {["Referrer", "Referred User", "Status", "Reward", "Date"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referrals.map((r: never) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-medium text-sm">{r.referrerName}</p>
                    <p className="text-slate-500 text-xs font-mono">{r.referrerPhone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{r.referredName}</p>
                    <p className="text-slate-500 text-xs font-mono">{r.referredPhone}</p>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "rewarded" ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Rewarded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">
                    {r.rewardDays} days free
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(r.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
