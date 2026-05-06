import { useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, GripVertical, Plus, Sparkles, Trash2, Link2, Unlink, Video, Upload, Check, X, BookMarked, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { mockWorkouts, clientById, type MockExercise } from "@/lib/mocks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const YT_LIBRARY_KEY = "hercles.pt.ytLibrary";
type YTLink = { id: string; name: string; url: string };

function loadYTLibrary(): YTLink[] {
  try { return JSON.parse(localStorage.getItem(YT_LIBRARY_KEY) ?? "[]"); } catch { return []; }
}
function saveYTLibrary(links: YTLink[]) {
  localStorage.setItem(YT_LIBRARY_KEY, JSON.stringify(links));
}

export default function PTWorkoutBuilder() {
  const { clientId, workoutId } = useParams();
  const navigate = useNavigate();
  const client = clientId ? clientById(clientId) : undefined;
  const initial = mockWorkouts.find((w) => w.id === workoutId)?.exercises ?? [];
  const [name, setName] = useState(mockWorkouts.find((w) => w.id === workoutId)?.name ?? "Novo treino");
  const [exercises, setExercises] = useState<MockExercise[]>(initial);
  const [days, setDays] = useState<string[]>(() => {
    const d = mockWorkouts.find((w) => w.id === workoutId)?.day;
    return d ? [d] : [];
  });
  const [editing, setEditing] = useState<MockExercise | null>(null);
  const [creating, setCreating] = useState(false);

  // drag state
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDragStart(i: number) {
    dragIndex.current = i;
  }
  function handleDragOver(i: number, e: React.DragEvent) {
    e.preventDefault();
    setOverIndex(i);
  }
  function handleDrop(i: number) {
    const from = dragIndex.current;
    setOverIndex(null);
    dragIndex.current = null;
    if (from == null || from === i) return;
    setExercises((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return next;
    });
  }

  function remove(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  function toggleSupersetWithNext(i: number) {
    setExercises((prev) => {
      if (i >= prev.length - 1) return prev;
      const a = prev[i];
      const b = prev[i + 1];
      const next = [...prev];
      if (a.group && a.group === b.group) {
        // ungroup both
        next[i] = { ...a, group: undefined };
        next[i + 1] = { ...b, group: undefined };
      } else {
        // assign next available group letter
        const used = new Set(prev.map((x) => x.group).filter(Boolean) as string[]);
        let letter = "A";
        while (used.has(letter)) letter = String.fromCharCode(letter.charCodeAt(0) + 1);
        next[i] = { ...a, group: letter };
        next[i + 1] = { ...b, group: letter };
      }
      return next;
    });
  }

  function saveExercise(ex: MockExercise) {
    setExercises((prev) => {
      const exists = prev.find((e) => e.id === ex.id);
      return exists ? prev.map((e) => (e.id === ex.id ? ex : e)) : [...prev, ex];
    });
    setEditing(null);
    setCreating(false);
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="bg-background px-5 pb-3 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <Link to={`/pt/clients/${clientId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {client?.full_name ?? "Cliente"}
          </Link>
          <span className="ai-border relative inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold gradient-text-ai">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> AI
          </span>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none"
        />
        <p className="mt-0.5 text-xs text-muted-foreground">{exercises.length} exercícios · arrasta para reordenar</p>
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dias da semana</p>
          <div className="flex flex-wrap gap-1.5">
            {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d) => {
              const active = days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays((prev) => active ? prev.filter(x => x !== d) : [...prev, d])}
                  className={cn(
                    "h-8 min-w-10 rounded-full px-3 text-xs font-bold transition-all",
                    active ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <section className="px-5 pt-3">
        <div className="space-y-2">
          {exercises.map((ex, i) => {
            const nextSameGroup = exercises[i + 1] && exercises[i + 1].group === ex.group && !!ex.group;
            return (
              <div
                key={ex.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(i, e)}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { dragIndex.current = null; setOverIndex(null); }}
                className={cn(
                  "glass relative flex items-center gap-2 rounded-2xl p-3 transition-all",
                  overIndex === i && "ring-2 ring-primary",
                  ex.group && "border border-accent/40",
                )}
              >
                <button
                  className="cursor-grab touch-none active:cursor-grabbing"
                  aria-label="Arrastar"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </button>
                {ex.group && (
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-accent/15 text-[10px] font-bold text-accent">
                    {ex.group}
                  </span>
                )}
                <button onClick={() => setEditing(ex)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.mode === "time"
                      ? `${ex.sets} × ${ex.duration_s ?? 30}s`
                      : `${ex.sets} × ${ex.reps}${ex.weight_kg ? ` · ${ex.weight_kg}kg` : ""}`}
                    {" · "}{ex.rest_s}s desc.
                    {ex.video_url && " · vídeo"}
                  </p>
                </button>
                {ex.video_url && (
                  <Video className="h-4 w-4 text-accent" aria-label="Tem vídeo" />
                )}
                <button
                  onClick={() => remove(ex.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive"
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                {/* superset toggle button connecting this and next */}
                {i < exercises.length - 1 && (
                  <button
                    onClick={() => toggleSupersetWithNext(i)}
                    className={cn(
                      "absolute -bottom-3 left-1/2 z-10 -translate-x-1/2 grid h-6 w-6 place-items-center rounded-full border bg-background text-[10px] font-bold transition-all",
                      nextSameGroup
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                    )}
                    aria-label={nextSameGroup ? "Desagrupar superset" : "Agrupar como superset"}
                    title={nextSameGroup ? "Desagrupar" : "Superset"}
                  >
                    {nextSameGroup ? <Unlink className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setCreating(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" /> Adicionar exercício
        </button>

        <Button
          onClick={() => { toast.success("Treino guardado (demo)."); navigate(`/pt/clients/${clientId}`); }}
          className="mt-6 w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
        >
          Concluir
        </Button>
      </section>

      <ExerciseDialog
        key={editing?.id ?? (creating ? "new" : "closed")}
        open={creating || !!editing}
        initial={editing}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSave={saveExercise}
      />
    </div>
  );
}

function ExerciseDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: MockExercise | null;
  onClose: () => void;
  onSave: (ex: MockExercise) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [mode, setMode] = useState<"reps" | "time">(initial?.mode ?? "reps");
  const [sets, setSets] = useState(initial?.sets ?? 3);
  const [reps, setReps] = useState(initial?.reps ?? "10");
  const [weight, setWeight] = useState<string>(initial?.weight_kg != null ? String(initial.weight_kg) : "");
  const [duration, setDuration] = useState(initial?.duration_s ?? 30);
  const [rest, setRest] = useState(initial?.rest_s ?? 60);
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? "");
  const [showLibrary, setShowLibrary] = useState(false);
  const [ytLibrary, setYtLibrary] = useState<YTLink[]>(loadYTLibrary);
  const [newLinkName, setNewLinkName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    toast.success("Vídeo carregado.");
  }

  function saveToLibrary() {
    if (!videoUrl.trim()) { toast.error("Cola primeiro um link."); return; }
    const label = newLinkName.trim() || videoUrl.trim().slice(0, 40);
    const updated = [...ytLibrary, { id: `yt-${Date.now()}`, name: label, url: videoUrl.trim() }];
    setYtLibrary(updated);
    saveYTLibrary(updated);
    setNewLinkName("");
    toast.success("Link guardado na biblioteca!");
  }

  function removeFromLibrary(id: string) {
    const updated = ytLibrary.filter((l) => l.id !== id);
    setYtLibrary(updated);
    saveYTLibrary(updated);
  }

  function submit() {
    if (!name.trim()) {
      toast.error("Dá um nome ao exercício.");
      return;
    }
    onSave({
      id: initial?.id ?? `ex-${Date.now()}`,
      name: name.trim(),
      sets,
      reps: mode === "time" ? "—" : reps,
      weight_kg: mode === "time" || weight === "" ? null : Number(weight),
      rest_s: rest,
      group: initial?.group,
      video_url: videoUrl || undefined,
      mode,
      duration_s: mode === "time" ? duration : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar exercício" : "Novo exercício"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome do exercício</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Agachamento búlgaro"
              autoFocus
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["reps", "time"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-xl border-2 p-2.5 text-sm font-semibold transition-all",
                    mode === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/40 text-muted-foreground",
                  )}
                >
                  {m === "reps" ? "Repetições" : "Tempo (isométrico)"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Séries</Label>
              <Input type="number" min={1} value={sets} onChange={(e) => setSets(Math.max(1, Number(e.target.value) || 1))} className="h-11 rounded-xl" />
            </div>
            {mode === "reps" ? (
              <div className="space-y-1.5">
                <Label className="text-xs">Reps</Label>
                <Input value={reps} onChange={(e) => setReps(e.target.value)} placeholder="10 ou 8-10" className="h-11 rounded-xl" />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs">Duração (s)</Label>
                <Input type="number" min={5} value={duration} onChange={(e) => setDuration(Math.max(5, Number(e.target.value) || 30))} className="h-11 rounded-xl" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {mode === "reps" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Peso (kg)</Label>
                <Input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="opcional" className="h-11 rounded-xl" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Descanso (s)</Label>
              <Input type="number" min={0} value={rest} onChange={(e) => setRest(Math.max(0, Number(e.target.value) || 0))} className="h-11 rounded-xl" />
            </div>
          </div>

          {/* Video section with library */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Vídeo demonstrativo</Label>
              <button
                type="button"
                onClick={() => setShowLibrary((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80"
              >
                <BookMarked className="h-3 w-3" />
                Biblioteca ({ytLibrary.length})
              </button>
            </div>

            {showLibrary && ytLibrary.length > 0 && (
              <div className="space-y-1 rounded-xl border border-border bg-secondary/20 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Links guardados</p>
                {ytLibrary.map((link) => (
                  <div key={link.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setVideoUrl(link.url); setShowLibrary(false); }}
                      className="flex flex-1 items-center gap-2 rounded-lg bg-background/50 px-2 py-1.5 text-left hover:bg-background/80"
                    >
                      <Youtube className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span className="truncate text-xs">{link.name}</span>
                    </button>
                    <button type="button" onClick={() => removeFromLibrary(link.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Cola um link (YouTube, mp4...)"
                className="h-11 flex-1 rounded-xl"
              />
              <input ref={fileRef} type="file" accept="video/*" onChange={handleFile} className="hidden" />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                className="h-11 rounded-xl"
              >
                <Upload className="mr-1.5 h-4 w-4" /> Upload
              </Button>
            </div>
            {videoUrl && (
              <div className="flex items-center gap-2">
                <p className="flex flex-1 items-center gap-1 text-[11px] text-accent">
                  <Video className="h-3 w-3" /> Vídeo associado
                  <button onClick={() => setVideoUrl("")} className="ml-1 text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </p>
                <div className="flex items-center gap-1">
                  <Input
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    placeholder="Nome (opcional)"
                    className="h-7 w-28 rounded-lg text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={saveToLibrary}
                    className="flex items-center gap-1 rounded-lg bg-accent/15 px-2 py-1 text-[10px] font-semibold text-accent hover:bg-accent/25"
                  >
                    <BookMarked className="h-3 w-3" /> Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            <Check className="mr-1.5 h-4 w-4" /> Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
