import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Settings as SettingsIcon, Trophy, Flame, Target } from "lucide-react";
import { mockClients, clientById } from "@/lib/mocks";
import { greetingPT } from "@/lib/format";
import { NotificationsBell } from "@/components/NotificationsBell";
import { cn } from "@/lib/utils";

// Reusing same mock as ClientHome
const CLIENT_NOTIFICATIONS = [
  { id: "cn1", icon: Trophy, text: "O teu PT atualizou o teu plano de treino.", to: "/app/workout", unread: true },
];

export default function Ranking({ isTrainer = false }: { isTrainer?: boolean }) {
  const ME = clientById("c1")!;

  // Generate leaderboard based on attendance_pct for mockup purposes
  const leaderboard = useMemo(() => {
    return [...mockClients]
      .filter(c => c.status !== "inativo")
      .map(c => ({
        ...c,
        workouts_month: Math.floor((c.attendance_pct / 100) * 20), // mock 20 workouts a month max
      }))
      .sort((a, b) => b.workouts_month - a.workouts_month);
  }, []);

  const totalTrainedToday = 8; // Mock value
  const topStudent = leaderboard[0];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background px-5 pb-6 pt-6">
      {!isTrainer && (
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{greetingPT()},</p>
            <h1 className="text-2xl font-bold tracking-tight">{ME.full_name.split(" ")[0]} 🔥</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell items={CLIENT_NOTIFICATIONS} storageKey="hercles.notifications.cleared.ranking" />
            <Link to="/app/settings" className="grid h-10 w-10 place-items-center rounded-xl bg-secondary" aria-label="Definições">
              <SettingsIcon className="h-5 w-5" />
            </Link>
          </div>
        </header>
      )}

      {isTrainer && (
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Ranking & Competição</h1>
          <p className="text-sm text-muted-foreground">Liderança do mês</p>
        </header>
      )}

      <div className={cn("glass relative mt-5 flex items-center gap-4 overflow-hidden rounded-3xl p-5 shadow-glow", !isTrainer && "mt-5")}>
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="flex -space-x-4">
          {leaderboard.slice(0, 3).map((c, i) => (
            <div key={c.id} className="relative z-10 grid h-12 w-12 place-items-center rounded-full border-4 border-background bg-secondary text-sm font-bold shadow-md">
              {c.avatar_url ? (
                <img src={c.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                c.full_name.charAt(0)
              )}
              {i === 0 && (
                <div className="absolute -bottom-1 -right-1 rounded-full bg-yellow-500 p-0.5 text-black">
                  <Trophy className="h-3 w-3" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="relative z-10 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Liderança do Mês</p>
          <p className="mt-0.5 text-lg font-bold">{totalTrainedToday} Treinaram Hoje</p>
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-3">
        {leaderboard.map((student, index) => {
          const rank = index + 1;
          const isMe = !isTrainer && student.id === ME.id;
          let rankIcon;
          
          if (rank === 1) rankIcon = <Trophy className="h-5 w-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />;
          else if (rank === 2) rankIcon = <Trophy className="h-5 w-5 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]" />;
          else if (rank === 3) rankIcon = <Trophy className="h-5 w-5 text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]" />;
          else rankIcon = <span className="text-lg">👏</span>;

          return (
            <div
              key={student.id}
              className={cn(
                "flex items-center gap-4 rounded-2xl p-3 transition-colors",
                isMe ? "border border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.15)]" : "glass"
              )}
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center font-bold">
                {rankIcon}
              </div>
              
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold">
                {student.avatar_url ? (
                  <img src={student.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  student.full_name.charAt(0)
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {student.full_name}
                  {isMe && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-primary">(Tu)</span>}
                </p>
                <p className="text-[11px] text-muted-foreground">{student.workouts_month} treinos</p>
              </div>
            </div>
          );
        })}
      </div>

      {!isTrainer && (
        <div className="mt-6 grid grid-cols-2 gap-3 pb-24">
          <div className="glass rounded-2xl p-4">
            <div className="mb-2 flex items-center gap-1.5 text-yellow-500">
              <Trophy className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Aluno Destaque</span>
            </div>
            <p className="text-sm font-bold">{topStudent?.full_name.split(" ")[0]}</p>
            <p className="text-[10px] text-muted-foreground">{topStudent?.workouts_month} treinos</p>
          </div>
          
          <div className="glass rounded-2xl p-4">
            <div className="mb-2 flex items-center gap-1.5 text-primary">
              <Target className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">O Meu Percurso</span>
            </div>
            <p className="text-sm font-bold">{ME.workouts_month || Math.floor((ME.attendance_pct / 100) * 20)} treinos</p>
            <p className="text-[10px] text-muted-foreground">Este mês</p>
          </div>
        </div>
      )}
      
      {isTrainer && <div className="pb-24" />}
    </div>
  );
}
