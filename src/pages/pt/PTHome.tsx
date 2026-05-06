import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, Sparkles, Users as UsersIcon, Wallet, MessageSquare,
  Activity, Settings as SettingsIcon, Trophy, MessageCircle, CreditCard,
  Apple, Heart, ShieldCheck, AlertTriangle, UserX, MapPin, CheckCircle2, ThumbsUp,
} from "lucide-react";
import { fmtEUR, greetingPT } from "@/lib/format";
import { cn } from "@/lib/utils";
import { mockClients, mockChats } from "@/lib/mocks";
import { NotificationsBell, type NotificationItem } from "@/components/NotificationsBell";
import { useProfile } from "@/contexts/ProfileContext";

const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", icon: Trophy, text: "Joana atingiu um novo record em supino — 43,5 kg!", to: "/pt/clients/c1", unread: true },
  { id: "n2", icon: MessageCircle, text: "Joana mandou-te mensagem", to: "/pt/chat/c1", unread: true },
  { id: "n3", icon: CreditCard, text: "Não te esqueças de confirmar o pagamento da aula de hoje", to: "/pt/business", unread: true },
  { id: "n4", icon: Apple, text: "Joana tem a secção do plano de nutrição vazia, dá-lhe umas dicas!", to: "/pt/clients/c1" },
  { id: "n5", icon: Heart, text: "Elogia a Joana, foi a mais ativa do mês!", to: "/pt/chat/c1" },
  { id: "n6", icon: ShieldCheck, text: "Protege a tua conta — ativa autenticação 2FA.", to: "/pt/settings#seguranca" },
  { id: "n7", icon: AlertTriangle, text: "Plano gratuito no limite de alunos!", to: "/pt/settings#avancadas" },
  { id: "n8", icon: AlertTriangle, text: "O João continua sem plano de treino!", to: "/pt/clients/c2" },
  { id: "n9", icon: Sparkles, text: "Pergunta ao Hercles AI o que falta adicionares!", to: "/pt/ai" },
  { id: "n10", icon: UserX, text: "Carla não foi treinar hoje!", to: "/pt/clients/c3" },
  { id: "n11", icon: MessageCircle, text: "Joana deixou uma mensagem na comunidade alunos", to: "/pt/chat" },
  { id: "n12", icon: MapPin, text: "João está perdido no novo ginásio!", to: "/pt/chat/c2" },
  { id: "n13", icon: CheckCircle2, text: "Tudo em ordem por hoje, Ricardo!" },
  { id: "n14", icon: ThumbsUp, text: "Bom trabalho Ricardo, a Joana está a bombar!" },
];

export default function PTHome() {
  const [aiOpen, setAiOpen] = useState(false);
  const { profile } = useProfile();
  const firstName = (profile.pt.name || "").trim().split(/\s+/)[0] || "treinador";

  const active = mockClients.filter((c) => c.status !== "inativo").length;
  const revenue = mockClients.reduce((s, c) => s + (c.monthly_value ?? 0) + (c.session_value ? c.session_value * 8 : 0), 0);
  const attendance = Math.round(mockClients.reduce((s, c) => s + c.attendance_pct, 0) / mockClients.length);
  const pending = mockChats.filter((m) => m.sender_role === "client" && !m.read).length;

  return (
    <div className="pb-6 h-full overflow-y-auto no-scrollbar">
      <header className="bg-background">
        <div className="flex items-center justify-between px-5 pb-4 pt-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{greetingPT()},</p>
            <h1 className="text-2xl font-bold tracking-tight">Olá {firstName} 👋</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{active} clientes activos</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell items={NOTIFICATIONS} storageKey="fitpilot.notifications.cleared.pt" />
            <Link to="/pt/settings" className="grid h-10 w-10 place-items-center rounded-xl bg-secondary" aria-label="Definições">
              <SettingsIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="px-5 pb-4">
          <button
            onClick={() => setAiOpen((o) => !o)}
            className="ai-border relative flex w-full items-center justify-between rounded-2xl bg-accent/5 px-4 py-3 text-left transition-all hover:bg-accent/10"
          >
            <div className="flex items-center gap-2">
              <span className={cn("inline-block transition-transform", aiOpen && "rotate-90")}>▶</span>
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold gradient-text-ai">Hercles AI • Hoje</span>
              {!aiOpen && (
                <span className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-[#f472b6] text-[10px] font-bold text-white shadow-[0_0_8px_#f472b6]">
                  1
                </span>
              )}
            </div>
          </button>
          {aiOpen && (
            <div className="ai-border relative mt-2 rounded-2xl bg-accent/5 p-4 shadow-ai animate-fade-in">
              <p className="text-sm leading-relaxed">
                <strong>Mariana Costa</strong> está com 41% de assiduidade — convém contactar.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Link to="/pt/chat/c3" className="rounded-lg bg-accent/15 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/20 text-center">Mensagem</Link>
                <Link to="/pt/clients/c3" className="rounded-lg bg-accent/15 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/20 text-center">Ver perfil</Link>
                <button
                  onClick={() => setAiOpen(false)}
                  className="rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/80"
                >
                  Agora não
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2.5 px-5 pt-2">
        <KPI icon={UsersIcon} label="Clientes activos" value={String(active)} delta="+1" tone="primary" />
        <KPI icon={Wallet} label="Receita mensal" value={fmtEUR(revenue)} tone="primary" />
        <KPI icon={Activity} label="Assiduidade média" value={`${attendance}%`} tone="primary" />
        <KPI icon={MessageSquare} label="Por responder" value={String(pending)} tone="primary" />
      </div>

      <section className="px-5 pt-4">
        <Link to="/pt/clients" className="flex items-center justify-between rounded-2xl bg-gradient-primary p-4 text-primary-foreground shadow-glow">
          <div>
            <p className="text-sm font-semibold">Ver todos os clientes</p>
            <p className="text-xs opacity-80">Calendário, planos e progresso</p>
          </div>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </section>

      <section className="px-5 pt-6">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Ranking & Competição</h2>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-yellow-500/15 text-yellow-500">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Liderança do Mês</p>
              <div className="mt-1 flex -space-x-2">
                {mockClients.slice(0, 3).map((c, i) => (
                  <div key={c.id} className="grid h-6 w-6 place-items-center rounded-full border-2 border-background bg-secondary text-[10px] font-bold">
                    {c.full_name.charAt(0)}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Link to="/pt/ranking" className="mt-4 block w-full rounded-xl bg-secondary/80 py-2.5 text-center text-xs font-semibold text-foreground transition-colors hover:bg-secondary">
            Ver Ranking Completo
          </Link>
        </div>
      </section>
    </div>
  );
}

function KPI({ icon: Icon, label, value, delta, tone }: { icon: React.ElementType; label: string; value: string; delta?: string | null; tone?: "primary" | "muted" }) {
  return (
    <div className="glass rounded-2xl p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <Icon className={cn("h-4 w-4", tone === "primary" ? "text-primary" : "text-muted-foreground")} />
        {delta && <span className="text-[10px] font-bold text-primary">{delta}</span>}
      </div>
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
