import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const FinalCTA = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className="py-20 md:py-28 bg-surface-dark text-surface-dark-foreground">
      <div className="container mx-auto px-6 text-center">
        <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-balance ${isVisible ? "animate-scale-up" : "opacity-0"}`}>
          Install Financial Structure Before Growth Breaks You.
        </h2>
        <p className={`text-surface-dark-foreground/70 text-lg mb-10 max-w-xl mx-auto ${isVisible ? "animate-fade-up stagger-2" : "opacity-0"}`}>
          Get a clear picture of your financial health with a guided diagnostic session.
        </p>
        <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isVisible ? "animate-fade-up stagger-3" : "opacity-0"}`}>
          <Button 
            variant="hero" 
            size="lg" 
            className="rounded-full text-base px-8 py-6 btn-shine"
            onClick={() => window.open("https://api.leadconnectorhq.com/widget/bookings/consult-taxdoctor", "_blank")}
          >
            Book Financial Diagnostic
          </Button>
          <Button 
            variant="hero-outline" 
            size="lg" 
            className="rounded-full text-base px-8 py-6 border-primary text-primary"
            onClick={() => window.open("https://paystack.shop/pay/Tax_Consultation", "_blank")}
          >
            Schedule Consultation
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
