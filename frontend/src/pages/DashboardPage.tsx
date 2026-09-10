import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Project, Task } from "../types";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { ProjectModal } from "../components/ProjectModal";
import { TaskModal } from "../components/TaskModal";

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

  async function loadProjectDetails(projectId: string) {
    try {
      setTasksLoading(true);
      const res = await api.get(`/projects/${projectId}`);
      const proj = res.data.project;
      setCurrentProject(proj);
      setTasks(proj.tasks ?? []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to load project details");
    } finally {
      setTasksLoading(false);
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
        loadProjectDetails(selectedProjectId);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete task");
    }
  }

  async function handleQuickStatusChange(taskId: string, newStatus: Task["status"]) {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (selectedProjectId) {
        loadProjectDetails(selectedProjectId);
      }
    } catch (err: any) {
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
                      </div>
                      <span className="task-count-badge">
                        {p._count?.tasks ?? 0} tasks
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section className="project-details-pane">
            {tasksLoading ? (
              <div className="loading-state">Loading project details...</div>
            ) : !currentProject ? (
              <div className="empty-state">Select a project to view tasks.</div>
            ) : (
              <div>
                <div className="project-banner">
                  <div className="project-banner-info">
                    <h2>{currentProject.name}</h2>
                    <p className="project-desc">{currentProject.description}</p>
                    <div className="project-meta">
                      <span>
                        <strong>Client:</strong> {currentProject.client?.name}
                      </span>
                      <span>
                        <strong>Manager:</strong> {currentProject.manager?.name} (
                        {currentProject.manager?.email})
                      </span>
                    </div>
                  </div>

                  <div className="project-banner-actions">
                    {canManageProjects && (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setEditingProject(currentProject);
                            setProjectModalOpen(true);
                          }}
                        >
                          Edit Project
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteProject(currentProject.id)}
                        >
                          Delete Project
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setEditingTask(null);
                            setTaskModalOpen(true);
                          }}
                        >
                          + Add Task
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="tasks-section">
                  <div className="tasks-header">
                    <h3>Tasks</h3>
                    <span>{tasks.length} total</span>
                  </div>

                  {tasks.length === 0 ? (
                    <div className="empty-state">
                      No tasks found in this project.
                    </div>
                  ) : (
                    <div className="tasks-table-container">
                      <table className="tasks-table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Due Date</th>
                            <th>Assigned To</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((t) => {
                            const isAssignedToUser = t.assignedToId === user?.id;
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
                                  {isDeveloper ? (
                                    isAssignedToUser ? (
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
                                    )
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
        </div>
      </main>

      {projectModalOpen && (
        <ProjectModal
          project={editingProject}
          onClose={() => setProjectModalOpen(false)}
          onSave={loadProjects}
        />
      )}

      {taskModalOpen && selectedProjectId && (
        <TaskModal
          projectId={selectedProjectId}
          task={editingTask}
          onClose={() => setTaskModalOpen(false)}
          onSave={() => loadProjectDetails(selectedProjectId)}
        />
      )}
    </div>
  );
}
