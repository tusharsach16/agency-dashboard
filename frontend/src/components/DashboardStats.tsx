import { DashboardStats as StatsType, Role } from "../types";

interface DashboardStatsProps {
  stats: StatsType | null;
  loading: boolean;
  role?: Role;
  onlineCount?: number | null;
}

export function DashboardStats({ stats, loading, role, onlineCount }: DashboardStatsProps) {
  const isDeveloper = role === "DEVELOPER";
  const isAdmin = role === "ADMIN";

  if (loading && !stats) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-4 mb-6`}>
        {(isAdmin ? [1, 2, 3, 4, 5] : [1, 2, 3, 4]).map((i) => (
          <div
            key={i}
            className="h-32 bg-card-light dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const totalTasks = stats.totalTasks || 0;
  const doneTasks = stats.statusBreakdown.DONE || 0;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const displayOnlineCount = typeof onlineCount === "number" ? onlineCount : 1;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-4 mb-6`}>
      <div className="bg-card-light dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-2xl p-5 shadow-soft-light dark:shadow-soft-dark transition-all hover:border-black/20 dark:hover:border-white/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isDeveloper ? "Active Projects" : "Total Projects"}
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        </div>
        <div className="mt-3 font-heading font-extrabold text-3xl text-slate-900 dark:text-white">
          {stats.totalProjects}
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {isDeveloper ? "Projects with assigned tasks" : "Within organizational scope"}
        </p>
      </div>

      <div className="bg-card-light dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-2xl p-5 shadow-soft-light dark:shadow-soft-dark transition-all hover:border-black/20 dark:hover:border-white/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isDeveloper ? "My Tasks" : "Total Tasks"}
          </span>
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-heading font-extrabold text-3xl text-slate-900 dark:text-white">
            {stats.totalTasks}
          </span>
          <span className="text-xs font-semibold text-teal-500 font-heading">
            {progressPercent}% Done
          </span>
        </div>
        <div className="mt-2.5 w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-teal-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className={`bg-card-light dark:bg-card-dark border rounded-2xl p-5 shadow-soft-light dark:shadow-soft-dark transition-all ${
        stats.overdueTasks > 0
          ? "border-red-500/40 dark:border-red-500/40 bg-red-500/[0.02]"
          : "border-black/10 dark:border-white/10"
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isDeveloper ? "My Overdue" : "Overdue Tasks"}
          </span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            stats.overdueTasks > 0 ? "bg-red-500/15 text-red-500" : "bg-black/5 dark:bg-white/5 text-slate-400"
          }`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>
        <div className={`mt-3 font-heading font-extrabold text-3xl ${
          stats.overdueTasks > 0 ? "text-red-500" : "text-slate-900 dark:text-white"
        }`}>
          {stats.overdueTasks}
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {stats.overdueTasks > 0 ? "Requires immediate attention" : "All deliverables on schedule"}
        </p>
      </div>

      {isAdmin && (
        <div className="bg-card-light dark:bg-card-dark border border-emerald-500/20 dark:border-emerald-500/20 rounded-2xl p-5 shadow-soft-light dark:shadow-soft-dark transition-all hover:border-emerald-500/40 dark:hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Users
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-3xl text-slate-900 dark:text-white">
              {displayOnlineCount}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-live" />
              Online
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            active users online right now
          </p>
        </div>
      )}

      <div className="bg-card-light dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-2xl p-5 shadow-soft-light dark:shadow-soft-dark transition-all hover:border-black/20 dark:hover:border-white/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Status Breakdown
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div className="p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Todo</span>
            <span className="font-heading font-bold text-slate-700 dark:text-slate-300">{stats.statusBreakdown.TODO}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <span className="text-amber-500">In Dev</span>
            <span className="font-heading font-bold text-amber-500">{stats.statusBreakdown.IN_PROGRESS}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
            <span className="text-indigo-400">Review</span>
            <span className="font-heading font-bold text-indigo-400">{stats.statusBreakdown.IN_REVIEW}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-between">
            <span className="text-teal-500">Done</span>
            <span className="font-heading font-bold text-teal-500">{stats.statusBreakdown.DONE}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
