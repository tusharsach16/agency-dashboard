export type Role = "ADMIN" | "PM" | "DEVELOPER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Client {
  id: string;
  name: string;
  contact?: string | null;
  createdAt?: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  clientId: string;
  client?: Client;
  managerId: string;
  manager?: UserSummary;
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  isOverdue?: boolean;
  projectId: string;
  project?: {
    id: string;
    name: string;
    managerId?: string;
  };
  assignedToId?: string | null;
  assignedTo?: UserSummary | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityEvent {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  field: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
  user?: { id?: string; name: string };
  task?: { id?: string; title: string };
  project?: { id?: string; name: string };
}

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
  status?: TaskStatus | "";
  priority?: TaskPriority | "";
  projectId?: string | "";
  assignedToId?: string | "";
}

export interface NotificationItem {
  id: string;
  userId: string;
  taskId: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  task?: {
    id: string;
    title: string;
    projectId: string;
  } | null;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
}

