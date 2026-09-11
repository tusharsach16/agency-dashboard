import { ScrollReveal } from "./ScrollReveal";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Structure & Delegate",
      desc: "Create client workspaces, configure projects, and delegate tasks to developers with defined priority tiers and explicit delivery dates.",
      tag: "Setup",
    },
    {
      number: "02",
      title: "Execute & Stream",
      desc: "Developers work through tasks with quick status updates while activity events and audit logs are broadcast in real time across the team.",
      tag: "Execution",
    },
    {
      number: "03",
      title: "Deliver & Sync",
      desc: "Stakeholders and managers receive live notification alerts, review milestones, and monitor real-time completion velocity seamlessly.",
      tag: "Delivery",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-slate-50/50 dark:bg-[#0e0e10]/50 border-t border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-3 inline-block">
              How It Works
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
              The Three-Step Operational Loop
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base">
              From initial project creation to client delivery, enjoy a smooth, automated workflow with zero clutter.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 120}>
              <div className="p-8 rounded-2xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-teal-500/40 transition-all duration-300 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono font-black text-2xl text-amber-500">
                      {step.number}
                    </span>
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-md bg-teal-500/10">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.desc}
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
