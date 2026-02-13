import { Button } from "@/components/ui/button";
import DashboardMockup from "@/components/DashboardMockup";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const HeroSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className={`relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-12">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-sm font-semibold text-foreground">
            TaxDoctor Financial Control System™
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6 text-balance">
            Install Monthly Financial Control In Your Business.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
            Structured bookkeeping, payroll oversight, and compliance monitoring for growing Nigerian businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="hero" 
              size="lg" 
              className="rounded-full text-base px-8 py-6"
              onClick={() => window.open("https://api.leadconnectorhq.com/widget/bookings/consult-taxdoctor", "_blank")}
            >
              Book Financial Diagnostic
            </Button>
            <Button 
              variant="hero-outline" 
              size="lg" 
              className="rounded-full text-base px-8 py-6"
              onClick={() => window.open("https://paystack.shop/pay/Tax_Consultation", "_blank")}
            >
              Schedule Consultation
            </Button>
          </div>
        </div>
        <DashboardMockup />
      </div>
    </section>
  );
};

export default HeroSection;
