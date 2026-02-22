import { BookOpen, Building2, Users, BarChart3, PieChart, CalendarCheck, FolderSync } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const deliverables = [
  { icon: BookOpen, title: "Closed Monthly Books" },
  { icon: Building2, title: "Fully Reconciled Bank Accounts" },
  { icon: Users, title: "Payroll Accuracy Review" },
  { icon: BarChart3, title: "Monthly P&L + Summary Insight" },
  { icon: PieChart, title: "Staff Cost Percentage Analysis" },
  { icon: CalendarCheck, title: "Compliance Calendar Tracking" },
  { icon: FolderSync, title: "Year-End Coordination" },
];

const MonthlySection = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className="py-20 md:py-28 bg-secondary">
      <div className="container mx-auto px-6 text-center">
        <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-2 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
          What You Receive Every Month
        </h2>
        <span className={`accent-line mb-14 ${isVisible ? "animate-scale-up stagger-2" : "opacity-0"}`} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
          {deliverables.map((d, i) => (
            <div
              key={d.title}
              className={`bg-card rounded-xl p-6 border border-border shadow-sm flex items-start gap-4 card-hover ${
                isVisible ? `animate-fade-up stagger-${Math.min(i + 2, 7)}` : "opacity-0"
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:rotate-6">
                <d.icon className="w-5 h-5 text-primary" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-sm leading-snug">{d.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MonthlySection;
