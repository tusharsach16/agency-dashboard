import { useState, useEffect, FormEvent } from "react";
import { api } from "../services/api";
import { Client, Project, UserSummary } from "../types";
import { useAuth } from "../context/AuthContext";

interface ProjectModalProps {
  project?: Project | null;
  onClose: () => void;
  onSave: () => void;
}

export function ProjectModal({ project, onClose, onSave }: ProjectModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [clientId, setClientId] = useState(project?.clientId ?? "");
  const [managerId, setManagerId] = useState(project?.managerId ?? "");
  const [clients, setClients] = useState<Client[]>([]);
  const [pms, setPms] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFormData() {
      try {
        const clientsRes = await api.get("/clients");
        setClients(clientsRes.data.clients ?? []);
        if (!clientId && clientsRes.data.clients?.length > 0) {
          setClientId(clientsRes.data.clients[0].id);
        }

        if (user?.role === "ADMIN") {
          const pmsRes = await api.get("/users?role=PM");
          setPms(pmsRes.data.users ?? []);
          if (!managerId && pmsRes.data.users?.length > 0) {
            setManagerId(pmsRes.data.users[0].id);
          }
        }
      } catch {
        setError("Failed to load form options");
      }
    }

    loadFormData();
  }, [user, clientId, managerId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: {
        name: string;
        description?: string;
        clientId: string;
        managerId?: string;
      } = {
        name,
        description: description || undefined,
        clientId,
      };

      if (user?.role === "ADMIN" && managerId) {
        payload.managerId = managerId;
      }

      if (project) {
        await api.patch(`/projects/${project.id}`, payload);
      } else {
        await api.post("/projects", payload);
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card-light dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-2xl shadow-soft-light dark:shadow-soft-dark max-w-lg w-full p-6 sm:p-7 relative animate-slide-down">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-black/10 dark:border-white/10">
          <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
            {project ? "Edit Project" : "Create New Project"}
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
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-heading">
              Project Name *
            </label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all placeholder-slate-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
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
              placeholder="Project description and milestones"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-heading">
              Client *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-card-darkHover border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all cursor-pointer"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {user?.role === "ADMIN" && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-heading">
                Project Manager *
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-card-darkHover border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all cursor-pointer"
              >
                {pms.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name} ({pm.email})
                  </option>
                ))}
              </select>
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
              {loading ? "Saving..." : project ? "Update Project" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
