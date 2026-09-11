import { ScrollReveal } from "./ScrollReveal";

export function RolesSection() {
  const roles = [
    {
      role: "Admin",
      badgeBg: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
      headline: "Global Oversight & Governance",
      desc: "Full command over the entire agency ecosystem, team assignments, and system-wide audit telemetry.",
      capabilities: [
        "Unrestricted access across all client projects",
        "User management & role permission provisioning",
        "Global real-time activity stream & metric audits",
        "Multi-client portfolio filtering and analytics",
      ],
    },
    {
      role: "Project Manager",
      badgeBg: "bg-teal-500/10 text-teal-500 border border-teal-500/20",
      headline: "Project Lifecycle & Coordination",
      desc: "Dedicated to driving assigned client projects from inception to completion without cross-team clutter.",
      capabilities: [
        "Manage owned projects and task allocations",
        "Assign tasks to available developers",
        "Real-time alerts when task statuses transition",
        "Project-scoped velocity and deadline tracking",
      ],
    },
    {
      role: "Developer",
      badgeBg: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
      headline: "Focused Execution & Velocity",
      desc: "A distraction-free workspace curated specifically for tasks assigned to the developer.",
      capabilities: [
        "Focused view on assigned active workloads",
        "Single-click status progression (Todo → Progress → Review → Done)",
        "Instant notifications for new task assignments",
        "Scoped activity feed for authorized work only",
      ],
    },
  ];

  return (
    <section id="roles" className="py-24 border-t border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-3 inline-block">
              Role-Based Workspaces
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
              Tailored for Every Agency Stakeholder
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base">
              Zero-trust permissions guarantee each role sees exactly what they need to execute their job without noise.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((item, i) => (
            <ScrollReveal key={item.role} delay={i * 120}>
              <div className="p-8 rounded-2xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 h-full">
                <div>
                  <div className="mb-5">
                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${item.badgeBg}`}>
                      {item.role}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white mb-2">
                    {item.headline}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {item.desc}
                  </p>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 mb-6" />

                  <ul className="space-y-3 mb-6">
                    {item.capabilities.map((cap, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <svg className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
