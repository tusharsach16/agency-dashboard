import { NotificationItem as NotificationType } from "../types";

interface NotificationItemProps {
  notification: NotificationType;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const formattedTime = new Date(notification.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`notification-item ${notification.isRead ? "read" : "unread"}`}
      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
    >
      <div className="notification-item-main">
        <div className="notification-message-wrap">
          {!notification.isRead && <span className="notification-unread-dot" />}
          <p className="notification-message">{notification.message}</p>
        </div>
        <div className="notification-meta">
          <span className="notification-time">{formattedTime}</span>
          {!notification.isRead && (
            <button
              className="btn-mark-read"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
            >
              Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
