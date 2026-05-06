import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Check, Dumbbell, Plus, Minus, Sparkles, Clock } from "lucide-react";
import { mockWorkouts, type MockExercise } from "@/lib/mocks";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/VideoPlayer";
import { cn } from "@/lib/utils";
import { logSet, removeSet } from "@/lib/workoutLog";

const workout = mockWorkouts[0]; // mock: today's workout

interface SetLog {
  done: boolean;
  weight: number;
  reps: number;
  duration: number; // for time-mode
}

// Group consecutive exercises sharing the same `group` letter into superset blocks.
type Block = { group?: string; exercises: MockExercise[] };
function buildBlocks(exs: MockExercise[]): Block[] {
  const blocks: Block[] = [];
  for (const ex of exs) {
    const last = blocks[blocks.length - 1];
    if (ex.group && last && last.group === ex.group) {
      last.exercises.push(ex);
    } else {
      blocks.push({ group: ex.group, exercises: [ex] });
    }
  }
  return blocks;
}

export default function ClientWorkout() {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [logs, setLogs] = useState<Record<string, SetLog[]>>(() => {
    const init: Record<string, SetLog[]> = {};
    workout.exercises.forEach((e) => {
      init[e.id] = Array.from({ length: e.sets }, () => ({
        done: false,
        weight: e.weight_kg ?? 0,
        reps: parseInt(String(e.reps).match(/\d+/)?.[0] ?? "10", 10) || 10,
        duration: e.duration_s ?? 30,
      }));
    });
    return init;
  });
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const blocks = useMemo(() => buildBlocks(workout.exercises), []);
  const totalSets = workout.exercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = useMemo(
    () => Object.values(logs).reduce((s, arr) => s + arr.filter((x) => x.done).length, 0),
    [logs],
  );
  const pct = Math.round((doneSets / totalSets) * 100);

  function toggleSet(ex: MockExercise, idx: number) {
    setLogs((prev) => {
      const next = { ...prev };
      const arr = [...next[ex.id]];
      const current = arr[idx];
      const newDone = !current.done;
      arr[idx] = { ...current, done: newDone };
      next[ex.id] = arr;
      if (newDone) {
        logSet({
          workout_id: workout.id,
          exercise_id: ex.id,
          exercise_name: ex.name,
          set_index: idx,
          weight: current.weight,
          reps: ex.mode === "time" ? current.duration : current.reps,
          completed_at: new Date().toISOString(),
        });
      } else {
        removeSet(workout.id, ex.id, idx);
      }
      return next;
    });
  }

  function adjust(exId: string, idx: number, field: "weight" | "reps" | "duration", delta: number) {
    setLogs((prev) => {
      const next = { ...prev };
      const arr = [...next[exId]];
      const newVal = Math.max(0, +(arr[idx][field] + delta).toFixed(2));
      arr[idx] = { ...arr[idx], [field]: newVal };
      next[exId] = arr;
      return next;
    });
  }

  function setField(exId: string, idx: number, field: "weight" | "reps" | "duration", value: number) {
    setLogs((prev) => {
      const next = { ...prev };
      const arr = [...next[exId]];
      arr[idx] = { ...arr[idx], [field]: Math.max(0, value) };
      next[exId] = arr;
      return next;
    });
  }

  function handleStart() {
    setStarted(true);
    setRunning(true);
  }

  function handleFinish() {
    setRunning(false);
    setFinished(true);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  // ---------- Pre-workout screen ----------
  if (!started) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] flex-col px-5 pb-24 pt-8">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Treino de hoje</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">{workout.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {workout.exercises.length} exercícios · {totalSets} séries · ~45 min
        </p>

        <div className="mt-6 space-y-2">
          {workout.exercises.map((ex) => (
            <div key={ex.id} className="glass flex items-center gap-3 rounded-2xl p-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                {ex.mode === "time" ? <Clock className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold">{ex.name}</p>
                  {ex.group && (
                    <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
                      Super {ex.group}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {ex.mode === "time"
                    ? `${ex.sets} × ${ex.duration_s ?? 30}s`
                    : `${ex.sets} × ${ex.reps}${ex.weight_kg ? ` · ${ex.weight_kg} kg` : ""}`}
                </p>
              </div>
              {ex.video_url && <Play className="h-4 w-4 fill-current text-accent" />}
            </div>
          ))}
        </div>

        <div
          className="fixed left-0 right-0 z-40 mx-auto max-w-md px-5"
          style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          <Button
            onClick={handleStart}
            className="h-14 w-full rounded-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-glow animate-pulse-glow"
          >
            <Play className="mr-2 h-5 w-5 fill-current" />
            Começar treino
          </Button>
        </div>
      </div>
    );
  }

  // ---------- Finished workout screen ----------
  if (finished) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-5 pb-24 pt-8 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-primary text-primary-foreground animate-celebrate shadow-glow">
          <Check className="h-10 w-10" strokeWidth={3} />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight">
          Treino concluído!
        </h1>
        <p className="mt-1 text-sm font-semibold text-primary">{workout.name}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Bom trabalho 💪 {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")} de treino
        </p>

        <div className="mt-8 w-full max-w-xs space-y-3">
          <Button
            onClick={() => { window.location.reload(); }}
            className="h-14 w-full rounded-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-glow"
          >
            <Play className="mr-2 h-5 w-5 fill-current" /> Repetir treino
          </Button>
          <Button
            onClick={() => { setFinished(false); setStarted(false); }}
            variant="outline"
            className="h-12 w-full rounded-full"
          >
            <Sparkles className="mr-2 h-4 w-4" /> Escolher outro treino
          </Button>
          <p className="text-[11px] text-muted-foreground px-2">
            📅 O plano seguinte de acordo com a ordem do teu PT é <span className="font-semibold text-foreground">{mockWorkouts[1]?.name ?? "Treino B"}</span>
          </p>
        </div>
      </div>
    );
  }

  // ---------- Active workout ----------
  return (
    <div className="pb-32">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 px-5 pb-3 pt-6 backdrop-blur-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Em treino</p>
            <h1 className="text-xl font-bold tracking-tight">{workout.name}</h1>
          </div>
          <Button
            size="sm"
            variant={running ? "secondary" : "default"}
            onClick={() => setRunning((r) => !r)}
            className="rounded-full"
          >
            {running ? <Pause className="mr-1 h-3.5 w-3.5" /> : <Play className="mr-1 h-3.5 w-3.5" />}
            {mm}:{ss}
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="text-[11px] font-semibold tabular-nums">{doneSets}/{totalSets}</span>
        </div>
      </header>

      <div className="space-y-5 px-5 pt-5">
        {blocks.map((block, bi) => (
          <BlockCard
            key={bi}
            block={block}
            logs={logs}
            onToggle={toggleSet}
            onAdjust={adjust}
            onSet={setField}
            onPlayVideo={(u) => setVideoUrl(u)}
          />
        ))}
      </div>

      <div
        className="fixed left-0 right-0 z-40 mx-auto max-w-md px-5"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        <Button
          onClick={handleFinish}
          className="h-12 w-full rounded-full bg-gradient-primary text-primary-foreground shadow-glow"
          disabled={doneSets === 0}
        >
          {doneSets === totalSets ? "Terminar treino 🎉" : `Terminar (${doneSets}/${totalSets})`}
        </Button>
      </div>

      <Dialog open={!!videoUrl} onOpenChange={(o) => !o && setVideoUrl(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Demonstração</DialogTitle>
          </DialogHeader>
          {videoUrl && <VideoPlayer src={videoUrl} />}
        </DialogContent>
      </Dialog>

      {/* Finished state is handled as early return above */}
    </div>
  );
}

function BlockCard({
  block,
  logs,
  onToggle,
  onAdjust,
  onSet,
  onPlayVideo,
}: {
  block: Block;
  logs: Record<string, SetLog[]>;
  onToggle: (ex: MockExercise, idx: number) => void;
  onAdjust: (exId: string, idx: number, field: "weight" | "reps" | "duration", delta: number) => void;
  onSet: (exId: string, idx: number, field: "weight" | "reps" | "duration", value: number) => void;
  onPlayVideo: (url: string) => void;
}) {
  const isSuperset = block.exercises.length > 1 && !!block.group;
  const maxSets = Math.max(...block.exercises.map((e) => e.sets));
  const rows: { ex: MockExercise; setIdx: number }[] = [];
  for (let s = 0; s < maxSets; s++) {
    for (const ex of block.exercises) {
      if (s < ex.sets) rows.push({ ex, setIdx: s });
    }
  }

  return (
    <div className={cn("glass rounded-2xl p-4", isSuperset && "border border-accent/40")}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {isSuperset && (
            <span className="mb-1.5 inline-block rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-foreground">
              Superset {block.group}
            </span>
          )}
          <div className="space-y-0.5">
            {block.exercises.map((ex) => (
              <div key={ex.id} className="flex items-center gap-2">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  {ex.mode === "time" ? <Clock className="h-3.5 w-3.5" /> : <Dumbbell className="h-3.5 w-3.5" />}
                </div>
                <p className="truncate text-sm font-bold">{ex.name}</p>
                {ex.video_url && (
                  <button
                    onClick={() => onPlayVideo(ex.video_url!)}
                    className="grid h-8 w-8 place-items-center rounded-md bg-accent/15 text-accent"
                    aria-label="Ver vídeo"
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {rows.map(({ ex, setIdx }) => {
          const log = logs[ex.id][setIdx];
          const isTime = ex.mode === "time";
          return (
            <div
              key={`${ex.id}-${setIdx}`}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-2.5 transition-all",
                log.done ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/30",
              )}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-bold tabular-nums">
                {setIdx + 1}
              </span>
              {isSuperset && (
                <span className="w-12 shrink-0 truncate text-[10px] font-semibold uppercase text-muted-foreground">
                  {ex.name.split(" ")[0]}
                </span>
              )}
              {isTime ? (
                <Adjuster
                  label="seg"
                  value={log.duration}
                  step={5}
                  onMinus={() => onAdjust(ex.id, setIdx, "duration", -5)}
                  onPlus={() => onAdjust(ex.id, setIdx, "duration", 5)}
                  onChange={(v) => onSet(ex.id, setIdx, "duration", v)}
                />
              ) : (
                <>
                  <Adjuster
                    label="kg"
                    value={log.weight}
                    step={1.25}
                    onMinus={() => onAdjust(ex.id, setIdx, "weight", -1.25)}
                    onPlus={() => onAdjust(ex.id, setIdx, "weight", 1.25)}
                    onChange={(v) => onSet(ex.id, setIdx, "weight", v)}
                  />
                  <Adjuster
                    label="reps"
                    value={log.reps}
                    step={1}
                    onMinus={() => onAdjust(ex.id, setIdx, "reps", -1)}
                    onPlus={() => onAdjust(ex.id, setIdx, "reps", 1)}
                    onChange={(v) => onSet(ex.id, setIdx, "reps", v)}
                  />
                </>
              )}
              <button
                onClick={() => onToggle(ex, setIdx)}
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all",
                  log.done ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground",
                )}
                aria-label="Marcar série"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Adjuster({
  label,
  value,
  step,
  onMinus,
  onPlus,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onMinus: () => void;
  onPlus: () => void;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  function commit() {
    const n = parseFloat(draft.replace(",", "."));
    if (!isNaN(n) && n >= 0) onChange(+n.toFixed(2));
    setEditing(false);
  }

  return (
    <div className="flex flex-1 items-center justify-between rounded-lg bg-background/50 px-1.5 py-1">
      <button
        onClick={(e) => { e.stopPropagation(); onMinus(); }}
        className="grid h-6 w-6 place-items-center rounded-full hover:bg-secondary"
        aria-label={`Diminuir ${label}`}
      >
        <Minus className="h-3 w-3" />
      </button>
      <div className="min-w-0 flex-1 text-center">
        {editing ? (
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            step={step}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setEditing(false); setDraft(String(value)); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-center text-sm font-bold outline-none tabular-nums"
          />
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDraft(String(value)); setEditing(true); }}
            className="block w-full text-center"
          >
            <p className="text-sm font-bold leading-none tabular-nums">{value}</p>
            <p className="text-[9px] uppercase text-muted-foreground">{label}</p>
          </button>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onPlus(); }}
        className="grid h-6 w-6 place-items-center rounded-full hover:bg-secondary"
        aria-label={`Aumentar ${label}`}
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

function FinishOverlay({ seconds, doneSets, totalSets, onClose }: { seconds: number; doneSets: number; totalSets: number; onClose: () => void }) {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  const pieces = useRef(
    Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2;
      const dist = 80 + Math.random() * 60;
      return {
        tx: `${Math.cos(angle) * dist}px`,
        ty: `${Math.sin(angle) * dist}px`,
        delay: `${Math.random() * 0.15}s`,
        color: ["bg-primary", "bg-accent", "bg-energy"][i % 3],
      };
    }),
  ).current;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="relative mx-5 w-full max-w-sm rounded-3xl border border-primary/30 bg-card p-8 text-center animate-scale-in shadow-glow">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0">
          {pieces.map((p, i) => (
            <span
              key={i}
              className={cn("absolute h-2 w-2 rounded-full opacity-0", p.color)}
              style={{
                ["--tx" as never]: p.tx,
                ["--ty" as never]: p.ty,
                animation: `confetti-burst 0.9s ease-out ${p.delay} forwards`,
              }}
            />
          ))}
        </div>

        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-primary text-primary-foreground animate-celebrate">
          <Check className="h-10 w-10" strokeWidth={3} />
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight">Treino concluído!</h2>
        <p className="mt-1 text-sm text-muted-foreground">Bom trabalho 💪</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Tempo" value={`${mm}:${String(ss).padStart(2, "0")}`} />
          <Stat label="Séries" value={`${doneSets}/${totalSets}`} />
          <Stat label="Streak" value="+1" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button
            onClick={() => { window.location.reload(); }}
            variant="outline"
            className="h-12 rounded-full"
          >
            Repetir
          </Button>
          <Button
            onClick={onClose}
            className="h-12 rounded-full bg-gradient-primary text-primary-foreground shadow-glow"
          >
            <Sparkles className="mr-1 h-4 w-4" /> Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-2.5">
      <p className="text-base font-bold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
    </div>
  );
}
