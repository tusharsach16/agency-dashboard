export type Role = "ADMIN" | "PM" | "DEVELOPER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  managerId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  isOverdue: boolean;
  projectId: string;
  assignedToId?: string;
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
  user?: { name: string };
  task?: { title: string };
}
