import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const steps = [
  { num: "1", title: "Capture & Record", powered: "Taxdoctorcapture.org", url: "https://taxdoctorcapture.org" },
  { num: "2", title: "Payroll Oversight", powered: "Taxdoctorpayroll.com", url: "https://taxdoctorpayroll.com" },
  { num: "3", title: "Monthly Financial Reporting", powered: "Structured P&L + Insight" },
  { num: "4", title: "Compliance Monitoring", powered: "TaxdoctorFlow.org", url: "https://taxdoctorflow.org" },
];

const SystemSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} id="system" className="py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-4 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
            The TaxDoctor Financial Control System™
          </h2>
          <span className={`accent-line ${isVisible ? "animate-scale-up stagger-2" : "opacity-0"}`} />
          <p className={`text-muted-foreground text-lg leading-relaxed mt-4 ${isVisible ? "animate-fade-up stagger-2" : "opacity-0"}`}>
            This is not traditional bookkeeping. It is a structured monthly financial control framework installed in your business — powered by integrated technology at every step.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row items-stretch gap-4">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`flex items-center flex-1 ${isVisible ? `animate-slide-in-left stagger-${i + 2}` : "opacity-0"}`}
            >
              <div className="flex-1 rounded-xl border-2 border-border bg-card p-6 text-center card-hover">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold text-base mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Powered by{" "}
                  {step.url ? (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-semibold"
                    >
                      {step.powered}
                    </a>
                  ) : (
                    step.powered
                  )}
                </p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="hidden lg:block w-6 h-6 text-primary mx-2 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SystemSection;
