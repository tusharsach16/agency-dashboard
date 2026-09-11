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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-500/15 text-red-500 border-red-500/30";
      case "HIGH":
        return "bg-amber-500/15 text-amber-500 border-amber-500/30";
      case "MEDIUM":
        return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
      case "LOW":
      default:
        return "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-teal-500/15 text-teal-500 border-teal-500/30";
      case "IN_REVIEW":
        return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
      case "IN_PROGRESS":
        return "bg-amber-500/15 text-amber-500 border-amber-500/30";
      case "TODO":
      default:
        return "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-page-light dark:bg-page-dark flex transition-colors">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card-light dark:bg-card-dark border-r border-black/10 dark:border-white/10 flex flex-col transition-transform duration-200 md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black font-heading font-extrabold text-sm flex items-center justify-center shadow-md">
              A
            </div>
            <span className="font-heading font-bold text-base tracking-tight text-slate-900 dark:text-white">
              AgencyDash
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="md:hidden text-slate-400 hover:text-slate-600 text-lg"
          >
            &times;
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-slate-400">
              Projects
            </span>
            {canManageProjects && (
              <button
                onClick={() => {
                  setEditingProject(null);
                  setProjectModalOpen(true);
                }}
                className="text-xs font-semibold text-amber-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
              >
                + New
              </button>
            )}
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                setFilter("projectId", "");
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                !rawFilters.projectId
                  ? "bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              }`}
            >
              <span>All Projects</span>
              <span className="text-[10px] opacity-75">Overview</span>
            </button>

            {projects.map((p) => {
              const isSelected = p.id === rawFilters.projectId;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setFilter("projectId", p.id);
                    setSidebarOpen(false);
                  }}
                  className={`group w-full px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20"
                      : "text-slate-700 dark:text-slate-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {p.client?.name ?? "No Client"}
                    </div>
                  </div>

                  {canManageProjects && (
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(p);
                          setProjectModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-amber-500"
                        title="Edit Project"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(p.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-red-500"
                        title="Delete Project"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white font-heading font-bold text-xs flex items-center justify-center shadow-sm flex-shrink-0">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="truncate flex-1">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user?.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-xs"
        />
      )}

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" className="flex-shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card-light dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-2xl shadow-soft-light dark:shadow-soft-dark overflow-hidden transition-colors">
                <div className="p-4 sm:p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.02]">
                  <div>
                    <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                      {currentProject ? currentProject.name : "All Tasks Overview"}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {currentProject?.description || (activeFilterCount > 0 ? "Filtered deliverable list" : "All authorized tasks")}
                    </p>
                  </div>

                  {canManageProjects && (
                    <button
                      onClick={() => {
                        setEditingTask(null);
                        setTaskModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold font-heading shadow-glow-amber transition-all flex items-center gap-1.5"
                    >
                      <span>+</span>
                      <span>Add Task</span>
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  {tasksLoading ? (
                    <div className="py-16 text-center text-xs text-slate-400">
                      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading deliverables...
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-400">
                      {activeFilterCount > 0
                        ? "No tasks match your active filter criteria."
                        : "No tasks found in this project view."}
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-black/10 dark:border-white/10 text-[11px] font-heading font-bold uppercase tracking-wider text-slate-400 bg-black/[0.01] dark:bg-white/[0.01]">
                          <th className="py-3 px-4">Task</th>
                          <th className="py-3 px-4">Project</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Priority</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4">Assignee</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                        {tasks.map((t) => {
                          const isAssignedToUser = t.assignedToId === user?.id;
                          const canUpdateStatus =
                            user?.role === "ADMIN" ||
                            (user?.role === "PM" && t.project?.managerId === user?.id) ||
                            (isDeveloper && isAssignedToUser);
                          
                          const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE";

                          return (
                            <tr
                              key={t.id}
                              className={`transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] ${
                                isOverdue ? "bg-red-500/[0.02] dark:bg-red-500/[0.04]" : ""
                              }`}
                            >
                              <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white max-w-[200px]">
                                <div className="truncate font-semibold">{t.title}</div>
                                {t.description && (
                                  <div className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                                    {t.description}
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 font-heading text-[11px]">
                                  {t.project?.name || "N/A"}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {canUpdateStatus ? (
                                  <select
                                    value={t.status}
                                    onChange={(e) =>
                                      handleQuickStatusChange(
                                        t.id,
                                        e.target.value as Task["status"]
                                      )
                                    }
                                    className="px-2 py-1 rounded-lg bg-black/[0.02] dark:bg-card-darkHover border border-black/10 dark:border-white/10 text-xs font-heading font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                                  >
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="IN_REVIEW">In Review</option>
                                    <option value="DONE">Done</option>
                                  </select>
                                ) : (
                                  <span className={`px-2 py-0.5 rounded-md border text-[11px] font-heading font-semibold ${getStatusBadgeClass(t.status)}`}>
                                    {t.status}
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-md border text-[11px] font-heading font-bold ${getPriorityBadgeClass(t.priority)}`}>
                                  {t.priority}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                                {t.dueDate ? (
                                  <span className={isOverdue ? "text-red-500 font-semibold" : ""}>
                                    {new Date(t.dueDate).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">No due date</span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {t.assignedTo ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 text-[10px] font-bold flex items-center justify-center font-heading">
                                      {t.assignedTo.name.charAt(0)}
                                    </div>
                                    <span>{t.assignedTo.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">Unassigned</span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!isDeveloper ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingTask(t);
                                          setTaskModalOpen(true);
                                        }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                        title="Edit Task"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTask(t.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                        title="Delete Task"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                          <polyline points="3 6 5 6 21 6" />
                                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                      </button>
                                    </>
                                  ) : isAssignedToUser ? (
                                    <button
                                      onClick={() => {
                                        setEditingTask(t);
                                        setTaskModalOpen(true);
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[11px] font-semibold font-heading transition-colors"
                                    >
                                      Status
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <ActivityFeed
                events={activityEvents}
                connected={activityConnected}
                loading={activityLoading}
                error={activityError}
              />
            </div>
          </div>
        </main>
      </div>

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
