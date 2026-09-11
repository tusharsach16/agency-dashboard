import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0a0a0b] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-100 dark:border-slate-800/80">
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-heading font-black text-sm">
                A
              </div>
              <span className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                AgencyDash
              </span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm leading-relaxed">
              The real-time client project and activity tracking dashboard designed for high-performing agency teams.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li><a href="#features" className="hover:text-amber-500 transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-amber-500 transition-colors">How It Works</a></li>
              <li><a href="#roles" className="hover:text-amber-500 transition-colors">Roles & RBAC</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/login" className="hover:text-amber-500 transition-colors">Sign In</Link></li>
              <li><Link to="/signup" className="hover:text-amber-500 transition-colors">Create Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} AgencyDash. Built with real-time Socket.io & Zero-Trust RBAC.
          </p>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Production Grade
          </span>
        </div>
      </div>
    </footer>
  );
}
