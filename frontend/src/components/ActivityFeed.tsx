import { ActivityEvent } from "../types";
import { ActivityFeedStatus } from "./ActivityFeedStatus";
import { ActivityFeedItem } from "./ActivityFeedItem";

interface ActivityFeedProps {
  events: ActivityEvent[];
  connected: boolean;
  loading: boolean;
  error: string | null;
}

export function ActivityFeed({ events, connected, loading, error }: ActivityFeedProps) {
  return (
    <div className="bg-card-light dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-2xl shadow-soft-light dark:shadow-soft-dark overflow-hidden flex flex-col h-full transition-colors">
      <div className="p-4 sm:p-5 border-b border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            Live Activity Feed
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time task and project events
          </p>
        </div>
        <ActivityFeedStatus connected={connected} />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs text-center">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
        {loading && events.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Connecting to activity stream...
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28" className="mb-2 text-slate-300 dark:text-slate-600">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            No recent activity recorded
          </div>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/5">
            {events.map((e) => (
              <ActivityFeedItem key={e.id} event={e} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
