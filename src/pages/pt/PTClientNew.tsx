import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, ChevronDown, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PAYMENT_FREQUENCY_LABEL, type PaymentFrequency } from "@/lib/mocks";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function TimeSelect({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [h, m] = (value || "09:00").split(":");
  
  return (
    <div className="flex h-10 min-w-[120px] items-center justify-center gap-1 rounded-lg border border-input bg-background px-3 text-base shadow-sm focus-within:ring-1 focus-within:ring-ring">
      <select 
        value={h} 
        onChange={e => onChange(`${e.target.value}:${m}`)} 
        className="bg-transparent outline-none text-center font-medium"
      >
        {Array.from({length: 24}).map((_, i) => {
          const val = i.toString().padStart(2, "0");
          return <option key={val} value={val}>{val}h</option>;
        })}
      </select>
      <span className="font-bold text-muted-foreground">:</span>
      <select 
        value={m} 
        onChange={e => onChange(`${h}:${e.target.value}`)} 
        className="bg-transparent outline-none text-center font-medium"
      >
        {['00', '15', '30', '45'].map(mins => (
          <option key={mins} value={mins}>{mins}</option>
        ))}
      </select>
    </div>
  );
}

export default function PTClientNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);

  // Required
  const [name, setName] = useState("");

  // Optional — basics
  const [type, setType] = useState<"presencial" | "consultoria">("presencial");
  const [value, setValue] = useState<string>("");

  // Optional — sessions
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(0);
  const [sessionDays, setSessionDays] = useState<string[]>([]);
  const [dayTimes, setDayTimes] = useState<Record<string, string>>({});

  // Optional — notes
  const [goals, setGoals] = useState("");
  const [injuries, setInjuries] = useState("");
  const [notes, setNotes] = useState("");

  // Optional — payments
  const [paymentFreq, setPaymentFreq] = useState<PaymentFrequency>("mensal_dia_1");
  const [overdueDays, setOverdueDays] = useState<string>("3");

  // Optional — plans
  const [workoutPlan, setWorkoutPlan] = useState("");
  const [nutritionPlan, setNutritionPlan] = useState("");

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function toggleDay(d: string) {
    setSessionDays((prev) => {
      if (prev.includes(d)) {
        setDayTimes((t) => {
          const { [d]: _omit, ...rest } = t;
          return rest;
        });
        return prev.filter((x) => x !== d);
      }
      if (sessionsPerWeek && prev.length >= sessionsPerWeek) return prev;
      return [...prev, d];
    });
  }

  function createClient() {
    if (!name.trim()) return toast.error("Indica pelo menos o nome.");
    const token = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, "");
    setInviteUrl(`${window.location.origin}/auth?invite=${token}`);
    setStep(2);
    toast.success(`${name} criado(a) (demo).`);
  }

  function copy() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Link copiado.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen px-5 pb-24 pt-6">
      <Link to="/pt/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      {step === 1 ? (
        <>
          <h1 className="text-2xl font-bold tracking-tight">Novo cliente</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Só o nome é obrigatório. Tudo o resto podes preencher agora ou mais tarde.
          </p>

          <div className="mt-6 space-y-4">
            {/* Name (required) */}
            <div className="space-y-2">
              <Label>
                Nome completo <span className="text-destructive">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                className="h-12 rounded-xl"
              />
            </div>

            {/* SECTION 1: Tipo & valor */}
            <Section title="Tipo e valor" defaultOpen>
              <div className="space-y-2">
                <Label className="text-xs">Tipo</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["presencial", "consultoria"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        "rounded-xl border-2 p-3 text-left transition-all",
                        type === t ? "border-primary bg-primary/10" : "border-border bg-secondary/40",
                      )}
                    >
                      <p className="text-sm font-semibold capitalize">{t}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {t === "presencial" ? "Sessões presenciais" : "Online / mensal"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <Label className="text-xs">Valor ({type === "presencial" ? "€/sessão" : "€/mês"})</Label>
                <Input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" className="no-spinner h-11 rounded-xl" />
              </div>
            </Section>

            {/* SECTION 2: Sessões */}
            <Section title="Sessões">
              <div className="space-y-2">
                <Label className="text-xs">Sessões por semana</Label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        const next = n === sessionsPerWeek ? 0 : n;
                        setSessionsPerWeek(next);
                        if (next < sessionDays.length) {
                          const trimmed = sessionDays.slice(0, next);
                          setSessionDays(trimmed);
                          setDayTimes((t) => Object.fromEntries(Object.entries(t).filter(([k]) => trimmed.includes(k))));
                        }
                      }}
                      className={cn(
                        "h-10 flex-1 rounded-xl border-2 text-sm font-bold transition-all",
                        sessionsPerWeek === n ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/40 text-muted-foreground",
                      )}
                    >
                      {n}×
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <Label className="text-xs">
                  Dias da semana
                  {sessionsPerWeek > 0 && (
                    <span className="ml-1 text-muted-foreground">({sessionDays.length}/{sessionsPerWeek})</span>
                  )}
                </Label>
                <div className="flex gap-1.5">
                  {WEEKDAYS.map((d) => {
                    const selected = sessionDays.includes(d);
                    const disabled = !selected && sessionsPerWeek > 0 && sessionDays.length >= sessionsPerWeek;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        disabled={disabled}
                        className={cn(
                          "h-10 flex-1 rounded-lg border text-[11px] font-bold transition-all",
                          selected
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-secondary/40 text-muted-foreground",
                          disabled && "opacity-30",
                        )}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {sessionDays.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs">Hora de cada sessão</Label>
                  <div className="space-y-1.5">
                    {sessionDays.map((d) => (
                      <div key={d} className="flex items-center gap-2 rounded-xl bg-secondary/40 p-2">
                        <span className="grid h-10 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{d}</span>
                        <TimeSelect
                          value={dayTimes[d] ?? "09:00"}
                          onChange={(v) => setDayTimes((t) => ({ ...t, [d]: v }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* SECTION 3: Notas */}
            <Section title="Objetivos e notas">
              <div className="space-y-2">
                <Label className="text-xs">Objetivos</Label>
                <Textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="Ex: perder 5 kg até ao verão, hipertrofia geral..."
                  className="min-h-[70px] rounded-xl"
                />
              </div>
              <div className="mt-3 space-y-2">
                <Label className="text-xs">Lesões / restrições</Label>
                <Textarea
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  placeholder="Ex: tendinite ombro direito, lombar sensível..."
                  className="min-h-[60px] rounded-xl"
                />
              </div>
              <div className="mt-3 space-y-2">
                <Label className="text-xs">Notas internas</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas só para ti..."
                  className="min-h-[60px] rounded-xl"
                />
              </div>
            </Section>

            {/* SECTION 3.5: Pagamentos */}
            <Section title="Pagamentos">
              <div className="space-y-2">
                <Label className="text-xs">Quando o cliente paga</Label>
                <Select value={paymentFreq} onValueChange={(v) => setPaymentFreq(v as PaymentFrequency)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PAYMENT_FREQUENCY_LABEL) as [PaymentFrequency, string][]).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 space-y-2">
                <Label className="text-xs">Dias após data limite para enviar push de aviso ao aluno</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={overdueDays}
                  onChange={(e) => setOverdueDays(e.target.value)}
                  className="no-spinner h-11 rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">
                  Se o aluno não pagar até X dias após a data limite, recebe uma push notification. Default: 3 dias.
                </p>
              </div>
            </Section>

            {/* SECTION 4: Planos iniciais */}
            <Section title="Plano de treino e nutrição">
              <div className="space-y-2">
                <Label className="text-xs">Plano de treino inicial</Label>
                <Textarea
                  value={workoutPlan}
                  onChange={(e) => setWorkoutPlan(e.target.value)}
                  placeholder="Ex: Full Body 3×/semana — A: agachamento, supino, remada..."
                  className="min-h-[80px] rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">
                  Podes refinar depois no Workout Builder.
                </p>
              </div>
              <div className="mt-3 space-y-2">
                <Label className="text-xs">Plano nutricional / dicas</Label>
                <Textarea
                  value={nutritionPlan}
                  onChange={(e) => setNutritionPlan(e.target.value)}
                  placeholder="Ex: 2200 kcal, 160P/220C/65G. Beber 2L água, 4 refeições..."
                  className="min-h-[80px] rounded-xl"
                />
              </div>
            </Section>

            {/* AI hint */}
            <div className="ai-border relative rounded-2xl bg-accent/5 p-3.5">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="font-semibold gradient-text-ai">Hercles AI</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Depois de criar, posso gerar planos completos a partir destas notas. Basta pedir no chat.
              </p>
            </div>

            {/* Submit Button - Normal flow at the bottom */}
            <div className="mt-8 pt-4 pb-8">
              <Button
                onClick={createClient}
                disabled={!name.trim()}
                className="h-12 w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-40"
              >
                Criar cliente
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold tracking-tight">Convida o cliente</h1>
          <p className="mt-1 text-sm text-muted-foreground">Envia este link. Quando o cliente abrir, cria a conta dele e fica ligado a ti.</p>

          <div className="glass mt-6 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link de convite</p>
            <div className="mt-2 break-all rounded-lg bg-background p-3 font-mono text-xs">{inviteUrl}</div>
            <Button onClick={copy} className="mt-3 h-11 w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
              {copied ? <><Check className="mr-2 h-4 w-4" /> Copiado</> : <><Copy className="mr-2 h-4 w-4" /> Copiar link</>}
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => navigate("/pt/clients")}>Voltar à lista</Button>
            <Button
              onClick={() => {
                setStep(1);
                setName("");
                setValue("");
                setSessionsPerWeek(0);
                setSessionDays([]);
                setDayTimes({});
                setGoals("");
                setInjuries("");
                setNotes("");
                setPaymentFreq("mensal_dia_1");
                setOverdueDays("3");
                setWorkoutPlan("");
                setNutritionPlan("");
                setInviteUrl(null);
              }}
              className="bg-secondary hover:bg-secondary/80"
            >
              Adicionar outro
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="glass rounded-2xl">
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
        <span className="text-sm font-bold">{title}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="px-4 pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
