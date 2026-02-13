import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const plData = [
  { month: "Jan", revenue: 4200000, expenses: 2800000 },
  { month: "Feb", revenue: 3800000, expenses: 2600000 },
  { month: "Mar", revenue: 5100000, expenses: 3200000 },
  { month: "Apr", revenue: 4600000, expenses: 3000000 },
  { month: "May", revenue: 5500000, expenses: 3400000 },
  { month: "Jun", revenue: 6200000, expenses: 3800000 },
];

const formatNaira = (value: number) => `₦${(value / 1000000).toFixed(1)}M`;

const complianceItems = [
  { label: "FIRS Annual Filing", date: "Jun 30", status: "done" },
  { label: "PAYE Remittance", date: "Jul 10", status: "upcoming" },
  { label: "Pension Contribution", date: "Jul 15", status: "upcoming" },
  { label: "VAT Returns", date: "Jul 21", status: "overdue" },
];

const statusIcon = (status: string) => {
  if (status === "done") return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === "overdue") return <AlertTriangle className="w-4 h-4 text-red-400" />;
  return <Clock className="w-4 h-4 text-yellow-400" />;
};

const DashboardMockup = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className="rounded-2xl overflow-hidden border border-border bg-surface-dark text-surface-dark-foreground p-4 md:p-6 relative"
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(90deg, transparent 0%, hsl(44 100% 48%) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: isVisible ? "shimmer 3s linear infinite" : "none",
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div>
          <h3 className="text-sm font-semibold text-surface-dark-foreground/60 uppercase tracking-wider">
            Financial Control Dashboard
          </h3>
          <p className="text-xs text-surface-dark-foreground/40 mt-0.5">TaxDoctor • July 2025</p>
        </div>
        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {/* Monthly P&L */}
        <div className={`rounded-xl bg-surface-dark-foreground/5 border border-surface-dark-foreground/10 p-4 ${isVisible ? "animate-fade-up stagger-1" : "opacity-0"}`}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-dark-foreground/50 mb-3">
            Monthly Profit & Loss
          </h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40 20% 96% / 0.08)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "hsl(40 20% 96% / 0.5)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatNaira}
                  tick={{ fontSize: 10, fill: "hsl(40 20% 96% / 0.5)" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Bar dataKey="revenue" radius={[3, 3, 0, 0]} name="Revenue" isAnimationActive={isVisible} animationDuration={1200}>
                  {plData.map((_, i) => (
                    <Cell key={i} fill="hsl(44 100% 48%)" />
                  ))}
                </Bar>
                <Bar dataKey="expenses" radius={[3, 3, 0, 0]} name="Expenses" isAnimationActive={isVisible} animationDuration={1200}>
                  {plData.map((_, i) => (
                    <Cell key={i} fill="hsl(44 100% 48% / 0.3)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 text-[10px] text-surface-dark-foreground/40">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-primary inline-block" /> Revenue
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-primary/30 inline-block" /> Expenses
            </span>
          </div>
        </div>

        {/* Payroll Summary */}
        <div className={`rounded-xl bg-surface-dark-foreground/5 border border-surface-dark-foreground/10 p-4 ${isVisible ? "animate-fade-up stagger-2" : "opacity-0"}`}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-dark-foreground/50 mb-3">
            Payroll Summary
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-surface-dark-foreground/50">Employees</span>
              <span className="text-lg font-bold text-surface-dark-foreground">18</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-surface-dark-foreground/50">Gross Pay</span>
              <span className="text-lg font-bold text-primary">₦4,860,000</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-surface-dark-foreground/50">Net Pay</span>
              <span className="text-lg font-bold text-surface-dark-foreground">₦3,920,400</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-surface-dark-foreground/50">PAYE Deduction</span>
              <span className="text-sm font-medium text-surface-dark-foreground/70">₦612,000</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-surface-dark-foreground/50">Pension (8%)</span>
              <span className="text-sm font-medium text-surface-dark-foreground/70">₦327,600</span>
            </div>
          </div>
        </div>

        {/* Bank Reconciliation */}
        <div className={`rounded-xl bg-surface-dark-foreground/5 border border-surface-dark-foreground/10 p-4 ${isVisible ? "animate-fade-up stagger-3" : "opacity-0"}`}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-dark-foreground/50 mb-3">
            Bank Reconciliation
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-surface-dark-foreground/40 uppercase">GTBank • 0123456789</p>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-xs text-surface-dark-foreground/50">Book Balance</span>
                <span className="text-base font-bold text-surface-dark-foreground">₦12,450,000</span>
              </div>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-xs text-surface-dark-foreground/50">Bank Statement</span>
                <span className="text-base font-bold text-surface-dark-foreground">₦12,680,000</span>
              </div>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-xs text-surface-dark-foreground/50">Variance</span>
                <span className="text-sm font-semibold text-red-400">₦230,000</span>
              </div>
            </div>
            <div className="h-px bg-surface-dark-foreground/10" />
            <div>
              <p className="text-[10px] text-surface-dark-foreground/40 uppercase">Access Bank • 9876543210</p>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-xs text-surface-dark-foreground/50">Book Balance</span>
                <span className="text-base font-bold text-surface-dark-foreground">₦8,340,000</span>
              </div>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-xs text-surface-dark-foreground/50">Bank Statement</span>
                <span className="text-base font-bold text-surface-dark-foreground">₦8,340,000</span>
              </div>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-xs text-surface-dark-foreground/50">Variance</span>
                <span className="text-sm font-semibold text-emerald-400">₦0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Calendar */}
        <div className={`rounded-xl bg-surface-dark-foreground/5 border border-surface-dark-foreground/10 p-4 ${isVisible ? "animate-fade-up stagger-4" : "opacity-0"}`}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-dark-foreground/50 mb-3">
            Compliance Calendar
          </h4>
          <div className="space-y-2.5">
            {complianceItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {statusIcon(item.status)}
                  <span className="text-xs text-surface-dark-foreground/80">{item.label}</span>
                </div>
                <span className="text-[10px] text-surface-dark-foreground/40 font-medium">{item.date}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3 text-[10px] text-surface-dark-foreground/40">
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" /> Done</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-400" /> Upcoming</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400" /> Overdue</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;
