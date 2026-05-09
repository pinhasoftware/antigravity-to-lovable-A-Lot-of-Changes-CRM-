import { useState, useMemo, useRef } from "react";
import { Settings as SettingsIcon, Trophy, Flame, Target, Share2, ArrowUp, ArrowDown, Minus, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { mockClients, mockSessions, clientById } from "@/lib/mocks";
import { greetingPT } from "@/lib/format";
import { NotificationsBell } from "@/components/NotificationsBell";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/UserAvatar";
import { isSameMonth, subMonths, parseISO, isSameDay, startOfDay, subDays } from "date-fns";
import html2canvas from "html2canvas";

const CLIENT_NOTIFICATIONS = [
  { id: "cn1", icon: Trophy, text: "O teu PT atualizou o teu plano de treino.", to: "/app/workout", unread: true },
];

export default function Ranking({ isTrainer = false }: { isTrainer?: boolean }) {
  const ME = clientById("c1")!;
  const [timeframe, setTimeframe] = useState<"month" | "all">("month");
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const stats = useMemo(() => {
    const today = new Date();
    const lastMonthDate = subMonths(today, 1);

    return mockClients
      .filter(c => c.status !== "inativo")
      .map(client => {
        // Encontrar sessões concluídas do cliente
        const clientSessions = mockSessions.filter(s => s.client_id === client.id && s.status === "concluido");
        
        const thisMonthSessions = clientSessions.filter(s => isSameMonth(parseISO(s.scheduled_at), today));
        const lastMonthSessions = clientSessions.filter(s => isSameMonth(parseISO(s.scheduled_at), lastMonthDate));
        
        const thisMonthCount = thisMonthSessions.length;
        const lastMonthCount = lastMonthSessions.length;
        const allTimeCount = clientSessions.length;
        
        const trainedToday = clientSessions.some(s => isSameDay(parseISO(s.scheduled_at), today));
        
        // Streak (apenas visual com dados mock para não dar sempre 0 para toda a gente na demo)
        // Como o mockSessions é pequeno, vamos simular uma streak mais interessante para a demonstração
        const simulatedStreak = Math.floor(Math.random() * 5); // Fallback caso não haja sessões reais
        
        // Cálculo real da streak
        const sortedDates = clientSessions
          .map(s => startOfDay(parseISO(s.scheduled_at)).getTime())
          .sort((a, b) => b - a);
        const uniqueDates = [...new Set(sortedDates)];
        
        let streak = 0;
        let dDate = startOfDay(today).getTime();
        
        if (!uniqueDates.includes(dDate)) {
          const yesterday = subDays(dDate, 1).getTime();
          if (uniqueDates.includes(yesterday)) {
            dDate = yesterday;
          }
        }
        
        if (uniqueDates.includes(dDate)) {
          for (const d of uniqueDates) {
            if (d === dDate) {
              streak++;
              dDate = subDays(dDate, 1).getTime();
            } else if (d < dDate) {
              break;
            }
          }
        }

        return {
          ...client,
          workoutsThisMonth: thisMonthCount > 0 ? thisMonthCount : Math.floor(Math.random() * 15) + 1, // Mock para visualização se for 0
          workoutsAllTime: allTimeCount > 0 ? allTimeCount : Math.floor(Math.random() * 50) + 10,
          diffLastMonth: thisMonthCount - lastMonthCount !== 0 ? thisMonthCount - lastMonthCount : Math.floor(Math.random() * 5) - 2, // Mock difference
          trainedToday: trainedToday || Math.random() > 0.5, // Mock trained today
          streak: streak > 0 ? streak : simulatedStreak
        };
      });
  }, []);

  const leaderboard = useMemo(() => {
    return [...stats].sort((a, b) => {
      const aVal = timeframe === "month" ? a.workoutsThisMonth : a.workoutsAllTime;
      const bVal = timeframe === "month" ? b.workoutsThisMonth : b.workoutsAllTime;
      return bVal - aVal;
    });
  }, [stats, timeframe]);

  const totalTrainedToday = stats.filter(s => s.trainedToday).length;

  const [first, second, third, ...rest] = leaderboard;

  const handleShare = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    
    // Pequeno delay para garantir que o React renderizou o componente visível se necessário
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(exportRef.current!, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#09090b", // zinc-950
          logging: false,
          width: 1080,
          height: 1920
        });
        
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        
        const dateStr = new Date().toLocaleString('pt-PT', { month: 'short', year: 'numeric' }).replace(' de ', '-');
        a.download = `hercles-ranking-${dateStr}.png`;
        a.click();
      } catch (error) {
        console.error("Failed to generate image", error);
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white px-5 pb-24 pt-6 font-sans">
      {!isTrainer && (
        <header className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-medium text-zinc-400">{greetingPT()},</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">{ME.full_name.split(" ")[0]} 🔥</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell items={CLIENT_NOTIFICATIONS} storageKey="hercles.notifications.cleared.ranking" />
            <Link to="/app/settings" className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors" aria-label="Definições">
              <SettingsIcon className="h-5 w-5 text-zinc-300" />
            </Link>
          </div>
        </header>
      )}

      {isTrainer && (
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Ranking</h1>
            <p className="text-sm font-medium text-zinc-400">Competição dos Alunos</p>
          </div>
          
          <button 
            onClick={handleShare}
            disabled={isExporting}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            aria-label="Partilhar Ranking"
          >
            {isExporting ? <Download className="h-4 w-4 animate-bounce" /> : <Share2 className="h-5 w-5" />}
          </button>
        </header>
      )}

      <div className="mx-auto mb-8 flex w-full max-w-sm rounded-full bg-zinc-800/50 p-1 backdrop-blur-sm">
        <button 
          onClick={() => setTimeframe("month")}
          className={cn("flex-1 rounded-full py-2 text-sm font-bold transition-all", timeframe === "month" ? "bg-primary text-primary-foreground shadow-md" : "text-zinc-400 hover:text-zinc-200")}
        >
          Este Mês
        </button>
        <button 
          onClick={() => setTimeframe("all")}
          className={cn("flex-1 rounded-full py-2 text-sm font-bold transition-all", timeframe === "all" ? "bg-primary text-primary-foreground shadow-md" : "text-zinc-400 hover:text-zinc-200")}
        >
          Sempre
        </button>
      </div>

      <div className="mb-10 flex items-center justify-between rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 backdrop-blur-md shadow-xl">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Social Proof</p>
          <p className="mt-0.5 text-lg font-black text-white">
            <span className="text-primary mr-1.5">{totalTrainedToday}</span> treinaram hoje
          </p>
        </div>
        <div className="flex -space-x-3">
          {stats.filter(s => s.trainedToday).slice(0, 4).map((s) => (
            <UserAvatar key={s.id} name={s.full_name} src={s.avatar_url} size="sm" className="border-2 border-zinc-900 shadow-sm" />
          ))}
          {totalTrainedToday > 4 && (
            <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-[10px] font-bold z-10 relative">
              +{totalTrainedToday - 4}
            </div>
          )}
        </div>
      </div>

      <div className="mb-12 mt-6 flex items-end justify-center gap-2 sm:gap-6 px-1 relative">
        <div className="absolute inset-0 top-1/2 -z-10 bg-gradient-to-t from-primary/5 to-transparent blur-2xl" />
        
        {second && (
          <div className="flex flex-col items-center pb-4 w-[30%]">
            <div className="relative mb-3">
               <UserAvatar name={second.full_name} src={second.avatar_url} size="lg" className="border-4 border-zinc-400 shadow-[0_0_15px_rgba(161,161,170,0.3)] bg-zinc-800" />
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-300 to-zinc-400 px-2.5 py-0.5 text-xs font-black text-zinc-900 shadow-md">2º</div>
            </div>
            <p className="text-sm font-bold text-zinc-100 truncate w-full text-center">{second.full_name.split(' ')[0]}</p>
            <p className="text-xs font-bold text-primary">{timeframe === "month" ? second.workoutsThisMonth : second.workoutsAllTime} treinos</p>
          </div>
        )}

        {first && (
          <div className="relative z-10 flex flex-col items-center w-[40%]">
            <div className="absolute -inset-10 -z-10 rounded-full bg-yellow-500/10 blur-2xl animate-pulse" />
            <Trophy className="mb-3 h-8 w-8 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]" />
            <div className="relative mb-4">
               <UserAvatar name={first.full_name} src={first.avatar_url} size="xl" className="border-[5px] border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.4)] bg-zinc-800 h-24 w-24 text-3xl" />
               <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 px-4 py-1 text-sm font-black text-amber-950 shadow-lg border border-yellow-200/50">1º</div>
            </div>
            <p className="text-base font-black text-white truncate w-full text-center">{first.full_name.split(' ')[0]}</p>
            <p className="text-sm font-black text-primary">{timeframe === "month" ? first.workoutsThisMonth : first.workoutsAllTime} treinos</p>
          </div>
        )}

        {third && (
          <div className="flex flex-col items-center pb-4 w-[30%]">
            <div className="relative mb-3">
               <UserAvatar name={third.full_name} src={third.avatar_url} size="lg" className="border-4 border-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.3)] bg-zinc-800" />
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-500 to-amber-600 px-2.5 py-0.5 text-xs font-black text-amber-950 shadow-md">3º</div>
            </div>
            <p className="text-sm font-bold text-zinc-100 truncate w-full text-center">{third.full_name.split(' ')[0]}</p>
            <p className="text-xs font-bold text-primary">{timeframe === "month" ? third.workoutsThisMonth : third.workoutsAllTime} treinos</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pb-8">
        {rest.map((student, idx) => {
          const rank = idx + 4;
          const val = timeframe === "month" ? student.workoutsThisMonth : student.workoutsAllTime;
          const isMe = !isTrainer && student.id === ME.id;
          
          return (
            <div 
              key={student.id} 
              className={cn(
                "flex items-center gap-4 rounded-2xl p-4 transition-all hover:bg-zinc-800/60",
                isMe 
                  ? "bg-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                  : "bg-zinc-900/60 border border-zinc-800/50 backdrop-blur-sm"
              )}
            >
              <div className="w-5 text-center text-sm font-black text-zinc-500">{rank}</div>
              
              <div className="relative">
                <UserAvatar name={student.full_name} src={student.avatar_url} size="md" className="bg-zinc-800" />
                {student.trainedToday && (
                  <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-zinc-900 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white truncate">
                    {student.full_name}
                    {isMe && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-primary">(Tu)</span>}
                  </p>
                  {student.streak > 0 && (
                    <div className="flex items-center gap-0.5 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-500 border border-orange-500/20">
                      <Flame className="h-3 w-3" />
                      {student.streak}
                    </div>
                  )}
                </div>
                
                <div className="mt-1 flex items-center gap-3">
                   <p className="text-xs text-zinc-400 font-medium">{val} treinos</p>
                   
                   {timeframe === "month" && (
                     <div className={cn("flex items-center gap-0.5 text-[10px] font-bold", 
                       student.diffLastMonth > 0 ? "text-emerald-400" : 
                       student.diffLastMonth < 0 ? "text-red-400" : "text-zinc-500"
                     )}>
                       {student.diffLastMonth > 0 ? <ArrowUp className="h-3 w-3" /> : 
                        student.diffLastMonth < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                       {Math.abs(student.diffLastMonth)} vs mês passado
                     </div>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute top-[-20000px] left-[-20000px] pointer-events-none opacity-0">
        <div 
          ref={exportRef} 
          className="w-[1080px] h-[1920px] bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-16 flex flex-col font-sans"
        >
          <div className="flex items-center gap-6 mb-24 mt-12">
            <div className="h-24 w-24 rounded-[2rem] bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(var(--primary),0.4)]">
               <Trophy className="h-12 w-12 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-5xl font-black text-white tracking-tight">HERCLES</h2>
              <p className="text-3xl font-bold text-zinc-400 mt-2">{new Date().toLocaleString('pt-PT', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center pt-20">
            <h1 className="text-[5.5rem] leading-[1.1] font-black text-white text-center mb-40">Os meus alunos<br/>este mês 💪</h1>
            
            <div className="flex items-end justify-center gap-16 px-10 w-full relative">
               <div className="absolute inset-0 top-1/2 -z-10 bg-gradient-to-t from-primary/10 to-transparent blur-3xl" />

               {second && (
                 <div className="flex flex-col items-center pb-12 w-[30%]">
                   <div className="relative mb-6">
                      <UserAvatar name={second.full_name} src={second.avatar_url} size="xl" className="border-[8px] border-zinc-400 shadow-[0_0_30px_rgba(161,161,170,0.3)] bg-zinc-800 h-40 w-40 text-5xl" />
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-300 to-zinc-400 px-6 py-1.5 text-2xl font-black text-zinc-900 shadow-xl border-2 border-zinc-200/50">2º</div>
                   </div>
                   <p className="text-3xl font-bold text-zinc-100 mt-4 truncate w-full text-center">{second.full_name.split(' ')[0]}</p>
                   <p className="text-2xl font-black text-primary mt-2">{timeframe === "month" ? second.workoutsThisMonth : second.workoutsAllTime} treinos</p>
                 </div>
               )}

               {first && (
                 <div className="relative z-10 flex flex-col items-center w-[40%]">
                   <div className="absolute -inset-20 -z-10 rounded-full bg-yellow-500/10 blur-3xl" />
                   <Trophy className="mb-6 h-20 w-20 text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.6)]" />
                   <div className="relative mb-8">
                      <UserAvatar name={first.full_name} src={first.avatar_url} size="xl" className="border-[12px] border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)] bg-zinc-800 h-56 w-56 text-7xl" />
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 px-8 py-2 text-3xl font-black text-amber-950 shadow-2xl border-4 border-yellow-200/50">1º</div>
                   </div>
                   <p className="text-5xl font-black text-white mt-4 truncate w-full text-center">{first.full_name.split(' ')[0]}</p>
                   <p className="text-3xl font-black text-primary mt-2">{timeframe === "month" ? first.workoutsThisMonth : first.workoutsAllTime} treinos</p>
                 </div>
               )}

               {third && (
                 <div className="flex flex-col items-center pb-12 w-[30%]">
                   <div className="relative mb-6">
                      <UserAvatar name={third.full_name} src={third.avatar_url} size="xl" className="border-[8px] border-amber-600 shadow-[0_0_30px_rgba(217,119,6,0.3)] bg-zinc-800 h-40 w-40 text-5xl" />
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-500 to-amber-600 px-6 py-1.5 text-2xl font-black text-amber-950 shadow-xl border-2 border-amber-400/50">3º</div>
                   </div>
                   <p className="text-3xl font-bold text-zinc-100 mt-4 truncate w-full text-center">{third.full_name.split(' ')[0]}</p>
                   <p className="text-2xl font-black text-primary mt-2">{timeframe === "month" ? third.workoutsThisMonth : third.workoutsAllTime} treinos</p>
                 </div>
               )}
            </div>
            
            {rest.length > 0 && (
              <div className="mt-32 w-full max-w-4xl flex flex-col gap-6">
                 {rest.slice(0, 2).map((student, idx) => {
                    const rank = idx + 4;
                    const val = timeframe === "month" ? student.workoutsThisMonth : student.workoutsAllTime;
                    return (
                      <div key={student.id} className="flex items-center gap-8 rounded-[2rem] bg-zinc-900/80 p-8 border-2 border-zinc-800">
                        <div className="w-12 text-center text-3xl font-black text-zinc-500">{rank}</div>
                        <UserAvatar name={student.full_name} src={student.avatar_url} size="xl" className="h-20 w-20 text-3xl bg-zinc-800" />
                        <div className="flex-1">
                          <p className="text-3xl font-bold text-white">{student.full_name}</p>
                          <p className="text-2xl text-zinc-400 mt-1">{val} treinos</p>
                        </div>
                      </div>
                    );
                 })}
              </div>
            )}
          </div>

          <div className="mt-auto flex justify-center pb-16">
             <div className="flex items-center gap-3 opacity-60">
               <Trophy className="h-6 w-6 text-zinc-400" />
               <p className="text-3xl font-bold text-zinc-400 tracking-widest uppercase">powered by Hercles</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
