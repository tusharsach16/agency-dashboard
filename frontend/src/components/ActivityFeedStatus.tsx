interface ActivityFeedStatusProps {
  connected: boolean;
}

export function ActivityFeedStatus({ connected }: ActivityFeedStatusProps) {
  return (
    <span className={`connection-pill ${connected ? "connected" : "disconnected"}`}>
      <span className="connection-dot" />
      {connected ? "Live" : "Offline"}
    </span>
  );
}
