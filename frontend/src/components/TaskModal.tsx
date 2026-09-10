import { useState, useEffect, FormEvent } from "react";
import { api } from "../services/api";
import { Task, TaskPriority, TaskStatus, UserSummary } from "../types";
import { useAuth } from "../context/AuthContext";

interface TaskModalProps {
  projectId: string;
  task?: Task | null;
  onClose: () => void;
  onSave: () => void;
}

export function TaskModal({ projectId, task, onClose, onSave }: TaskModalProps) {
  const { user } = useAuth();
  const isDeveloper = user?.role === "DEVELOPER";

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "MEDIUM");
  const [dueDate, setDueDate] = useState<string>(
    task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [assignedToId, setAssignedToId] = useState<string>(task?.assignedToId ?? "");
  const [developers, setDevelopers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDevelopers() {
      if (user?.role === "ADMIN" || user?.role === "PM") {
        try {
          const res = await api.get("/users/developers");
          setDevelopers(res.data.developers ?? res.data.users ?? []);
        } catch {
          try {
            const fallback = await api.get("/users?role=DEVELOPER");
            setDevelopers(fallback.data.developers ?? fallback.data.users ?? []);
          } catch {
            setError("Failed to load developers");
          }
        }
      }
    }

    loadDevelopers();
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isDeveloper && task) {
        await api.patch(`/tasks/${task.id}/status`, { status });
      } else if (task) {
        const payload = {
          title,
          description: description || undefined,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          assignedToId: assignedToId || null,
        };
        await api.patch(`/tasks/${task.id}`, payload);
      } else {
        const payload = {
          title,
          description: description || undefined,
          projectId,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          assignedToId: assignedToId || null,
        };
        await api.post("/tasks", payload);
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            {isDeveloper
              ? "Update Task Status"
              : task
              ? "Edit Task"
              : "Create New Task"}
          </h3>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isDeveloper ? (
            <>
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement user authentication"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task details and acceptance criteria"
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Priority</label>
                  <select
                    className="form-control"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Assign Developer</label>
                  <select
                    className="form-control"
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {developers.map((dev) => (
                      <option key={dev.id} value={dev.id}>
                        {dev.name} ({dev.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label>Task: {task?.title}</label>
              <div className="form-group mt-2">
                <label>Status</label>
                <select
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : task ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
