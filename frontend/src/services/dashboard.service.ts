import { api } from "./api";
import { DashboardStats, Project, Task, DashboardFilterParams } from "../types";

export interface DashboardApiResponse {
  success: boolean;
  stats: DashboardStats;
  tasks: Task[];
  projects: Project[];
}

export interface DashboardStatsApiResponse {
  success: boolean;
  stats: DashboardStats;
}

export async function fetchDashboardData(filters: DashboardFilterParams): Promise<DashboardApiResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.projectId) params.set("projectId", filters.projectId);
  if (filters.assignedToId) params.set("assignedToId", filters.assignedToId);

  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get<DashboardApiResponse>(`/dashboard${queryStr}`);
  return res.data;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<DashboardStatsApiResponse>("/dashboard/stats");
  return res.data.stats;
}
