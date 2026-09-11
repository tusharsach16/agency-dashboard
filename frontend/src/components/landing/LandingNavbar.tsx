import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

interface LandingNavbarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function LandingNavbar({ theme, onToggleTheme }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-3 sm:pt-5 px-3 sm:px-8">
      <div
        ref={menuRef}
        className="max-w-6xl mx-auto relative"
      >
        <div className="flex items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-full backdrop-blur-md bg-white/85 dark:bg-[#111113]/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl transition-all duration-300">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 sm:gap-2.5 group shrink-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-heading font-black text-sm sm:text-base shadow-sm group-hover:bg-amber-400 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-heading font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-100">
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

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

            {/* Desktop Auth Buttons */}
            <div className="hidden sm:flex items-center gap-3">
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

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              className={`sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                mobileMenuOpen
                  ? "bg-amber-500/15 text-amber-500 border-amber-500/40"
                  : "bg-black/[0.04] dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 border-slate-300/70 dark:border-slate-700/70 hover:border-amber-500/50"
              }`}
            >
              <span>Menu</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileMenuOpen ? "rotate-90" : ""}`}
              >
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="8" x2="20" y2="8" />
                    <line x1="4" y1="16" x2="20" y2="16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 mt-2 p-4 rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-[#111113]/95 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl animate-slide-down z-50">
            <div className="flex flex-col gap-2">
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 text-center text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-sm transition-all"
              >
                Get Started Free (Sign Up)
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 text-center text-sm font-semibold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-xl transition-all"
              >
                Log In
              </Link>

              <div className="my-1.5 border-t border-slate-200/80 dark:border-slate-800/80" />

              <div className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 hover:text-amber-500 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 hover:text-amber-500 transition-colors"
                >
                  Workflow
                </a>
                <a
                  href="#roles"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 hover:text-amber-500 transition-colors"
                >
                  Roles & RBAC
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
