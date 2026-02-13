import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const FinalCTA = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className="py-20 md:py-28 bg-surface-dark text-surface-dark-foreground">
      <div className="container mx-auto px-6 text-center">
         <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-balance ${isVisible ? "animate-scale-up" : "opacity-0"}`}>
           You're Growing. Your Financial Clarity Should Keep Up.
         </h2>
        <p className={`text-surface-dark-foreground/70 text-lg mb-10 max-w-xl mx-auto ${isVisible ? "animate-fade-up stagger-2" : "opacity-0"}`}>
          Let's look at your books together. 30 minutes, no pressure.
        </p>
        <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isVisible ? "animate-fade-up stagger-3" : "opacity-0"}`}>
          <Button 
            variant="hero" 
            size="lg" 
            className="rounded-full text-base px-8 py-6 btn-shine"
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
          >
            Book Financial Diagnostic
          </Button>
          <Button 
            variant="hero-outline" 
            size="lg" 
            className="rounded-full text-base px-8 py-6 border-primary text-primary"
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
          >
            Get Started
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
