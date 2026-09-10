import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { fetchDashboardData } from "../services/dashboard.service";
import { Project, Task, DashboardStats as StatsType, UserSummary } from "../types";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { ProjectModal } from "../components/ProjectModal";
import { TaskModal } from "../components/TaskModal";
import { ActivityFeed } from "../components/ActivityFeed";
import { DashboardStats } from "../components/DashboardStats";
import { DashboardFilters } from "../components/DashboardFilters";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { useDashboardFilters } from "../hooks/useDashboardFilters";

export default function DashboardPage() {
  const { user } = useAuth();
  const { filters, rawFilters, setFilter, clearFilters, activeFilterCount } = useDashboardFilters();

  const [stats, setStats] = useState<StatsType | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [developers, setDevelopers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const isDeveloper = user?.role === "DEVELOPER";
  const canManageProjects = user?.role === "ADMIN" || user?.role === "PM";

  const selectedProjectId = rawFilters.projectId || (projects.length > 0 ? projects[0].id : null);
  const currentProject = projects.find((p) => p.id === selectedProjectId) || null;

  const {
    events: activityEvents,
    connected: activityConnected,
    loading: activityLoading,
    error: activityError,
  } = useActivityFeed(selectedProjectId, (event) => {
    if (event.field === "status" && event.toValue) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === event.taskId ? { ...t, status: event.toValue as Task["status"] } : t
        )
      );
      loadDashboardData(true);
    }
  });

  const loadDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setTasksLoading(true);
      setError(null);

      const data = await fetchDashboardData(rawFilters);

      setStats(data.stats);
      setTasks(data.tasks ?? []);
      setProjects(data.projects ?? []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to load dashboard data");
    } finally {
      if (!silent) {
        setTasksLoading(false);
        setLoading(false);
      }
    }
  }, [rawFilters.status, rawFilters.priority, rawFilters.projectId, rawFilters.assignedToId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    async function loadDevelopers() {
      if (canManageProjects) {
        try {
          const res = await api.get("/users/developers");
          setDevelopers(res.data.developers ?? res.data.users ?? []);
        } catch {
          try {
            const fallback = await api.get("/users?role=DEVELOPER");
            setDevelopers(fallback.data.developers ?? fallback.data.users ?? []);
          } catch {
          }
        }
      }
    }
    loadDevelopers();
  }, [canManageProjects, user]);

  async function handleDeleteProject(id: string) {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      if (rawFilters.projectId === id) {
        setFilter("projectId", "");
      }
      loadDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete project");
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      loadDashboardData(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete task");
    }
  }

  async function handleQuickStatusChange(taskId: string, newStatus: Task["status"]) {
    const prevTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      loadDashboardData(true);
    } catch (err: any) {
      setTasks(prevTasks);
      setError(err.response?.data?.error?.message ?? "Failed to update task status");
    }
  }

  return (
    <div className="dashboard-layout">
      <Navbar />

      <main className="dashboard-main">
        {error && <div className="alert alert-danger">{error}</div>}

        <DashboardStats stats={stats} loading={loading} role={user?.role} />

        <DashboardFilters
          filters={filters}
          rawFilters={rawFilters}
          onFilterChange={setFilter}
          onClear={clearFilters}
          activeFilterCount={activeFilterCount}
          projects={projects}
          developers={developers}
          role={user?.role}
        />

        <div className="dashboard-grid">
          <aside className="projects-sidebar">
            <div className="sidebar-header">
              <h3>Projects</h3>
              {canManageProjects && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditingProject(null);
                    setProjectModalOpen(true);
                  }}
                >
                  + New Project
                </button>
              )}
            </div>

            {loading ? (
              <div className="loading-state">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="empty-state">
                No projects accessible for your role.
              </div>
            ) : (
              <ul className="project-items-list">
                <li
                  className={`project-item ${!rawFilters.projectId ? "active" : ""}`}
                  onClick={() => setFilter("projectId", "")}
                >
                  <div className="project-item-info">
                    <strong>All Projects</strong>
                    <small className="text-muted">Combined overview</small>
                  </div>
                </li>
                {projects.map((p) => {
                  const isSelected = p.id === rawFilters.projectId;
                  return (
                    <li
                      key={p.id}
                      className={`project-item ${isSelected ? "active" : ""}`}
                      onClick={() => setFilter("projectId", p.id)}
                    >
                      <div className="project-item-info">
                        <strong>{p.name}</strong>
                        <small className="text-muted">
                          Client: {p.client?.name ?? "N/A"}
                        </small>
                        <small className="text-muted">
                          Manager: {p.manager?.name ?? "N/A"}
                        </small>
                      </div>
                      {canManageProjects && (
                        <div
                          className="project-item-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="btn btn-outline-primary btn-xs"
                            onClick={() => {
                              setEditingProject(p);
                              setProjectModalOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline-danger btn-xs"
                            onClick={() => handleDeleteProject(p.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section className="tasks-section">
            <div className="tasks-container">
              <div className="tasks-header">
                <div className="project-heading">
                  <h2>{currentProject ? currentProject.name : "All Tasks Overview"}</h2>
                  <p className="text-muted">
                    {currentProject?.description || (activeFilterCount > 0 ? "Showing filtered tasks" : "Showing all authorized tasks")}
                  </p>
                </div>
                {canManageProjects && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setEditingTask(null);
                      setTaskModalOpen(true);
                    }}
                  >
                    + Add Task
                  </button>
                )}
              </div>

              <div className="tasks-body">
                {tasksLoading ? (
                  <div className="loading-state">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                  <div className="empty-state">
                    {activeFilterCount > 0
                      ? "No tasks match your active filter criteria."
                      : "No tasks found."}
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="tasks-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Project</th>
                          <th>Status</th>
                          <th>Priority</th>
                          <th>Due Date</th>
                          <th>Assignee</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((t) => {
                          const isAssignedToUser = t.assignedToId === user?.id;
                          const canUpdateStatus =
                            user?.role === "ADMIN" ||
                            (user?.role === "PM" && t.project?.managerId === user?.id) ||
                            (isDeveloper && isAssignedToUser);

                          return (
                            <tr key={t.id}>
                              <td>
                                <strong>{t.title}</strong>
                                {t.description && (
                                  <p className="task-subtext">
                                    {t.description}
                                  </p>
                                )}
                              </td>
                              <td>
                                <span className="project-pill">
                                  {t.project?.name || "N/A"}
                                </span>
                              </td>
                              <td>
                                {canUpdateStatus ? (
                                  <select
                                    className="status-select-sm"
                                    value={t.status}
                                    onChange={(e) =>
                                      handleQuickStatusChange(
                                        t.id,
                                        e.target.value as Task["status"]
                                      )
                                    }
                                  >
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">
                                      In Progress
                                    </option>
                                    <option value="IN_REVIEW">
                                      In Review
                                    </option>
                                    <option value="DONE">Done</option>
                                  </select>
                                ) : (
                                  <span className={`badge badge-${t.status.toLowerCase()}`}>
                                    {t.status}
                                  </span>
                                )}
                              </td>
                              <td>
                                <span className={`priority-badge priority-${t.priority.toLowerCase()}`}>
                                  {t.priority}
                                </span>
                              </td>
                              <td>
                                {t.dueDate
                                  ? new Date(t.dueDate).toLocaleDateString()
                                  : "No due date"}
                              </td>
                              <td>
                                {t.assignedTo ? (
                                  <span>{t.assignedTo.name}</span>
                                ) : (
                                  <span className="text-muted">Unassigned</span>
                                )}
                              </td>
                              <td>
                                <div className="action-buttons">
                                  {!isDeveloper ? (
                                    <>
                                      <button
                                        className="btn btn-outline-primary btn-xs"
                                        onClick={() => {
                                          setEditingTask(t);
                                          setTaskModalOpen(true);
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        className="btn btn-outline-danger btn-xs"
                                        onClick={() => handleDeleteTask(t.id)}
                                      >
                                        Delete
                                      </button>
                                    </>
                                  ) : isAssignedToUser ? (
                                    <button
                                      className="btn btn-outline-primary btn-xs"
                                      onClick={() => {
                                        setEditingTask(t);
                                        setTaskModalOpen(true);
                                      }}
                                    >
                                      Update Status
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="activity-sidebar">
            <ActivityFeed
              events={activityEvents}
              connected={activityConnected}
              loading={activityLoading}
              error={activityError}
            />
          </aside>
        </div>
      </main>

      {projectModalOpen && (
        <ProjectModal
          project={editingProject}
          onClose={() => {
            setProjectModalOpen(false);
            setEditingProject(null);
          }}
          onSave={() => {
            loadDashboardData();
          }}
        />
      )}

      {taskModalOpen && (
        <TaskModal
          task={editingTask}
          projectId={selectedProjectId || (projects[0]?.id ?? "")}
          onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
          onSave={() => {
            loadDashboardData(true);
          }}
        />
      )}
    </div>
  );
}
