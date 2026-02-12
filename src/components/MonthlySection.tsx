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
    <section ref={ref} className={`py-20 md:py-28 bg-secondary transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-14">
          What You Receive Every Month
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {deliverables.map((d) => (
            <div key={d.title} className="bg-card rounded-xl p-6 border border-border shadow-sm flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
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
