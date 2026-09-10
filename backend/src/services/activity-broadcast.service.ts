import { ActivityEvent, ActivityWithRelations } from "../types/activity";
import { getIO } from "../sockets";

export function formatActivityEvent(log: ActivityWithRelations): ActivityEvent {
  return {
    id: log.id,
    taskId: log.taskId,
    projectId: log.projectId,
    userId: log.userId,
    user: {
      id: log.user.id,
      name: log.user.name,
    },
    task: {
      id: log.task.id,
      title: log.task.title,
    },
    project: {
      id: log.project.id,
      name: log.project.name,
    },
    field: log.field,
    fromValue: log.fromValue,
    toValue: log.toValue,
    createdAt: log.createdAt.toISOString(),
  };
}

export function broadcastActivityEvent(projectId: string, event: ActivityEvent): void {
  const io = getIO();
  if (io) {
    io.to("feed:global").to(`feed:project:${projectId}`).emit("feed:new", event);
  }
}
