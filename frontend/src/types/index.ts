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
  user?: { name: string };
  task?: { title: string };
}
