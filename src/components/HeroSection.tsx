import { Button } from "@/components/ui/button";
import DashboardMockup from "@/components/DashboardMockup";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const HeroSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-12">
          <div
            className={`inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-sm font-semibold text-foreground ${
              isVisible ? "animate-fade-down" : "opacity-0"
            }`}
          >
            TaxDoctor Financial Control System™
          </div>
           <h1
             className={`text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6 text-balance ${
               isVisible ? "animate-fade-up stagger-2" : "opacity-0"
             }`}
           >
             Your Business Is Making Money. Can You Prove It?
           </h1>
           <p
             className={`text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed ${
               isVisible ? "animate-fade-up stagger-3" : "opacity-0"
             }`}
           >
             We close your books every month, catch payroll errors before they compound, and keep you compliant — so you can focus on growth.
           </p>
          <div
            className={`flex flex-col sm:flex-row gap-4 ${
              isVisible ? "animate-scale-up stagger-4" : "opacity-0"
            }`}
          >
            <Button 
              variant="hero" 
              size="lg" 
              className="rounded-full text-base px-8 py-6 btn-shine"
              onClick={() => window.open("https://api.leadconnectorhq.com/widget/bookings/consult-taxdoctor", "_blank")}
            >
              See What You're Missing — Free
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
        <div className={`${isVisible ? "animate-fade-up stagger-5" : "opacity-0"} animate-float`}>
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
