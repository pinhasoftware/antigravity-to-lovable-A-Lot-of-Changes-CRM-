import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { addDays, endOfWeek, format, isSameDay, startOfWeek, subDays } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Mic, Send, UserPlus, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
import { ClientCardMenu } from "@/components/pt/ClientCardMenu";
import { cn } from "@/lib/utils";
import { mockClients, mockSessions, clientById, type MockSession } from "@/lib/mocks";
import { usePTUI } from "@/contexts/PTUIContext";

const TABS = ["Calendário", "Todos", "Presencial", "Consultoria", "Atenção"] as const;
type Tab = typeof TABS[number];

const WEEKDAY_MAP: Record<string, number> = {
  segunda: 1, "2a": 1, "2ª": 1, seg: 1,
  terca: 2, terça: 2, ter: 2,
  quarta: 3, qua: 3,
  quinta: 4, qui: 4,
  sexta: 5, sex: 5,
  sabado: 6, sábado: 6, sab: 6, sáb: 6,
  domingo: 0, dom: 0,
};

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Mini-parser PT para alterações ao calendário via texto.
 * Suporta exemplos:
 *  - "marca treino com Ana sexta 10h"
 *  - "agenda João amanhã 18:30"
 *  - "cancela sessão de Mariana hoje"
 *  - "remarca Ana de quinta para sexta 11h"
 */
function parseCalendarCommand(
  text: string,
  sessions: MockSession[],
  weekStart: Date,
): { action: "add" | "remove" | "move"; payload?: Partial<MockSession> & { id?: string; oldDay?: number; newDay?: number; newTime?: string }; message: string } | null {
  const raw = stripAccents(text.trim().toLowerCase());
  if (!raw) return null;

  // Find a client mention by first/last name.
  const client = mockClients.find((c) => {
    const parts = stripAccents(c.full_name.toLowerCase()).split(" ");
    return parts.some((p) => p.length > 2 && raw.includes(p));
  });

  // Find a time like "10h", "10h00", "10:30"
  const timeMatch = raw.match(/(\d{1,2})\s*(?:h|:)\s*(\d{0,2})/);
  const hour = timeMatch ? Math.min(23, parseInt(timeMatch[1], 10)) : null;
  const minute = timeMatch && timeMatch[2] ? Math.min(59, parseInt(timeMatch[2], 10)) : 0;

  // Find a day reference
  let targetDate: Date | null = null;
  if (/\bhoje\b/.test(raw)) targetDate = new Date();
  else if (/\bamanha\b/.test(raw)) targetDate = addDays(new Date(), 1);
  else {
    for (const [k, idx] of Object.entries(WEEKDAY_MAP)) {
      if (new RegExp(`\\b${k}\\b`).test(raw)) {
        // Map Sunday=0 to a Monday-week offset (Mon=0 .. Sun=6)
        const offset = (idx + 6) % 7;
        targetDate = addDays(weekStart, offset);
        break;
      }
    }
  }

  // Cancellation
  if (/\bcancel|remov|apag|elimin/.test(raw)) {
    if (!client) return { action: "remove", message: "Diz qual o cliente da sessão a cancelar." };
    const candidate = sessions.find((s) => {
      if (s.client_id !== client.id) return false;
      if (targetDate) return isSameDay(new Date(s.scheduled_at), targetDate);
      return true;
    });
    if (!candidate) return { action: "remove", message: `Não encontrei sessão de ${client.full_name} para cancelar.` };
    return {
      action: "remove",
      payload: { id: candidate.id },
      message: `Sessão de ${client.full_name} cancelada.`,
    };
  }

  // Reschedule
  if (/\bremarc|move|muda/.test(raw)) {
    if (!client || !targetDate) return { action: "move", message: "Indica o cliente e o novo dia/hora." };
    const candidate = sessions.find((s) => s.client_id === client.id);
    if (!candidate) return { action: "move", message: `Sem sessões de ${client.full_name} para remarcar.` };
    const next = new Date(targetDate);
    if (hour !== null) next.setHours(hour, minute, 0, 0);
    else {
      const old = new Date(candidate.scheduled_at);
      next.setHours(old.getHours(), old.getMinutes(), 0, 0);
    }
    return {
      action: "move",
      payload: { id: candidate.id, scheduled_at: next.toISOString() },
      message: `Sessão de ${client.full_name} remarcada para ${format(next, "EEEE d 'às' HH:mm", { locale: pt })}.`,
    };
  }

  // Add
  if (/\bmarca|agenda|adicion|cria/.test(raw)) {
    if (!client) return { action: "add", message: "Diz com que cliente é a sessão." };
    if (!targetDate) return { action: "add", message: "Indica o dia (hoje, amanhã, sexta...)." };
    const dt = new Date(targetDate);
    dt.setHours(hour ?? 10, minute, 0, 0);
    return {
      action: "add",
      payload: {
        client_id: client.id,
        scheduled_at: dt.toISOString(),
        duration_min: 60,
        type: client.type,
        status: "agendado",
        paid: false,
      },
      message: `Sessão com ${client.full_name} marcada para ${format(dt, "EEEE d 'às' HH:mm", { locale: pt })}.`,
    };
  }

  return null;
}

