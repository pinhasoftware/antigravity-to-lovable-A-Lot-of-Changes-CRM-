import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { TrendingUp, AlertCircle, CheckCircle2, Clock, AlertTriangle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { startOfMonth, subMonths, addMonths, endOfMonth, format } from "date-fns";
import { pt } from "date-fns/locale";
import { fmtEUR } from "@/lib/format";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { mockClients, mockSessions, mockPayments, clientById, type MockPayment } from "@/lib/mocks";
import { toast } from "sonner";

function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function PTBusiness() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("week");
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [payments, setPayments] = useState<MockPayment[]>(mockPayments);

  const overdue = payments.filter((p) => !p.paid && new Date(p.due_date) < new Date());
  const upcoming = payments.filter((p) => !p.paid && new Date(p.due_date) >= new Date());

  function markPaid(id: string) {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, paid: true, paid_at: new Date().toISOString() } : p)));
    toast.success("Pagamento marcado como pago");
  }


  const weekData = useMemo(() => {
    const start = startOfWeek();
    const days = DAYS.map((label, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return { label, total: 0, count: 0 };
    });
    for (const s of mockSessions) {
      if (s.status !== "concluido") continue;
      const d = new Date(s.scheduled_at);
      if (d < start) continue;
      const idx = (d.getDay() + 6) % 7;
      const c = clientById(s.client_id);
      const value = c?.session_value ?? (c?.monthly_value ? c.monthly_value / 8 : 0);
      days[idx].total += value;
      days[idx].count += 1;
    }
    return days;
  }, []);

  const monthData = useMemo(() => {
    const buckets = Array.from({ length: 4 }, (_, i) => {
      const start = startOfWeek();
      start.setDate(start.getDate() - (3 - i) * 7);
      return { label: `S${i + 1}`, date: start, total: 0, count: 0 };
    });
    const earliest = buckets[0].date;
    for (const s of mockSessions) {
      if (s.status !== "concluido") continue;
      const d = new Date(s.scheduled_at);
      if (d < earliest) continue;
      const diffWeeks = Math.floor((d.getTime() - earliest.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const idx = Math.min(3, Math.max(0, diffWeeks));
      const c = clientById(s.client_id);
      const value = c?.session_value ?? (c?.monthly_value ? c.monthly_value / 8 : 0);
      buckets[idx].total += value;
      buckets[idx].count += 1;
    }
    return buckets;
  }, []);

  const calendarMonthData = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const numWeeks = Math.ceil((end.getDate() - 1) / 7) || 4; // roughly 4-5 weeks
    const buckets = Array.from({ length: numWeeks }, (_, i) => ({
      label: `Sem ${i + 1}`,
      date: start,
      total: 0,
      count: 0
    }));
    
    for (const s of mockSessions) {
      if (s.status !== "concluido") continue;
      const d = new Date(s.scheduled_at);
      if (d >= start && d <= end) {
        const weekIdx = Math.floor((d.getDate() - 1) / 7);
        if (weekIdx >= 0 && weekIdx < numWeeks) {
          const c = clientById(s.client_id);
          const value = c?.session_value ?? (c?.monthly_value ? c.monthly_value / 8 : 0);
          buckets[weekIdx].total += value;
          buckets[weekIdx].count += 1;
        }
      }
    }
    return buckets;
  }, [selectedMonth]);

  const data = tab === "week" ? weekData : tab === "month" ? monthData : calendarMonthData;
  const totalRevenue = data.reduce((a, b) => a + b.total, 0);
  const totalSessions = data.reduce((a, b) => a + b.count, 0);

  const monthly = mockClients.reduce((sum, c) => sum + (c.monthly_value ?? 0), 0);
  const pendingSessions = mockSessions.filter(
    (s) => s.status === "concluido" && !s.paid && new Date(s.scheduled_at) >= startOfWeek(),
  ).length;
  const renewals = mockClients.filter((c) => {
    if (!c.start_date) return false;
    const start = new Date(c.start_date);
    const next = new Date(start);
    while (next < new Date()) next.setMonth(next.getMonth() + 1);
    const diff = (next.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <div className="px-5 pb-24 pt-6 h-full overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Faturação</h1>
          <p className="mt-1 text-sm text-muted-foreground">Receita, sessões e renovações</p>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          className="md:hidden" 
          onClick={() => navigate("/pt/crm")}
        >
          Ver CRM
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <KPI label="Mensal recorrente" value={fmtEUR(monthly)} icon={<TrendingUp className="h-4 w-4" />} accent="primary" />
        <KPI label="Por confirmar" value={`${pendingSessions}`} sub="sessões esta semana" icon={<Clock className="h-4 w-4" />} accent="energy" />
      </div>

      {/* PAGAMENTOS EM FALTA — destaque máximo */}
      {overdue.length > 0 && (
        <section className="mt-5 rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-sm font-bold text-destructive">
              {overdue.length} pagamento{overdue.length > 1 ? "s" : ""} em atraso
            </h2>
          </div>
          <div className="space-y-2">
            {overdue.map((p) => {
              const c = clientById(p.client_id);
              const daysLate = Math.floor((Date.now() - +new Date(p.due_date)) / 86400000);
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-background/60 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c?.full_name ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {fmtEUR(p.amount)} · há {daysLate} dia{daysLate > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => markPaid(p.id)} className="h-8 bg-primary text-primary-foreground">
                    <Check className="mr-1 h-3.5 w-3.5" /> Pago
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-bold tracking-tight">Pagamentos previstos</h2>
          <div className="space-y-2">
            {upcoming.map((p) => {
              const c = clientById(p.client_id);
              return (
                <div key={p.id} className="glass flex items-center gap-3 rounded-2xl p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c?.full_name ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtEUR(p.amount)} · vence {new Date(p.due_date).toLocaleDateString("pt-PT")}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => markPaid(p.id)} className="h-8">
                    <Check className="mr-1 h-3.5 w-3.5" /> Marcar pago
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="glass mt-5 rounded-2xl p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Receita</p>
              <p className="text-2xl font-bold tracking-tight">{fmtEUR(totalRevenue)}</p>
              <p className="text-[11px] text-muted-foreground">{totalSessions} sessões</p>
            </div>
            <TabsList className="h-8 rounded-full bg-secondary/60 p-0.5">
              <TabsTrigger value="week" className="h-7 rounded-full px-3 text-[11px]">Semana</TabsTrigger>
              <TabsTrigger value="month" className="h-7 rounded-full px-3 text-[11px]">4 sem</TabsTrigger>
              <TabsTrigger value="mensal" className="h-7 rounded-full px-3 text-[11px]">Mensal</TabsTrigger>
            </TabsList>
          </div>
          {tab === "mensal" && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-secondary/30 px-3 py-2">
              <button 
                onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-bold capitalize">
                {format(selectedMonth, "MMMM yyyy", { locale: pt })}
              </p>
              <button 
                onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          <TabsContent value={tab} className="mt-0">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={(v) => `${v}€`} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--secondary) / 0.4)" }}
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [fmtEUR(v), "Receita"]}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {data.map((d, i) => (
                      <Cell key={i} fill={d.total >= max * 0.7 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.5)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold tracking-tight">Renovações próximas</h2>
        {renewals.length === 0 ? (
          <div className="glass flex items-center gap-2 rounded-2xl p-4 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Sem renovações nos próximos 7 dias.
          </div>
        ) : (
          <div className="space-y-2">
            {renewals.map((c) => (
              <div key={c.id} className="glass flex items-center justify-between rounded-2xl p-3">
                <div>
                  <p className="text-sm font-semibold">{c.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">Mensalidade {fmtEUR(c.monthly_value)}</p>
                </div>
                <span className="rounded-full bg-energy/15 px-2.5 py-1 text-[10px] font-semibold uppercase text-energy">
                  Em breve
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold tracking-tight">Por cobrar</h2>
        {pendingSessions === 0 ? (
          <div className="glass flex items-center gap-2 rounded-2xl p-4 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Tudo em dia.
          </div>
        ) : (
          <div className="glass flex items-center gap-3 rounded-2xl p-4">
            <AlertCircle className="h-5 w-5 text-energy" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{pendingSessions} sessões concluídas sem pagamento</p>
              <p className="text-[11px] text-muted-foreground">Revê com o cliente.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function KPI({ label, value, sub, icon, accent }: { label: string; value: string; sub?: string; icon: React.ReactNode; accent: "primary" | "energy" }) {
  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <div className={`grid h-7 w-7 place-items-center rounded-lg ${accent === "primary" ? "bg-primary/15 text-primary" : "bg-energy/15 text-energy"}`}>
          {icon}
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
