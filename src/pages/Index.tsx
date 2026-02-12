import StickyHeader from "@/components/StickyHeader";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import SystemSection from "@/components/SystemSection";
import MonthlySection from "@/components/MonthlySection";
import WhoIsForSection from "@/components/WhoIsForSection";
import PricingSection from "@/components/PricingSection";
import ComparisonSection from "@/components/ComparisonSection";
import FinalCTA from "@/components/FinalCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <StickyHeader />
      <main>
        <HeroSection />
        <ProblemSection />
        <SystemSection />
        <MonthlySection />
        <WhoIsForSection />
        <PricingSection />
        <ComparisonSection />
        <FinalCTA />
      </main>
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} TaxDoctor. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
