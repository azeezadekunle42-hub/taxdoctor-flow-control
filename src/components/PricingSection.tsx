import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const sharedFeatures = [
  "Monthly book closure",
  "Bank reconciliation",
  "Payroll accuracy review",
  "Monthly P&L + summary insight",
  "Staff cost percentage analysis",
  "Compliance calendar tracking",
  "Year-end coordination",
];

const tiers = [
  {
    name: "Starter Control",
    turnover: "< ₦50m",
    turnoverLabel: "Annual Turnover",
    highlighted: false,
  },
  {
    name: "Growth Control",
    turnover: "< ₦100m",
    turnoverLabel: "Annual Turnover",
    highlighted: true,
  },
  {
    name: "Premium Control",
    turnover: "> ₦100m",
    turnoverLabel: "Annual Turnover",
    highlighted: false,
  },
];

const PricingSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} id="pricing" className={`py-20 md:py-28 bg-secondary transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Pricing Structure
          </h2>
          <p className="text-muted-foreground text-lg">
            No hourly billing. Defined scope. Transparent structure.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 border-2 transition-shadow ${
                tier.highlighted
                  ? "border-primary bg-card shadow-xl scale-[1.02]"
                  : "border-border bg-card shadow-sm"
              }`}
            >
              {tier.highlighted && (
                <span className="inline-block mb-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">{tier.turnover}</span>
                <p className="text-muted-foreground text-sm mt-1">{tier.turnoverLabel}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {sharedFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" strokeWidth={3} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={tier.highlighted ? "hero" : "hero-outline"}
                className="w-full rounded-full"
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
