const rows = [
  { system: "Monthly closure discipline", traditional: "Year-end cleanup" },
  { system: "Integrated payroll + reporting", traditional: "Fragmented vendors" },
  { system: "Infrastructure-backed", traditional: "Spreadsheet-driven" },
  { system: "Proactive compliance monitoring", traditional: "Reactive penalty payments" },
  { system: "Defined scope & pricing", traditional: "Hourly billing uncertainty" },
];

const ComparisonSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-14">
          Why This Is Different
        </h2>
        <div className="overflow-x-auto">
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
              {rows.map((r) => (
                <tr key={r.system} className="border-t border-border">
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
