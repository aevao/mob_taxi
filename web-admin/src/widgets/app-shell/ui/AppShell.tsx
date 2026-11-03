import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { ClipboardList, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react";
import { useLogout } from "@/features/auth";
import { useAdminProfile } from "@/entities/session";
import { useAdminStats } from "@/entities/stats";
import { cn } from "@/shared/lib";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/applications", label: "Driver applications", icon: ClipboardList, badge: "pending" },
  { to: "/riders", label: "Riders", icon: Users },
] as const;

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const stats = useAdminStats();
  const profile = useAdminProfile();
  const logout = useLogout();
  const navigate = useNavigate();
  const pending = stats.data?.applications.pending ?? 0;

  const signOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-extrabold text-white">
          W
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-bold text-zinc-900">WHYP</p>
          <p className="text-xs text-zinc-500">Admin console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={"end" in item ? item.end : false}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )
            }
          >
            <item.icon className="size-[18px] shrink-0" strokeWidth={1.75} />
            <span className="flex-1 truncate">{item.label}</span>
            {"badge" in item && pending > 0 ? (
              <span className="rounded-full bg-brand-500 px-2 text-[11px] leading-5 font-semibold text-white tabular-nums">
                {pending}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-zinc-100 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
            {(profile.data?.email[0] ?? "A").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-zinc-900">
              {profile.data?.email ?? "Administrator"}
            </p>
            <p className="text-xs text-zinc-500">Administrator</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-zinc-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200/80 bg-white lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-zinc-950/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-3 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-zinc-200/80 bg-white/80 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-[15px] font-bold text-zinc-900">WHYP Admin</span>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
