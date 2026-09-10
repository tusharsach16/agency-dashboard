import { DashboardStats as StatsType, Role } from "../types";

interface DashboardStatsProps {
  stats: StatsType | null;
  loading: boolean;
  role?: Role;
}

export function DashboardStats({ stats, loading, role }: DashboardStatsProps) {
  const isDeveloper = role === "DEVELOPER";

  if (loading && !stats) {
    return (
      <div className="stats-grid">
        <div className="stat-card skeleton" />
        <div className="stat-card skeleton" />
        <div className="stat-card skeleton" />
        <div className="stat-card skeleton" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="stats-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">{isDeveloper ? "Active Projects" : "Total Projects"}</span>
            <span className="stat-icon">&#128193;</span>
          </div>
          <div className="stat-value">{stats.totalProjects}</div>
          <div className="stat-desc">
            {isDeveloper ? "Projects with your assigned tasks" : "Across your management scope"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">{isDeveloper ? "My Tasks" : "Total Tasks"}</span>
            <span className="stat-icon">&#9745;</span>
          </div>
          <div className="stat-value">{stats.totalTasks}</div>
          <div className="stat-desc">
            {stats.statusBreakdown.DONE} completed &bull; {stats.statusBreakdown.IN_PROGRESS} in progress
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-header">
            <span className="stat-title">{isDeveloper ? "My Overdue Tasks" : "Overdue Tasks"}</span>
            <span className="stat-icon">&#9888;</span>
          </div>
          <div className={`stat-value ${stats.overdueTasks > 0 ? "text-danger" : ""}`}>
            {stats.overdueTasks}
          </div>
          <div className="stat-desc">Past due date &amp; incomplete</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Status Distribution</span>
            <span className="stat-icon">&#128202;</span>
          </div>
          <div className="status-mini-pills">
            <span className="mini-pill badge-status-todo">Todo: {stats.statusBreakdown.TODO}</span>
            <span className="mini-pill badge-status-in-progress">In Dev: {stats.statusBreakdown.IN_PROGRESS}</span>
            <span className="mini-pill badge-status-in-review">Review: {stats.statusBreakdown.IN_REVIEW}</span>
            <span className="mini-pill badge-status-done">Done: {stats.statusBreakdown.DONE}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
