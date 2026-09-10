import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Project, Task } from "../types";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { ProjectModal } from "../components/ProjectModal";
import { TaskModal } from "../components/TaskModal";
import { ActivityFeed } from "../components/ActivityFeed";
import { useActivityFeed } from "../hooks/useActivityFeed";

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const isDeveloper = user?.role === "DEVELOPER";
  const canManageProjects = user?.role === "ADMIN" || user?.role === "PM";

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
    }
  });

  async function loadProjects() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/projects");
      const list = res.data.projects ?? [];
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
      } else if (list.length === 0) {
        setSelectedProjectId(null);
        setCurrentProject(null);
        setTasks([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  async function loadProjectDetails(projectId: string, silent = false) {
    try {
      if (!silent) setTasksLoading(true);
      const res = await api.get(`/projects/${projectId}`);
      const proj = res.data.project;
      setCurrentProject(proj);
      setTasks(proj.tasks ?? []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to load project details");
    } finally {
      if (!silent) setTasksLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDetails(selectedProjectId);
    }
  }, [selectedProjectId]);

  async function handleDeleteProject(id: string) {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      setSelectedProjectId(null);
      loadProjects();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete project");
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      if (selectedProjectId) {
        loadProjectDetails(selectedProjectId, true);
      }
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
      if (selectedProjectId) {
        loadProjectDetails(selectedProjectId, true);
      }
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
                {projects.map((p) => {
                  const isSelected = p.id === selectedProjectId;
                  return (
                    <li
                      key={p.id}
                      className={`project-item ${isSelected ? "active" : ""}`}
                      onClick={() => setSelectedProjectId(p.id)}
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
            {!selectedProjectId ? (
              <div className="empty-state-large">
                <h3>Select a project</h3>
                <p className="text-muted">
                  Choose a project from the sidebar to view its tasks and manage details.
                </p>
              </div>
            ) : (
              <div className="tasks-container">
                <div className="tasks-header">
                  <div className="project-heading">
                    <h2>{currentProject?.name}</h2>
                    {currentProject?.description && (
                      <p className="text-muted">
                        {currentProject.description}
                      </p>
                    )}
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
                      No tasks found for this project.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="tasks-table">
                        <thead>
                          <tr>
                            <th>Title</th>
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
                              (user?.role === "PM" && currentProject?.managerId === user?.id) ||
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
            )}
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
            loadProjects();
          }}
        />
      )}

      {taskModalOpen && selectedProjectId && (
        <TaskModal
          task={editingTask}
          projectId={selectedProjectId}
          onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
          onSave={() => {
            loadProjectDetails(selectedProjectId, true);
          }}
        />
      )}
    </div>
  );
}
