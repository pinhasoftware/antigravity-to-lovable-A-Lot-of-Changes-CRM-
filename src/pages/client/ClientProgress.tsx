import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Trophy, Flame, Dumbbell, Camera, Plus, Trash2, ImageIcon } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { mockClientStats } from "@/lib/mocks";
import { uploadProgressPhoto } from "@/lib/uploads";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

interface ProgressPhoto { id: string; url: string; date: string; note?: string; }
const PHOTOS_KEY = "fitpilot.client.progressPhotos";

export default function ClientProgress() {
  const [weightHistory, setWeightHistory] = useState(() => {
    try {
      const stored = localStorage.getItem("fitpilot.client.weightHistory");
      return stored ? JSON.parse(stored) : mockClientStats.weight_history;
    } catch { return mockClientStats.weight_history; }
  });
  const [targetWeight, setTargetWeight] = useState(() => {
    try {
      return parseFloat(localStorage.getItem("fitpilot.client.targetWeight") || "0") || 0;
    } catch { return 0; }
  });

  const w = weightHistory;
  const v = mockClientStats.volume_history;
  const weightDelta = +(w[w.length - 1].kg - w[0].kg).toFixed(1);
  const volumeDelta = +(v[v.length - 1].tons - v[0].tons).toFixed(1);

  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newWeightDate, setNewWeightDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [tempTarget, setTempTarget] = useState(targetWeight.toString());

  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<ProgressPhoto | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { setPhotos(JSON.parse(localStorage.getItem(PHOTOS_KEY) ?? "[]")); } catch { /* */ }
  }, []);

  function persist(next: ProgressPhoto[]) {
    setPhotos(next);
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(next));
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadProgressPhoto(file);
      const p: ProgressPhoto = {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        url: result.url,
        date,
        note: note.trim() || undefined,
      };
      persist([p, ...photos]);
      setNote("");
      toast.success("Foto adicionada");
    } catch {
      toast.error("Falha no upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function remove(id: string) {
    persist(photos.filter((p) => p.id !== id));
  }

  function handleAddWeight() {
    const kg = parseFloat(newWeight);
    if (!kg) return;
    const dateObj = new Date(newWeightDate);
    const weekLabel = `S${format(dateObj, "w")}`;
    const next = [...weightHistory, { week: weekLabel, kg }].sort((a, b) => a.week.localeCompare(b.week));
    setWeightHistory(next);
    localStorage.setItem("fitpilot.client.weightHistory", JSON.stringify(next));
    setWeightDialogOpen(false);
    setNewWeight("");
    toast.success("Peso registado");
  }

  function handleSetTarget() {
    const kg = parseFloat(tempTarget);
    setTargetWeight(kg);
    localStorage.setItem("fitpilot.client.targetWeight", kg.toString());
    setTargetDialogOpen(false);
    toast.success("Objetivo atualizado");
  }

  return (
    <div className="px-5 pb-6 pt-6">
      <h1 className="text-2xl font-bold tracking-tight">Progresso</h1>
      <p className="mt-1 text-sm text-muted-foreground">Últimas 6 semanas</p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat icon={Flame} label="Streak" value={`${mockClientStats.streak_days}d`} tone="energy" />
        <Stat icon={Trophy} label="PRs" value="4" tone="primary" />
        <Stat icon={Dumbbell} label="Treinos" value="22" tone="muted" />
      </div>

      <section className="mt-6">
        <ChartCard
          title="Peso corporal"
          delta={weightDelta}
          deltaLabel="kg"
          positive={weightDelta < 0}
          current={`${w[w.length - 1].kg} kg`}
          onEdit={() => setWeightDialogOpen(true)}
          onTarget={() => setTargetDialogOpen(true)}
          target={targetWeight > 0 ? `${targetWeight} kg` : undefined}
        >
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={w} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <YAxis domain={["dataMin - 2", "dataMax + 2"]} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [`${v} kg`, "Peso"]}
              />
              <Area type="monotone" dataKey="kg" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#g1)" dot={{ fill: "hsl(var(--primary))", r: 3 }} />
              {targetWeight > 0 && (
                <Line
                  type="monotone"
                  data={w.map(item => ({ ...item, target: targetWeight }))}
                  dataKey="target"
                  stroke="hsl(var(--energy))"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* WEIGHT DIALOGS */}
      <Dialog open={weightDialogOpen} onOpenChange={setWeightDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Registar Peso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">DATA</label>
              <Input type="date" value={newWeightDate} onChange={(e) => setNewWeightDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">PESO (KG)</label>
              <Input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="0.0" />
            </div>
            <Button onClick={handleAddWeight} className="w-full bg-gradient-primary">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Objetivo de Peso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">META (KG)</label>
              <Input type="number" step="0.1" value={tempTarget} onChange={(e) => setTempTarget(e.target.value)} placeholder="0.0" />
            </div>
            <Button onClick={handleSetTarget} className="w-full bg-energy text-white">Definir Objetivo</Button>
          </div>
        </DialogContent>
      </Dialog>

      <section className="mt-4">
        <ChartCard
          title="Volume de treino"
          delta={volumeDelta}
          deltaLabel="t"
          positive={volumeDelta > 0}
          current={`${v[v.length - 1].tons} t`}
        >
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={v} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [`${v} t`, "Volume"]}
              />
              <Line type="monotone" dataKey="tons" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ fill: "hsl(var(--accent))", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* PHOTOS / TIMELINE */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fotos de evolução</h2>
          <span className="text-[10px] text-muted-foreground">{photos.length} foto{photos.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="glass space-y-2 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 text-xs"
            />
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota (ex: pós-treino)"
              maxLength={60}
              className="h-10 text-xs"
            />
          </div>
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="h-11 w-full rounded-xl bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
          >
            {uploading ? (
              <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> A enviar...</>
            ) : (
              <><Camera className="mr-2 h-4 w-4" /> Adicionar foto</>
            )}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
        </div>

        {photos.length === 0 ? (
          <div className="mt-3 grid place-items-center rounded-2xl border-2 border-dashed border-border py-10 text-center">
            <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Sem fotos ainda. Adiciona a primeira para começares a tua timeline.</p>
          </div>
        ) : (
          <>
            {/* 3 fotos mais recentes — sempre visíveis */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {photos.slice(0, 3).map((p) => (
                <PhotoTile key={p.id} p={p} onOpen={() => setPreview(p)} onRemove={() => remove(p.id)} />
              ))}
            </div>

            {photos.length > 3 && (
              <>
                <button
                  onClick={() => setShowAllPhotos((v) => !v)}
                  className="mx-auto mt-2 block rounded-full bg-secondary/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-secondary"
                  aria-expanded={showAllPhotos}
                >
                  {showAllPhotos ? "Ocultar" : `Ver tudo (${photos.length - 3} mais antigas)`}
                </button>

                {showAllPhotos && (
                  <div className="mt-2 grid grid-cols-3 gap-2 rounded-2xl bg-secondary/20 p-2 animate-fade-in">
                    {photos.slice(3).map((p) => (
                      <PhotoTile key={p.id} p={p} onOpen={() => setPreview(p)} onRemove={() => remove(p.id)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{preview && format(new Date(preview.date), "EEEE, d MMM yyyy", { locale: pt })}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-2">
              <img src={preview.url} alt="" className="w-full rounded-xl" />
              {preview.note && <p className="text-sm text-muted-foreground">{preview.note}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <h2 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Recordes pessoais</h2>
      <div className="space-y-2">
        {[
          { ex: "Agachamento", kg: 80, prev: 75 },
          { ex: "Supino plano", kg: 55, prev: 50 },
          { ex: "Peso morto", kg: 100, prev: 95 },
        ].map((pr) => (
          <div key={pr.ex} className="glass flex items-center justify-between rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-energy/15 text-energy">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold">{pr.ex}</p>
                <p className="text-[11px] text-muted-foreground">Anterior: {pr.prev} kg</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-bold">{pr.kg} kg</p>
              <p className="text-[10px] font-bold text-primary">+{pr.kg - pr.prev} kg</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoTile({ p, onOpen, onRemove }: { p: ProgressPhoto; onOpen: () => void; onRemove: () => void }) {
  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary">
      <button onClick={onOpen} className="absolute inset-0">
        <img src={p.url} alt={p.note ?? p.date} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
      </button>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
        <p className="text-[10px] font-bold text-white">{format(new Date(p.date), "d MMM", { locale: pt })}</p>
        {p.note && <p className="truncate text-[9px] text-white/80">{p.note}</p>}
      </div>
      <button
        onClick={onRemove}
        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
        aria-label="Remover foto"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: "primary" | "energy" | "muted" }) {
  const cls =
    tone === "primary" ? "bg-primary/15 text-primary" :
    tone === "energy" ? "bg-energy/15 text-energy" :
    "bg-secondary text-muted-foreground";
  return (
    <div className="glass rounded-2xl p-3">
      <div className={`mb-1.5 grid h-7 w-7 place-items-center rounded-lg ${cls}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase text-muted-foreground">{label}</p>
    </div>
  );
}

function ChartCard({
  title, delta, deltaLabel, positive, current, children, onEdit, onTarget, target,
}: {
  title: string; delta: number; deltaLabel: string; positive: boolean; current: string; children: React.ReactNode; 
  onEdit?: () => void; onTarget?: () => void; target?: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold">{current}</p>
            {target && (
              <p className="text-[10px] font-bold text-energy uppercase">Meta: {target}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${positive ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta > 0 ? "+" : ""}{delta} {deltaLabel}
          </div>
          <div className="flex gap-1">
            {onTarget && (
              <button onClick={onTarget} className="text-[9px] font-bold text-muted-foreground hover:text-energy underline underline-offset-2">Objetivo</button>
            )}
            {onEdit && (
              <button onClick={onEdit} className="text-[9px] font-bold text-muted-foreground hover:text-primary underline underline-offset-2 ml-2">Editar</button>
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
