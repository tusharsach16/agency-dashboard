import { Project, UserSummary, Role, DashboardFilterParams } from "../types";

interface DashboardFiltersProps {
  filters: DashboardFilterParams;
  rawFilters: { status: string; priority: string; projectId: string; assignedToId: string };
  onFilterChange: (key: keyof DashboardFilterParams, value: string) => void;
  onClear: () => void;
  activeFilterCount: number;
  projects?: Project[];
  developers?: UserSummary[];
  role?: Role;
}

export function DashboardFilters({
  rawFilters,
  onFilterChange,
  onClear,
  activeFilterCount,
  projects = [],
  developers = [],
  role,
}: DashboardFiltersProps) {
  const isDeveloper = role === "DEVELOPER";

  return (
    <div className="bg-card-light dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-soft-light dark:shadow-soft-dark mb-6 transition-colors">
      <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="text-amber-500">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Filters
          </span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
              {activeFilterCount} active
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 hover:underline transition-all"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-heading">
            Status
          </label>
          <select
            value={rawFilters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-card-darkHover border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-heading">
            Priority
          </label>
          <select
            value={rawFilters.priority}
            onChange={(e) => onFilterChange("priority", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-card-darkHover border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {projects.length > 0 && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-heading">
              Project
            </label>
            <select
              value={rawFilters.projectId}
              onChange={(e) => onFilterChange("projectId", e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-card-darkHover border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isDeveloper && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-heading">
              Assignee
            </label>
            <select
              value={rawFilters.assignedToId}
              onChange={(e) => onFilterChange("assignedToId", e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-card-darkHover border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="">All Assignees</option>
              {developers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
