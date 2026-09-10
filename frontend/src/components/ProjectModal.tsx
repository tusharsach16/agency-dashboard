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
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{project ? "Edit Project" : "Create New Project"}</h3>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Name *</label>
            <input
              type="text"
              required
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description and scope"
            />
          </div>

          <div className="form-group">
            <label>Client *</label>
            <select
              className="form-control"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {user?.role === "ADMIN" && (
            <div className="form-group">
              <label>Project Manager *</label>
              <select
                className="form-control"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                required
              >
                {pms.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name} ({pm.email})
                  </option>
                ))}
              </select>
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
              {loading ? "Saving..." : project ? "Update Project" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
