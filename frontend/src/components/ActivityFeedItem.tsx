import { ActivityEvent } from "../types";

interface ActivityFeedItemProps {
  event: ActivityEvent;
}

export function ActivityFeedItem({ event }: ActivityFeedItemProps) {
  function formatStatus(status: string | null) {
    if (!status) return "N/A";
    return status.replace(/_/g, " ");
  }

  function getStatusBadgeClass(status: string | null) {
    switch (status) {
      case "TODO":
        return "badge badge-status-todo";
      case "IN_PROGRESS":
        return "badge badge-status-in-progress";
      case "IN_REVIEW":
        return "badge badge-status-in-review";
      case "DONE":
        return "badge badge-status-done";
      default:
        return "badge";
    }
  }

  function formatTime(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return dateStr;
    }
  }

  return (
    <li className="activity-item">
      <div className="activity-item-header">
        <span className="activity-user">{event.user?.name || "User"}</span>
        <span className="activity-time">{formatTime(event.createdAt)}</span>
      </div>
      <div className="activity-item-content">
        <span className="activity-task-title">{event.task?.title || "Task"}</span>
        {event.field === "status" && (
          <div className="activity-transition">
            <span className={getStatusBadgeClass(event.fromValue)}>
              {formatStatus(event.fromValue)}
            </span>
            <span className="transition-arrow">&rarr;</span>
            <span className={getStatusBadgeClass(event.toValue)}>
              {formatStatus(event.toValue)}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}