export default function PTClients() {
  const { clientsTab, setClientsTab, setLastClientId } = usePTUI();
  const tab = clientsTab;
  const setTab = (t: Tab) => setClientsTab(t);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [aiInput, setAiInput] = useState("");
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [sessions, setSessions] = useState<MockSession[]>(() => [...mockSessions]);
  
  // Drag & Drop state
  const [dragSession, setDragSession] = useState<string | null>(null);
  const [dropConfirm, setDropConfirm] = useState<{ sessionId: string, newDate: Date } | null>(null);
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    setLastClientId(null);
  }, [setLastClientId]);

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const weekSessions = useMemo(() => {
    const from = weekStart;
    const to = endOfWeek(weekStart, { weekStartsOn: 1 });
    return sessions.filter((s) => {
      const d = new Date(s.scheduled_at);
      return d >= from && d <= to;
    });
  }, [weekStart, sessions]);

  const sessionsBy = useMemo(() => {
    const map: Record<string, MockSession[]> = {};
    weekSessions.forEach((s) => {
      const k = format(new Date(s.scheduled_at), "yyyy-MM-dd");
      (map[k] ??= []).push(s);
    });
    return map;
  }, [weekSessions]);

  const dayKey = format(selectedDay, "yyyy-MM-dd");
  const eventsForDay = sessionsBy[dayKey] ?? [];

  const filtered = useMemo(() => {
    const visible = mockClients.filter((c) => !deletedIds.includes(c.id));
    if (tab === "Calendário" || tab === "Todos") return visible;
    if (tab === "Presencial") return visible.filter((c) => c.type === "presencial");
    if (tab === "Consultoria") return visible.filter((c) => c.type === "consultoria");
    if (tab === "Atenção") return visible.filter((c) => c.status === "atencao");
    return visible;
  }, [tab, deletedIds]);

  function executeAI() {
    const result = parseCalendarCommand(aiInput, sessions, weekStart);
    if (!result) {
      toast.error("Não percebi o pedido. Ex: 'marca treino com Ana sexta 10h'.");
      return;
    }
    if (!result.payload) {
      toast.error(result.message);
      return;
    }
    if (result.action === "add" && result.payload.scheduled_at && result.payload.client_id) {
      const newSession: MockSession = {
        id: `ai-${Date.now()}`,
        client_id: result.payload.client_id,
        scheduled_at: result.payload.scheduled_at,
        duration_min: result.payload.duration_min ?? 60,
        type: result.payload.type ?? "presencial",
        status: result.payload.status ?? "agendado",
        paid: result.payload.paid ?? false,
      };
      setSessions((prev) => [...prev, newSession]);
      setSelectedDay(new Date(newSession.scheduled_at));
      toast.success(result.message, { id: "ai-cal" });
    } else if (result.action === "remove" && result.payload.id) {
      setSessions((prev) => prev.filter((s) => s.id !== result.payload!.id));
      toast.success(result.message, { id: "ai-cal" });
    } else if (result.action === "move" && result.payload.id && result.payload.scheduled_at) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === result.payload!.id ? { ...s, scheduled_at: result.payload!.scheduled_at! } : s,
        ),
      );
      setSelectedDay(new Date(result.payload.scheduled_at));
      toast.success(result.message, { id: "ai-cal" });
    }
    setAiInput("");
  }

  function handleMic() {
    toast.info("A escutar... (demo)");
    setTimeout(() => {
      setAiInput("remarca a sessão para sexta 10:30");
      toast.success("Áudio reconhecido!");
    }, 1500);
  }

  function confirmMoveSession() {
    if (!dropConfirm) return;
    const session = sessions.find((s) => s.id === dropConfirm.sessionId);
    if (!session) return;

    const nextDate = new Date(dropConfirm.newDate);
    if (newTime) {
      const [h, m] = newTime.split(":");
      nextDate.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
    } else {
      const old = new Date(session.scheduled_at);
      nextDate.setHours(old.getHours(), old.getMinutes(), 0, 0);
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === dropConfirm.sessionId ? { ...s, scheduled_at: nextDate.toISOString() } : s
      )
    );
    setSelectedDay(nextDate);
    setDropConfirm(null);
    setNewTime("");
    toast.success("Sessão remarcada com sucesso!");
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 pb-3 pt-6">
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <Link to="/pt/clients/new" className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-glow">
            <UserPlus className="h-4 w-4" /> Novo
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto px-5 pb-3 no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                tab === t ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {tab === "Calendário" ? (
        <section className="flex-1 px-5 pt-3 pb-6">
          <div className="sticky top-[100px] z-20 -mx-5 bg-background/85 px-5 pb-3 backdrop-blur-xl">
          <div className="glass rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button onClick={() => setWeekStart(subDays(weekStart, 7))} className="grid h-8 w-8 place-items-center rounded-lg bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
              <p className="flex-1 text-center text-sm font-semibold">
                {format(weekStart, "d MMM", { locale: pt })} – {format(addDays(weekStart, 6), "d MMM", { locale: pt })}
              </p>
              <button
                onClick={() => {
                  const today = new Date();
                  setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
                  setSelectedDay(today);
                }}
                className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary/80"
              >
                Hoje
              </button>
              <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="grid h-8 w-8 place-items-center rounded-lg bg-secondary"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {week.map((d) => {
                const isSel = isSameDay(d, selectedDay);
                const isToday = isSameDay(d, new Date());
                const k = format(d, "yyyy-MM-dd");
                const has = (sessionsBy[k]?.length ?? 0) > 0;
                return (
                  <button
                    key={k}
                    onClick={() => setSelectedDay(d)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragSession) setDropConfirm({ sessionId: dragSession, newDate: d });
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl py-2 text-xs transition-all",
                      isSel ? "bg-gradient-primary text-primary-foreground shadow-glow" : isToday ? "bg-secondary" : "hover:bg-secondary/60",
                    )}
                  >
                    <span className="text-[10px] uppercase opacity-70">{format(d, "EEEEE", { locale: pt })}</span>
                    <span className="text-base font-bold">{format(d, "d")}</span>
                    <span className={cn("h-1 w-1 rounded-full", has ? (isSel ? "bg-primary-foreground" : "bg-primary") : "bg-transparent")} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de comando AI fixa logo debaixo do calendário */}
          <div className="mt-2 glass-strong flex items-center gap-2 rounded-full p-1.5 shadow-card">
            <input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") executeAI(); }}
              placeholder="Ex: marca treino com Ana sexta 10h"
              className="flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button onClick={handleMic} className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground" aria-label="Ditar"><Mic className="h-4 w-4" /></button>
            <button onClick={executeAI} className="grid h-9 w-9 place-items-center rounded-full bg-gradient-ai text-accent-foreground shadow-ai" aria-label="Enviar"><Send className="h-4 w-4" /></button>
          </div>
          </div>

          <h3 className="mt-5 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {format(selectedDay, "EEEE, d MMM", { locale: pt })}
          </h3>
          {eventsForDay.length === 0 ? (
            <p className="rounded-2xl bg-secondary/50 p-4 text-center text-sm text-muted-foreground">Sem eventos.</p>
          ) : (
            <ul className="space-y-2">
              {eventsForDay.map((s) => {
                const c = clientById(s.client_id);
                return (
                  <li 
                    key={s.id}
                    draggable
                    onDragStart={() => setDragSession(s.id)}
                    onDragEnd={() => setDragSession(null)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <Link
                      to={c ? `/pt/clients/${c.id}` : "#"}
                      className="glass flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-secondary/50"
                    >
                      <UserAvatar name={c?.full_name} src={c?.avatar_url} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold">{c?.full_name}</p>
                        <p className="text-xs capitalize text-muted-foreground">{s.type} · {format(new Date(s.scheduled_at), "HH:mm")}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

        </section>
      ) : (
        <section className="flex-1 px-5 pt-3">
          <ul className="space-y-2">
            {filtered.map((c) => (
              <li key={c.id} className={cn("relative glass rounded-2xl p-3", c.status === "atencao" && "border-l-2 border-l-destructive")}>
                <div className="flex items-center gap-3">
                  <Link to={`/pt/clients/${c.id}`} className="flex flex-1 items-center gap-3 min-w-0">
                    <UserAvatar name={c.full_name} src={c.avatar_url} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{c.full_name}</p>
                        {c.status === "atencao" && <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-destructive">Atenção</span>}
                      </div>
                      <p className="text-xs capitalize text-muted-foreground">
                        {c.type} · iniciou {format(new Date(c.start_date), "d MMM yy", { locale: pt })}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-primary" style={{ width: `${c.attendance_pct}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">{c.attendance_pct}%</span>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const token = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, "");
                      const url = `${window.location.origin}/auth?invite=${token}`;
                      navigator.clipboard.writeText(url);
                      toast.success(`Link de ${c.full_name} copiado`, { description: url });
                    }}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
                    aria-label="Copiar link de convite"
                    title="Copiar link de convite"
                  >
                    <Link2 className="h-4 w-4" />
                  </button>
                  <ClientCardMenu
                    clientId={c.id}
                    clientName={c.full_name}
                    onDeleted={(id) => setDeletedIds((prev) => [...prev, id])}
                  />
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="rounded-2xl bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
                Sem clientes nesta categoria.
              </li>
            )}
          </ul>
        </section>
      )}

      {dropConfirm && (
        <Dialog open={!!dropConfirm} onOpenChange={(o) => !o && setDropConfirm(null)}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Remarcar sessão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Vais mover a sessão para <strong>{format(dropConfirm.newDate, "EEEE, d MMM", { locale: pt })}</strong>.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nova hora (opcional)</label>
                <Input 
                  type="time" 
                  value={newTime} 
                  onChange={(e) => setNewTime(e.target.value)} 
                  className="rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">
                  Deixa em branco para manter a hora original ({format(new Date(sessions.find(s => s.id === dropConfirm.sessionId)?.scheduled_at || Date.now()), "HH:mm")}).
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDropConfirm(null)}>Cancelar</Button>
              <Button onClick={confirmMoveSession} className="bg-gradient-primary text-primary-foreground">Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
