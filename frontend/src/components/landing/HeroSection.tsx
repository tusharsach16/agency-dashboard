import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  project: string;
  tag: string;
  time: string;
}

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    user: "Dev Priya",
    action: 'Moved "OAuth 2.0 Auth Bridge" to In Review',
    project: "Razorpay API Integration",
    tag: "REVIEW",
    time: "Just now",
  },
  {
    id: "act-2",
    user: "Marcus V.",
    action: 'Completed task "Real-Time WebSocket Sync"',
    project: "Client Core Portal",
    tag: "DONE",
    time: "2m ago",
  },
  {
    id: "act-3",
    user: "Sarah Chen",
    action: 'Assigned "PostgreSQL Index Tuning" to Alex',
    project: "Cloud Data Hub",
    tag: "ASSIGNED",
    time: "5m ago",
  },
];

const ROTATING_POOL = [
  {
    user: "Alex Rivera",
    action: 'Resolved high-priority item "CORS Whitelist Hotfix"',
    project: "Mobile API Services",
    tag: "RESOLVED",
  },
  {
    user: "Dev Priya",
    action: 'Updated status for "Razorpay Webhook Handlers"',
    project: "Razorpay API Integration",
    tag: "IN PROGRESS",
  },
  {
    user: "PM Jordan",
    action: 'Created new milestone "Q3 Release Deliverables"',
    project: "Enterprise Workspace",
    tag: "MILESTONE",
  },
  {
    user: "System Bot",
    action: 'Flagged deadline "GDPR Consent Audit" due today',
    project: "Security Compliance",
    tag: "DUE TODAY",
  },
];

export function HeroSection() {
  const [email, setEmail] = useState("");
  const [selectedOption, setSelectedOption] = useState<"socket" | "rbac">("socket");
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [poolIndex, setPoolIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setPoolIndex((prev) => {
        const nextItem = ROTATING_POOL[prev % ROTATING_POOL.length];
        const newActivity: ActivityItem = {
          ...nextItem,
          id: `act-${Date.now()}`,
          time: "Just now",
        };
        setActivities((current) => [newActivity, current[0], current[1]]);
        return prev + 1;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      navigate(`/signup?email=${encodeURIComponent(email.trim())}`);
    } else {
      navigate("/signup");
    }
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none -mr-40 -mt-20 transform rotate-12" />
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none -ml-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-start text-left">
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.08] mb-6">
              Ship client work, <br />
              track automatically <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-400 to-teal-400">
                all your agency ops.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mb-8 leading-relaxed">
              Supports fast-growing digital agencies with live Socket.io sprint feeds, zero-trust RBAC, and client deliverable management tools.
            </p>

            <form onSubmit={handleGetStarted} className="w-full max-w-md">
              <div className="flex items-center rounded-full p-1.5 bg-white dark:bg-[#16171a] border border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-2xl focus-within:border-amber-500 transition-all duration-200">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your business email"
                  className="w-full px-5 py-2.5 text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold text-slate-950 bg-teal-600 hover:bg-teal-500 text-white rounded-full shadow transition-all duration-200"
                >
                  <span>Get Started</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-6 xl:col-span-5 relative mt-6 lg:mt-0 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[430px]">
              
              <div className="rounded-3xl p-6 sm:p-7 bg-white dark:bg-[#111113] border border-slate-200/90 dark:border-slate-800 shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center font-heading font-bold text-lg shadow-inner">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white leading-snug">
                        Razorpay API Integration
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Client: Razorpay Payments Hub
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    ACTIVE
                  </span>
                </div>

                <div className="mb-5 pb-5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Sprint Progress</span>
                    <span className="font-mono font-bold text-amber-500">12 / 16 Tasks (75%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-teal-400 rounded-full w-[75%]" />
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">4 In Progress</span>
                    <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400">11 Done</span>
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500">1 Overdue</span>
                  </div>
                </div>

                <div className="space-y-2.5 mb-6">
                  <div
                    onClick={() => setSelectedOption("socket")}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                      selectedOption === "socket"
                        ? "border-teal-500/70 bg-teal-500/5 dark:bg-teal-500/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-teal-500">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        Real-Time Socket Task Stream
                      </span>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selectedOption === "socket" ? "border-teal-500" : "border-slate-300 dark:border-slate-600"}`}>
                      {selectedOption === "socket" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedOption("rbac")}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                      selectedOption === "rbac"
                        ? "border-teal-500/70 bg-teal-500/5 dark:bg-teal-500/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-400">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        Role Permissions: Admin & PM Only
                      </span>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selectedOption === "rbac" ? "border-teal-500" : "border-slate-300 dark:border-slate-600"}`}>
                      {selectedOption === "rbac" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  to="/signup"
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-heading font-bold text-center block text-sm transition-all duration-200 shadow-md"
                >
                  Explore Project Board ↗
                </Link>
              </div>

              <div className="hidden sm:block absolute -top-8 -right-6 w-64 rounded-2xl p-4 bg-gradient-to-br from-teal-700 to-teal-900 text-white shadow-2xl border border-teal-400/30 animate-float-slow transform rotate-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold tracking-wider opacity-90 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    LIVE TASK DISPATCH
                  </span>
                  <span className="text-[10px] font-mono text-teal-200">0ms</span>
                </div>

                <div className="text-xs font-semibold text-white mb-2 line-clamp-2 bg-teal-950/50 p-2 rounded-lg border border-teal-400/20">
                  {activities[0]?.action || 'Moved "OAuth 2.0 Auth Bridge" to In Review'}
                </div>

                <div className="flex items-center justify-between text-[11px] text-teal-200 pt-1">
                  <span className="font-medium">Dev Priya (Developer)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    IN REVIEW
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
