import { EyeOff, AlertTriangle, Building2, Users, CalendarX, HelpCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const problems = [
  { icon: EyeOff, title: "No Monthly Financial Visibility", desc: "You can't manage what you can't see. Decisions made blind." },
  { icon: AlertTriangle, title: "Payroll Errors Compound Quietly", desc: "Small mistakes grow into costly liabilities over months." },
  { icon: Building2, title: "Bank Accounts Unreconciled", desc: "Cash position unknown. Fraud risk increases silently." },
  { icon: Users, title: "Staff Cost Not Monitored", desc: "Payroll creep eats into margins without warning." },
  { icon: CalendarX, title: "Compliance Deadlines Missed", desc: "Penalties and interest accrue while you focus on growth." },
  { icon: HelpCircle, title: "Profit Unknown", desc: "Revenue grows but you can't tell if you're actually profitable." },
];

const ProblemSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} id="problem" className="py-20 md:py-28 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-4 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
            Growth Without Financial Structure Creates Risk
          </h2>
          <span className={`accent-line ${isVisible ? "animate-scale-up stagger-2" : "opacity-0"}`} />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <div
              key={p.title}
              className={`bg-card rounded-xl p-6 shadow-sm border border-border card-hover ${
                isVisible ? `animate-fade-up stagger-${i + 1}` : "opacity-0"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5 text-primary" strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-lg mb-2">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
