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
      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
      className={`p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
        notification.isRead
          ? "opacity-60 hover:opacity-100 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
          : "bg-amber-500/[0.04] dark:bg-amber-500/[0.08] hover:bg-amber-500/[0.08]"
      }`}
    >
      <div className="mt-1 flex-shrink-0">
        {!notification.isRead ? (
          <span className="w-2 h-2 rounded-full bg-amber-500 block shadow-glow-amber" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 block" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-relaxed ${
          notification.isRead
            ? "text-slate-600 dark:text-slate-400 font-normal"
            : "text-slate-900 dark:text-white font-medium"
        }`}>
          {notification.message}
        </p>
        <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400">
          <span>{formattedTime}</span>
          {!notification.isRead && (
            <button
              className="text-amber-500 hover:text-amber-600 font-medium transition-colors"
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
