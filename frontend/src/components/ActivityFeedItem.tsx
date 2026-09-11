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
        return "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20";
      case "IN_PROGRESS":
        return "bg-amber-500/15 text-amber-500 border-amber-500/30";
      case "IN_REVIEW":
        return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
      case "DONE":
        return "bg-teal-500/15 text-teal-500 border-teal-500/30";
      default:
        return "bg-black/5 dark:bg-white/5 text-slate-500 border-black/10 dark:border-white/10";
    }
  }

  function formatTime(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  }

  const userName = event.user?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <li className="p-4 transition-all hover:bg-black/[0.02] dark:hover:bg-white/[0.02] flex items-start gap-3 animate-slide-down">
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white font-heading font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
        {userInitial}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-heading font-bold text-xs text-slate-900 dark:text-white truncate">
            {userName}
          </span>
          <span className="text-[11px] text-slate-400 flex-shrink-0">
            {formatTime(event.createdAt)}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-1.5 truncate">
          {event.task?.title || "Task"}
        </p>

        {event.field === "status" && (
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-heading font-semibold">
            <span className={`px-2 py-0.5 rounded-md border ${getStatusBadgeClass(event.fromValue)}`}>
              {formatStatus(event.fromValue)}
            </span>
            <span className="text-slate-400">&rarr;</span>
            <span className={`px-2 py-0.5 rounded-md border ${getStatusBadgeClass(event.toValue)}`}>
              {formatStatus(event.toValue)}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}
