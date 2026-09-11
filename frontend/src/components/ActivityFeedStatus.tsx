interface ActivityFeedStatusProps {
  connected: boolean;
}

export function ActivityFeedStatus({ connected }: ActivityFeedStatusProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-heading font-bold border transition-all ${
      connected
        ? "bg-teal-500/10 text-teal-500 border-teal-500/30"
        : "bg-slate-500/10 text-slate-500 border-slate-500/30"
    }`}>
      <span className={`w-2 h-2 rounded-full ${
        connected ? "bg-teal-500 animate-pulse-live shadow-[0_0_8px_#14b8a6]" : "bg-slate-400"
      }`} />
      {connected ? "LIVE" : "OFFLINE"}
    </span>
  );
}
