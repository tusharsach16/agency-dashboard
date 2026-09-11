import { Link } from "react-router-dom";

interface LandingNavbarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function LandingNavbar({ theme, onToggleTheme }: LandingNavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-5 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5 rounded-full backdrop-blur-md bg-white/80 dark:bg-[#111113]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl transition-all duration-300">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-heading font-black text-base shadow-sm group-hover:bg-amber-400 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100">
            AgencyDash
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-amber-500 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-amber-500 transition-colors">
            Workflow
          </a>
          <a href="#roles" className="hover:text-amber-500 transition-colors">
            Roles & RBAC
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-400">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-700">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-full transition-all duration-200"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2 text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-full shadow-sm hover:shadow transition-all duration-200"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
