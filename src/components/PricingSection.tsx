import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { toast } from "sonner";

const sharedFeatures = [
  "Monthly book closure",
  "Bank reconciliation",
  "Payroll accuracy review",
  "Monthly P&L + summary insight",
  "Staff cost percentage analysis",
  "Compliance calendar tracking",
  "Year-end coordination",
  "Quarterly advisory review",
  "Audited financial statement",
  "Tax filing",
  "CAC annual returns",
];

const tiers = [
  {
    name: "Starter Control",
    turnover: "< ₦50m",
    turnoverLabel: "Annual Turnover",
    monthly: "₦75,000",
    annual: "₦750,000",
    monthlyAmount: 75000,
    annualAmount: 750000,
    highlighted: false,
  },
  {
    name: "Growth Control",
    turnover: "< ₦100m",
    turnoverLabel: "Annual Turnover",
    monthly: "₦100,000",
    annual: "₦1,000,000",
    monthlyAmount: 100000,
    annualAmount: 1000000,
    highlighted: true,
  },
  {
    name: "Premium Control",
    turnover: "> ₦100m",
    turnoverLabel: "Annual Turnover",
    monthly: "₦150,000",
    annual: "₦1,500,000",
    monthlyAmount: 150000,
    annualAmount: 1500000,
    highlighted: false,
  },
];

const PricingSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const handlePayment = async (tierName: string, plan: string, amount: number) => {
    const key = `${tierName}-${plan}`;
    setLoadingKey(key);

    const email = prompt("Please enter your email address for payment:");
    if (!email) {
      setLoadingKey(null);
      return;
    }

    try {
      const callbackUrl = `${window.location.origin}/payment-verification`;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initialize-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            email,
            amount,
            plan,
            tier: tierName,
            callback_url: callbackUrl,
          }),
        }
      );

      const data = await res.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error(data.error || "Failed to initialize payment");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <section ref={ref} id="pricing" className="py-20 md:py-28 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-4 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
            Pricing Structure
          </h2>
          <span className={`accent-line ${isVisible ? "animate-scale-up stagger-2" : "opacity-0"}`} />
          <p className={`text-muted-foreground text-lg mt-4 ${isVisible ? "animate-fade-up stagger-2" : "opacity-0"}`}>
            No hourly billing. Defined scope. Transparent structure.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 border-2 card-hover ${
                tier.highlighted
                  ? "border-primary bg-card shadow-xl scale-[1.02]"
                  : "border-border bg-card shadow-sm"
              } ${isVisible ? `animate-fade-up stagger-${i + 3}` : "opacity-0"}`}
            >
              {tier.highlighted && (
                <span className="inline-block mb-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-extrabold">{tier.turnover}</span>
                <p className="text-muted-foreground text-sm mt-1">{tier.turnoverLabel}</p>
              </div>
              <div className="mb-6 text-sm text-muted-foreground">
                <p><span className="font-semibold text-foreground">{tier.monthly}</span> /month</p>
                <p><span className="font-semibold text-foreground">{tier.annual}</span> /year</p>
              </div>
              <ul className="space-y-3 mb-8">
                {sharedFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" strokeWidth={3} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2">
                {[
                  { plan: "Quarterly", amount: tier.monthlyAmount * 3 },
                  { plan: "Half Yearly", amount: tier.monthlyAmount * 6 },
                  { plan: "Annual", amount: tier.annualAmount },
                ].map(({ plan, amount }) => {
                  const key = `${tier.name}-${plan}`;
                  const isLoading = loadingKey === key;
                  return (
                    <Button
                      key={plan}
                      variant={tier.highlighted ? "hero" : "hero-outline"}
                      className={`w-full rounded-full ${tier.highlighted ? "btn-shine" : ""}`}
                      disabled={isLoading}
                      onClick={() => handlePayment(tier.name, plan, amount)}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        plan
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
