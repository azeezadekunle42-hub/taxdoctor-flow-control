import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const FinalCTA = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className={`py-20 md:py-28 bg-surface-dark text-surface-dark-foreground transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-balance">
          Install Financial Structure Before Growth Breaks You.
        </h2>
        <p className="text-surface-dark-foreground/70 text-lg mb-10 max-w-xl mx-auto">
          Get a clear picture of your financial health with a guided diagnostic session.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="hero" 
            size="lg" 
            className="rounded-full text-base px-8 py-6"
            onClick={() => window.open("https://api.leadconnectorhq.com/widget/bookings/consult-taxdoctor", "_blank")}
          >
            Book Financial Diagnostic
          </Button>
          <Button variant="hero-outline" size="lg" className="rounded-full text-base px-8 py-6 border-primary text-primary">
            Schedule Consultation
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
