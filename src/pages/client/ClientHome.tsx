import { Link } from "react-router-dom";
import {
  Flame, Calendar, Trophy, ChevronRight, Dumbbell, Zap, Settings as SettingsIcon, ClipboardList,
  CreditCard, Apple, MessageCircle, Activity, Trophy as TrophyIcon, ShieldCheck, Sparkles,
} from "lucide-react";
import { mockClientStats, mockSessions, mockWorkouts, clientById } from "@/lib/mocks";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { greetingPT } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { NotificationsBell, type NotificationItem } from "@/components/NotificationsBell";

const ME = clientById("c1")!;

const CLIENT_NOTIFICATIONS: NotificationItem[] = [
  { id: "cn1", icon: CreditCard, text: "Lembrete: pagamento da próxima sessão é amanhã.", to: "/app/settings#pagamentos", unread: true },
  { id: "cn2", icon: Dumbbell, text: "O teu PT atualizou o teu plano de treino.", to: "/app/workout", unread: true },
  { id: "cn3", icon: Apple, text: "Nova dica nutricional do teu PT.", to: "/app/nutrition", unread: true },
  { id: "cn4", icon: MessageCircle, text: "O teu PT respondeu à tua mensagem.", to: "/app/chat" },
  { id: "cn5", icon: Activity, text: "Check-in semanal disponível.", to: "/app/progress" },
  { id: "cn6", icon: TrophyIcon, text: "Novo recorde pessoal — supino 43,5 kg!", to: "/app/progress" },
  { id: "cn7", icon: ShieldCheck, text: "Protege a tua conta — ativa 2FA.", to: "/app/settings#seguranca" },
  { id: "cn8", icon: Sparkles, text: "Sugestão da Hercles AI: hidrata-te antes do treino!" },
];

export default function ClientHome() {
  const upcoming = mockSessions
    .filter((s) => s.client_id === ME.id && new Date(s.scheduled_at) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at))
    .slice(0, 3);

  const todayWorkout = mockWorkouts.find((w) => w.client_id === ME.id);
  const pct = Math.round((mockClientStats.workouts_this_week / mockClientStats.workouts_target) * 100);

  return (
    <div className="px-5 pb-6 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{greetingPT()},</p>
          <h1 className="text-2xl font-bold tracking-tight">{ME.full_name.split(" ")[0]} 🔥</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsBell items={CLIENT_NOTIFICATIONS} storageKey="fitpilot.notifications.cleared.client" />
          <Link to="/app/settings" className="grid h-10 w-10 place-items-center rounded-xl bg-secondary" aria-label="Definições">
            <SettingsIcon className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <Link to="/app/ranking" className="relative mt-5 block overflow-hidden rounded-3xl p-5 shadow-glow transition-transform active:scale-95" style={{ background: "var(--gradient-primary)" }}>
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between text-primary-foreground">
          <div>
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Streak actual</span>
            </div>
            <p className="mt-1 text-5xl font-black tracking-tight">{mockClientStats.streak_days}</p>
            <p className="text-xs opacity-80">dias consecutivos</p>
          </div>
          <div className="text-right">
            <Trophy className="ml-auto mb-1 h-6 w-6" />
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">Recorde</p>
            <p className="text-lg font-bold">21 dias</p>
          </div>
        </div>
      </Link>

      <div className="glass mt-4 rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Esta semana</p>
          <p className="text-xs font-semibold">
            {mockClientStats.workouts_this_week}/{mockClientStats.workouts_target} treinos
          </p>
        </div>
        <Progress value={pct} className="h-2" />
        <p className="mt-2 text-[11px] text-muted-foreground">Faltam {mockClientStats.workouts_target - mockClientStats.workouts_this_week} para bateres a meta 💪</p>
      </div>

      {todayWorkout && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Treino de hoje</h2>
          <Link to="/app/workout" className="glass relative block overflow-hidden rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{todayWorkout.name}</p>
                  <p className="text-[11px] text-muted-foreground">{todayWorkout.exercises.length} exercícios · ~45 min</p>
                </div>
              </div>
              <Button size="sm" className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                <Zap className="mr-1 h-3.5 w-3.5" /> Iniciar
              </Button>
            </div>
          </Link>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Próximas sessões</h2>
        {upcoming.length === 0 ? (
          <div className="glass rounded-2xl p-4 text-center text-xs text-muted-foreground">
            <Calendar className="mx-auto mb-1 h-5 w-5 opacity-50" />
            Sem sessões agendadas.
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((s) => (
              <div key={s.id} className="glass flex items-center gap-3 rounded-2xl p-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-center">
                  <span className="text-[10px] uppercase opacity-70 leading-none">{format(new Date(s.scheduled_at), "MMM", { locale: pt })}</span>
                  <span className="text-base font-bold leading-none">{format(new Date(s.scheduled_at), "d")}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold capitalize">{s.type}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(s.scheduled_at), "EEEE, HH:mm", { locale: pt })} · {s.duration_min} min
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Slot para check-in (typeform) — placeholder enquanto não há nenhum a preencher */}
      <section className="mt-6">
        <div className="glass flex items-center gap-3 rounded-2xl p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-muted-foreground">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Check-in</p>
            <p className="text-sm">Sem check-ins por preencher 🎉</p>
          </div>
        </div>
      </section>
    </div>
  );
}
