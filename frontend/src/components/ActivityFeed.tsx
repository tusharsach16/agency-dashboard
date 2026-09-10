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
    <div className="activity-feed-card">
      <div className="activity-feed-header">
        <div className="activity-feed-title-wrap">
          <h3>Real-Time Activity</h3>
          <ActivityFeedStatus connected={connected} />
        </div>
      </div>

      {error && <div className="feed-error-banner">{error}</div>}

      <div className="activity-feed-body">
        {loading && events.length === 0 ? (
          <div className="feed-empty-state">Loading activity history...</div>
        ) : events.length === 0 ? (
          <div className="feed-empty-state">No recent activity</div>
        ) : (
          <ul className="activity-list">
            {events.map((e) => (
              <ActivityFeedItem key={e.id} event={e} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
