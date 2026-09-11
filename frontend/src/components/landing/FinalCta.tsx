import { Link } from "react-router-dom";
import { ScrollReveal } from "./ScrollReveal";

export function FinalCta() {
  return (
    <section className="py-24 border-t border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="relative rounded-3xl p-10 sm:p-14 bg-gradient-to-b from-slate-900 to-slate-950 dark:from-[#111113] dark:to-[#0a0a0b] text-white border border-slate-800 shadow-2xl text-center overflow-hidden">
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <span className="px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-amber-500/20 text-amber-400 mb-4 inline-block">
              Get Started
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 max-w-2xl mx-auto">
              Bring your agency workflow into one real-time workspace.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
              Stop switching between outdated tracking sheets and disconnected chat threads. Try AgencyDash today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg transition-all duration-200"
              >
                Get started free &rarr;
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all duration-200"
              >
                Sign in to workspace
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
