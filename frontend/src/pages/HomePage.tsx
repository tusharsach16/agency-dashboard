import { useTheme } from "../context/ThemeContext";
import { LandingNavbar } from "../components/landing/LandingNavbar";
import { HeroSection } from "../components/landing/HeroSection";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { RolesSection } from "../components/landing/RolesSection";
import { FinalCta } from "../components/landing/FinalCta";
import { LandingFooter } from "../components/landing/LandingFooter";

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0a0a0b] text-slate-900 dark:text-white selection:bg-amber-500 selection:text-slate-950 transition-colors duration-300 font-body">
      <LandingNavbar theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <RolesSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
