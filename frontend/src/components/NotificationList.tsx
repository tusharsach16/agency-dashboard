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
    <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 w-auto sm:w-96 max-w-sm sm:max-w-none mx-auto sm:mx-0 bg-card-light dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-2xl shadow-soft-light dark:shadow-soft-dark z-50 overflow-hidden animate-slide-down">
      <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            Notifications
          </h4>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs font-medium text-amber-500 hover:text-amber-600 transition-colors"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-black/5 dark:divide-white/5">
        {loading && notifications.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-xs text-red-500">
            {error}
          </div>
        )}

        {!loading && notifications.length === 0 && !error && (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28" className="mb-2 text-slate-300 dark:text-slate-600">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            No notifications yet
          </div>
        )}

        {notifications.length > 0 && (
          <div>
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
