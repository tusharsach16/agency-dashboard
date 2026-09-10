import { useAuth } from "../context/AuthContext";
import { useActivityFeed } from "../hooks/useActivityFeed";

export default function DashboardPage() {
  const { user } = useAuth();
  const { events, onlineCount } = useActivityFeed(null);

  return (
    <div className="dashboard-page">
      <header>
        <h1>Welcome, {user?.name}</h1>
        <span>{onlineCount} online</span>
      </header>

      <section className="activity-feed">
        <h2>Activity Feed</h2>
        <ul>
          {events.map((e) => (
            <li key={e.id}>
              {e.user?.name} changed {e.task?.title}: {e.fromValue} → {e.toValue}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
