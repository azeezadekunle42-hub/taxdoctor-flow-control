import { EyeOff, AlertTriangle, Building2, Users, CalendarX, ShieldAlert, HelpCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const problems = [
  { icon: EyeOff, title: "Cash Blindness", desc: "You don't know how much money you actually have right now." },
  { icon: AlertTriangle, title: "Payroll Errors Add Up", desc: "Wrong PAYE calculations, missed pension. Small today, big problem in 6 months." },
  { icon: Building2, title: "Banks Never Reconciled", desc: "Your book balance and bank balance don't match. You wouldn't know if money went missing." },
  { icon: Users, title: "Payroll Keeps Growing", desc: "Staff costs keep climbing but nobody's tracking the percentage against revenue." },
  { icon: CalendarX, title: "Tax Deadlines Slip", desc: "NRS penalties, late VAT returns, PAYE remittance delays. All avoidable." },
  { icon: ShieldAlert, title: "NRS Comes Knocking", desc: "If your records are a mess, the Nigeria Revenue Service won't ask nicely. They'll estimate what you owe, and it's always more than the real number." },
  { icon: HelpCircle, title: "No Idea If You're Profitable", desc: "Sales are up but is the business actually making money? You're not sure." },
];

const ProblemSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} id="problem" className="py-20 md:py-28 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-14">
            <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-4 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
              Seven Ways Nigerian SMEs Bleed Money Quietly
            </h2>
          <span className={`accent-line ${isVisible ? "animate-scale-up stagger-2" : "opacity-0"}`} />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((p, i) => {
            const isLast = i === problems.length - 1;
            return (
            <div
              key={p.title}
              className={`bg-card rounded-xl p-6 shadow-sm border border-border card-hover ${
                isLast ? "sm:col-span-2 lg:col-span-1" : ""
              } ${isVisible ? `animate-fade-up stagger-${i + 1}` : "opacity-0"}`}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5 text-primary" strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-lg mb-2">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
