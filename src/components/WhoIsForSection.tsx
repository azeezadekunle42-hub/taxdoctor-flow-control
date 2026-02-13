import { Check } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const criteria = [
  "Businesses with active payroll",
  "Founder-led",
  "Growing operations",
  "No internal finance manager",
  "Revenue generating and scaling",
];

const WhoIsForSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className="py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="max-w-xl">
           <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-2 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
             Built For Founders Who've Outgrown Spreadsheets
           </h2>
          <span className={`accent-line mb-10 ${isVisible ? "animate-scale-up stagger-2" : "opacity-0"}`} />
          <div className="space-y-5 mt-10">
            {criteria.map((c, i) => (
              <div
                key={c}
                className={`flex items-center gap-4 ${isVisible ? `animate-slide-in-left stagger-${i + 2}` : "opacity-0"}`}
              >
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
                </div>
                <span className="text-lg font-semibold">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoIsForSection;
