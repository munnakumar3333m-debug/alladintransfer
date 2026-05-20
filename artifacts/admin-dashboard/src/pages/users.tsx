import {
  useAdminListUsers,
  useAdminUpdateUser,
} from "@workspace/api-client-react";
import { useState } from "react";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  UserCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  premium: { label: "Premium", color: "text-emerald-400 bg-emerald-500/10" },
  trial: { label: "Trial", color: "text-amber-400 bg-amber-500/10" },
  expired: { label: "Expired", color: "text-red-400 bg-red-500/10" },
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [extendId, setExtendId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useAdminListUsers({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter as "all",
  });

  const { mutate: updateUser } = useAdminUpdateUser({
    mutation: {
      onSuccess: () => {
        refetch();
        setExtendId(null);
      },
    },
  });

  const users = data?.users ?? [];
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-slate-400 text-sm mt-1">
          {data?.total ?? 0} total users
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, phone..."
            className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        {["all", "trial", "premium", "expired"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
              statusFilter === s
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Name", "Phone", "Email", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const status = STATUS_MAP[u.subscriptionType] ?? { label: u.subscriptionType, color: "text-slate-400 bg-slate-800" };
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors ${u.isBlocked ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">{u.phone}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{u.email ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateUser({ id: u.id, data: { isBlocked: !u.isBlocked } })}
                          title={u.isBlocked ? "Unblock" : "Block"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.isBlocked
                              ? "text-emerald-400 hover:bg-emerald-500/10"
                              : "text-red-400 hover:bg-red-500/10"
                          }`}
                        >
                          {u.isBlocked ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            const days = parseInt(prompt("Extend by how many days?", "30") ?? "0");
                            if (days > 0) {
                              updateUser({ id: u.id, data: { extendDays: days } });
                            }
                          }}
                          title="Extend subscription"
                          className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="bg-slate-900 border-slate-700 text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-slate-400 text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="bg-slate-900 border-slate-700 text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
