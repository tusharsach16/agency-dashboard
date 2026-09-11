import { ScrollReveal } from "./ScrollReveal";

export function FeaturesSection() {
  const features = [
    {
      title: "Real-Time Activity Feed",
      desc: "Live Socket.io broadcast delivers instant audit trails as task statuses and assignments change across your organization.",
      tag: "Live Broadcast",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-500">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      title: "Zero-Trust RBAC",
      desc: "Granular access controls enforce strict tenant and role boundaries for Admins, Project Managers, and Developers.",
      tag: "Security",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-teal-500">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      title: "Project & Task Lifecycle",
      desc: "Coordinate deliverables, priorities, statuses, assignments, and due dates effortlessly within single or multi-client scopes.",
      tag: "Workflow",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-500">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      title: "Smart Notifications",
      desc: "PostgreSQL-persisted notifications with instant unread badge updates keep teams informed without notification fatigue.",
      tag: "Event-Driven",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-teal-500">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      title: "Multi-Client Dashboards",
      desc: "Filter workloads by client, status, priority, and assignees with role-scoped metrics that calculate in sub-milliseconds.",
      tag: "Analytics",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-500">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      title: "Deadline & Overdue Watch",
      desc: "Automated tracking flags overdue deliverables and approaching deadlines so client commitments are consistently met.",
      tag: "Monitoring",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-500">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="py-24 border-t border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-3 inline-block">
              Core Capabilities
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
              Engineered for High-Velocity Agency Workflows
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base">
              Every capability designed specifically to remove operational friction and maintain complete project transparency.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 80}>
              <div className="group p-7 rounded-2xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {f.icon}
                    </div>
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/60">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
