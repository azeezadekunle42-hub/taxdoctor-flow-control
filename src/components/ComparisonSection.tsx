import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const rows = [
  { system: "Monthly closure discipline", traditional: "Year-end cleanup" },
  { system: "Integrated payroll + reporting", traditional: "Fragmented vendors" },
  { system: "Infrastructure-backed", traditional: "Spreadsheet-driven" },
  { system: "Proactive compliance monitoring", traditional: "Reactive penalty payments" },
  { system: "Defined scope & pricing", traditional: "Hourly billing uncertainty" },
];

const ComparisonSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className="py-20 md:py-28">
      <div className="container mx-auto px-6">
         <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-2 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
           Traditional Bookkeeper vs. Financial Control System
         </h2>
        <span className={`accent-line mb-14 ${isVisible ? "animate-scale-up stagger-2" : "opacity-0"}`} />
        <div className="overflow-x-auto mt-14">
          <table className="w-full max-w-3xl">
            <thead>
              <tr>
                <th className="text-left pb-4 pr-8 font-bold text-sm text-primary uppercase tracking-wide">
                  System-Based
                </th>
                <th className="text-left pb-4 font-bold text-sm text-muted-foreground uppercase tracking-wide">
                  Traditional Bookkeeping
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.system}
                  className={`border-t border-border ${isVisible ? `animate-fade-up stagger-${i + 3}` : "opacity-0"}`}
                >
                  <td className="py-4 pr-8 font-semibold text-sm">{r.system}</td>
                  <td className="py-4 text-sm text-muted-foreground">{r.traditional}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
