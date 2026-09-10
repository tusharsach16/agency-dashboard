import { Role, TaskStatus, TaskPriority, Project, Task, User } from "@prisma/client";

export interface StatusCounts {
  TODO: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  DONE: number;
}

export interface PriorityCounts {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  overdueTasks: number;
  statusBreakdown: StatusCounts;
  priorityBreakdown: PriorityCounts;
}

export interface DashboardFilterParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  assignedToId?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  tasks: Task[];
  projects: Project[];
}
