import { Project, UserSummary, Role, TaskStatus, TaskPriority, DashboardFilterParams } from "../types";

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
    <div className="filters-toolbar">
      <div className="filters-header">
        <div className="filters-title">
          <span className="filters-icon">&#9881;</span>
          <strong>Filters</strong>
          {activeFilterCount > 0 && (
            <span className="active-filter-badge">{activeFilterCount} active</span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button className="btn btn-outline-danger btn-xs" onClick={onClear}>
            Clear All
          </button>
        )}
      </div>

      <div className="filters-controls-grid">
        <div className="filter-item">
          <label>Status</label>
          <select
            className="filter-select"
            value={rawFilters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Priority</label>
          <select
            className="filter-select"
            value={rawFilters.priority}
            onChange={(e) => onFilterChange("priority", e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {projects.length > 0 && (
          <div className="filter-item">
            <label>Project</label>
            <select
              className="filter-select"
              value={rawFilters.projectId}
              onChange={(e) => onFilterChange("projectId", e.target.value)}
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

        {!isDeveloper && developers.length > 0 && (
          <div className="filter-item">
            <label>Assignee</label>
            <select
              className="filter-select"
              value={rawFilters.assignedToId}
              onChange={(e) => onFilterChange("assignedToId", e.target.value)}
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
