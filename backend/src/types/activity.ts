import { Role, ActivityLog } from "@prisma/client";
import { Socket } from "socket.io";

export interface AuthedSocket extends Socket {
  user?: { sub: string; role: Role };
}

export interface ActivityUserSummary {
  id: string;
  name: string;
}

export interface ActivityTaskSummary {
  id: string;
  title: string;
}

export interface ActivityProjectSummary {
  id: string;
  name: string;
}

export interface ActivityEvent {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  user: ActivityUserSummary;
  task: ActivityTaskSummary;
  project: ActivityProjectSummary;
  field: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
}

export type ActivityWithRelations = ActivityLog & {
  user: ActivityUserSummary;
  task: ActivityTaskSummary;
  project: ActivityProjectSummary;
};
