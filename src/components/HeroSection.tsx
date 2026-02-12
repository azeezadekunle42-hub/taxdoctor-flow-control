import { Button } from "@/components/ui/button";
import dashboardMockup from "@/assets/dashboard-mockup.jpg";

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-12">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-sm font-semibold text-foreground">
            TaxDoctor Financial Control System™
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6 text-balance">
            Install Monthly Financial Control In Your Business.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
            Structured bookkeeping, payroll oversight, and compliance monitoring for growing Nigerian businesses with 5–30 employees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="hero" size="lg" className="rounded-full text-base px-8 py-6">
              Book Financial Diagnostic
            </Button>
            <Button variant="hero-outline" size="lg" className="rounded-full text-base px-8 py-6">
              View System Breakdown
            </Button>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-border">
          <img
            src={dashboardMockup}
            alt="TaxDoctor Financial Control Dashboard showing Monthly P&L, Payroll Summary, Bank Reconciliation and Compliance Calendar"
            className="w-full h-auto"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
