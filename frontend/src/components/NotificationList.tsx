import { NotificationItem as NotificationType } from "../types";
import { NotificationItem } from "./NotificationItem";

interface NotificationListProps {
  notifications: NotificationType[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export function NotificationList({
  notifications,
  unreadCount,
  loading,
  error,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationListProps) {
  return (
    <div className="notification-dropdown">
      <div className="notification-dropdown-header">
        <div className="notification-header-title">
          <h4>Notifications</h4>
          {unreadCount > 0 && <span className="notification-count-badge">{unreadCount}</span>}
        </div>
        <div className="notification-header-actions">
          {unreadCount > 0 && (
            <button className="btn-link-action" onClick={onMarkAllAsRead}>
              Mark all as read
            </button>
          )}
          <button className="btn-close-dropdown" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
      </div>

      <div className="notification-dropdown-body">
        {loading && notifications.length === 0 && (
          <div className="notification-loading-state">Loading notifications...</div>
        )}

        {error && <div className="notification-error-state">{error}</div>}

        {!loading && notifications.length === 0 && !error && (
          <div className="notification-empty-state">No notifications yet</div>
        )}

        {notifications.length > 0 && (
          <div className="notification-scroll-list">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
