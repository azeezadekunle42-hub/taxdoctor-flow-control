import { Check } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const criteria = [
  "You have staff on payroll",
  "You run the business yourself",
  "Things are getting busier",
  "You don't have a finance person",
  "You're making money but the numbers are messy",
];

const WhoIsForSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className="py-20 md:py-28">
      <div className="container mx-auto px-6 text-center">
        <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-2 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
          Built For Founders Who've Outgrown Spreadsheets
        </h2>
        <span className={`accent-line mb-10 ${isVisible ? "animate-scale-up stagger-2" : "opacity-0"}`} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10 max-w-4xl mx-auto">
          {criteria.map((c, i) => (
            <div
              key={c}
              className={`bg-card rounded-xl border border-border p-5 flex items-center gap-3 shadow-sm card-hover ${
                isVisible ? `animate-fade-up stagger-${i + 2}` : "opacity-0"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
              </div>
              <span className="font-semibold text-sm text-left">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoIsForSection;
