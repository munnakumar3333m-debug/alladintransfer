import { clearToken } from "@/lib/auth";
import {
  BarChart3,
  Bell,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/recommendations", label: "Recommendations", icon: Star },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <aside className="w-60 shrink-0 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">AlphaTrade Pro</p>
              <p className="text-slate-500 text-xs">Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <a
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                  {active && (
                    <ChevronRight className="w-3 h-3 ml-auto text-emerald-400" />
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
