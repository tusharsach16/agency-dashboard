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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card-light dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-2xl shadow-soft-light dark:shadow-soft-dark max-w-lg w-full p-6 sm:p-7 relative animate-slide-down">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-black/10 dark:border-white/10">
          <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
            {isDeveloper
              ? "Update Task Status"
              : task
              ? "Edit Task"
              : "Create New Task"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-lg"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isDeveloper ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-heading">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all placeholder-slate-400"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement user authentication"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-heading">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all placeholder-slate-400"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task details and acceptance criteria"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-heading">
                    Priority
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-card-darkHover border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all cursor-pointer"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-heading">
                    Status
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-card-darkHover border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all cursor-pointer"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-heading">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all cursor-pointer"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-heading">
                    Assign Developer
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-card-darkHover border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all cursor-pointer"
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
            <div>
              <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 mb-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-heading uppercase tracking-wider">
                  Task
                </span>
                <strong className="text-sm text-slate-900 dark:text-white block font-medium">
                  {task?.title}
                </strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-heading">
                  Status
                </label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-card-darkHover border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all cursor-pointer"
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium transition-all"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm shadow-glow-amber transition-all disabled:opacity-50 font-heading"
              disabled={loading}
            >
              {loading ? "Saving..." : task ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
