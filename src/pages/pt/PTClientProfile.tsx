import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Plus, Edit2, PlayCircle, Dumbbell, Apple, History, ClipboardList, ChevronDown, Calendar, Camera, Paperclip, FileText, Trash2, TrendingUp, BookMarked, Copy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePTUI } from "@/contexts/PTUIContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SaveButton } from "@/components/SaveButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { fmtEUR } from "@/lib/format";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { clientById, mockWorkouts, mockSessions } from "@/lib/mocks";
import { MealsEditor } from "@/components/pt/MealsEditor";
import { uploadAvatar, uploadNutritionFile } from "@/lib/uploads";
import { getAllLogs } from "@/lib/workoutLog";
import { toast } from "sonner";

interface NutritionFile { id: string; name: string; url: string; uploaded_at: string; }

type Tab = "plano" | "nutricao" | "historico" | "ficha";

export default function PTClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("plano");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [logsOpen, setLogsOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const { setLastClientId } = usePTUI();
  const client = id ? clientById(id) : undefined;
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const nutriFileRef = useRef<HTMLInputElement>(null);

  const AVATAR_KEY = `fitpilot.client.avatar.${id ?? ""}`;
  const NUTRI_KEY = `fitpilot.client.nutritionFiles.${id ?? ""}`;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nutriFiles, setNutriFiles] = useState<NutritionFile[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingNutri, setUploadingNutri] = useState(false);

  useEffect(() => {
    if (!id) return;
    setAvatarUrl(localStorage.getItem(AVATAR_KEY));
    try {
      setNutriFiles(JSON.parse(localStorage.getItem(NUTRI_KEY) ?? "[]"));
    } catch { setNutriFiles([]); }
  }, [id, AVATAR_KEY, NUTRI_KEY]);

  useEffect(() => {
    if (client) setLastClientId(client.id);
  }, [client, setLastClientId]);

  // Real performed sets by the client (saved by ClientWorkout)
  const performedLogs = useMemo(() => {
    const all = getAllLogs();
    // Filter by workouts that belong to this client
    const wIds = new Set(mockWorkouts.filter((w) => w.client_id === id).map((w) => w.id));
    return all
      .filter((l) => wIds.has(l.workout_id))
      .sort((a, b) => +new Date(b.completed_at) - +new Date(a.completed_at));
  }, [id]);

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingAvatar(true);
    try {
      const result = await uploadAvatar(file, id);
      setAvatarUrl(result.url);
      localStorage.setItem(AVATAR_KEY, result.url);
      toast.success("Foto atualizada");
    } catch {
      toast.error("Falha no upload");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function onPickNutritionFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingNutri(true);
    try {
      const result = await uploadNutritionFile(file, id);
      const next = [...nutriFiles, {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        name: file.name,
        url: result.url,
        uploaded_at: new Date().toISOString(),
      }];
      setNutriFiles(next);
      localStorage.setItem(NUTRI_KEY, JSON.stringify(next));
      toast.success("Ficheiro anexado");
    } catch {
      toast.error("Falha no upload");
    } finally {
      setUploadingNutri(false);
      if (nutriFileRef.current) nutriFileRef.current.value = "";
    }
  }

  function removeNutriFile(fid: string) {
    const next = nutriFiles.filter((f) => f.id !== fid);
    setNutriFiles(next);
    localStorage.setItem(NUTRI_KEY, JSON.stringify(next));
  }

  if (!client) {
    return (
      <div className="px-5 pt-6">
        <Link to="/pt/clients" className="text-sm text-muted-foreground">← Voltar</Link>
        <p className="mt-4 text-sm">Cliente não encontrado.</p>
      </div>
    );
  }

  const workouts = mockWorkouts.filter((w) => w.client_id === client.id);
  const now = new Date();
  const history = mockSessions
    .filter((s) => s.client_id === client.id && new Date(s.scheduled_at) < now)
    .sort((a, b) => +new Date(b.scheduled_at) - +new Date(a.scheduled_at));
  const upcoming = mockSessions
    .filter((s) => s.client_id === client.id && new Date(s.scheduled_at) >= now)
    .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at));

  return (
    <div className="pb-24">
      <header className="px-5 pb-4 pt-6">
        <Link to="/pt/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Clientes
        </Link>
        <div className="flex items-start gap-4">
          <div className="relative">
            <UserAvatar name={client.full_name} src={avatarUrl ?? client.avatar_url} size="xl" />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow ring-2 ring-background transition-transform hover:scale-110 disabled:opacity-50"
              aria-label="Trocar foto"
            >
              {uploadingAvatar ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <Plus className="h-4 w-4" />}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight">{client.full_name}</h1>
            <p className="mt-0.5 text-xs capitalize text-muted-foreground">
              {client.type} · {fmtEUR(client.type === "presencial" ? client.session_value ?? 0 : client.monthly_value ?? 0)}
              {client.type === "presencial" ? "/sessão" : "/mês"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">desde {format(new Date(client.start_date), "d MMM yyyy", { locale: pt })}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                client.status === "atencao" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary")}>
                {client.status}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{client.attendance_pct}% assid.</span>
            </div>
          </div>
        </div>

        <div className="ai-border relative mt-4 rounded-2xl bg-accent/5 p-3.5">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-bold gradient-text-ai">Hercles AI · Insight</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {client.status === "atencao"
              ? "Assiduidade abaixo de 50%. Sugiro enviares uma mensagem motivacional ou marcar sessão de check-in."
              : `${workouts.length} treino${workouts.length !== 1 ? "s" : ""} no plano. Considera variar nos próximos 14 dias.`}
          </p>
        </div>
      </header>

      <div className="sticky top-0 z-20 mb-4 bg-background/95 px-5 py-2 backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-secondary p-1">
          {([
            ["plano", Dumbbell, "Plano"],
            ["nutricao", Apple, "Nutrição"],
            ["historico", History, "Histórico"],
            ["ficha", ClipboardList, "Ficha"],
          ] as const).map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-semibold transition-all",
                tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="px-5">
        {tab === "plano" && (
          <div className="space-y-3">
            {workouts.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center">
                <Dumbbell className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Ainda sem treinos no plano.</p>
              </div>
            ) : (
              workouts.map((w) => (
                <div key={w.id} className="glass flex items-center justify-between rounded-2xl p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{w.name}</p>
                    <p className="text-xs text-muted-foreground">{w.day} · {w.exercises.length} exercícios</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link to={`/pt/clients/${client.id}/workouts/${w.id}`} className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"><Edit2 className="h-4 w-4" /></Link>
                    <button className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"><PlayCircle className="h-4 w-4" /></button>
                  </div>
                </div>
              ))
            )}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => navigate(`/pt/clients/${client.id}/workouts/new`)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" /> Novo treino
              </button>
              <button
                onClick={() => setLibraryOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-4 text-sm font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/5"
              >
                <BookMarked className="h-4 w-4" /> Biblioteca
              </button>
            </div>

            {/* Pesos/reps reais que o aluno colocou */}
            <Collapsible open={logsOpen} onOpenChange={setLogsOpen} className="glass rounded-2xl">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-energy" />
                  <span className="text-sm font-bold">Registos do aluno</span>
                  <span className="rounded-full bg-energy/15 px-2 py-0.5 text-[10px] font-bold text-energy">{performedLogs.length}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", logsOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1.5 px-3 pb-3">
                  {performedLogs.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-muted-foreground">Ainda sem registos. Vais ver aqui o peso e reps que o aluno colocou em cada série.</p>
                  ) : (
                    performedLogs.slice(0, 30).map((l, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-secondary/40 p-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{l.exercise_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Série {l.set_index + 1} · {format(new Date(l.completed_at), "d MMM HH:mm", { locale: pt })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold tabular-nums">{l.weight}<span className="text-[10px] font-normal text-muted-foreground"> kg</span></p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">{l.reps} reps</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {tab === "nutricao" && (
          <div className="space-y-3">
            <div className="glass rounded-2xl p-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-primary">Plano nutricional</Label>
              <Textarea
                defaultValue="2200 kcal · 160P / 220C / 65G. 4 refeições, beber 2L água/dia."
                placeholder="Ex: 2200 kcal, 160P/220C/65G..."
                className="mt-2 min-h-[100px]"
              />
              <SaveButton className="mt-3 w-full" toastText="Plano nutricional atualizado">Atualizar plano</SaveButton>
            </div>

            {/* Anexar ficheiro */}
            <div className="glass rounded-2xl p-4">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary">Ficheiros anexos</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => nutriFileRef.current?.click()}
                  disabled={uploadingNutri}
                  className="h-8 rounded-full"
                >
                  {uploadingNutri ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Paperclip className="mr-1 h-3.5 w-3.5" />}
                  {uploadingNutri ? "A enviar..." : "Anexar"}
                </Button>
                <input ref={nutriFileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" className="hidden" onChange={onPickNutritionFile} />
              </div>
              {nutriFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem ficheiros. Anexa um PDF, imagem ou planeamento.</p>
              ) : (
                <ul className="space-y-1.5">
                  {nutriFiles.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 rounded-xl bg-secondary/40 p-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <a href={f.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs font-semibold hover:underline">{f.name}</a>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(f.uploaded_at), "d MMM", { locale: pt })}</span>
                      <button onClick={() => removeNutriFile(f.id)} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remover">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-primary">Refeições</Label>
              <MealsEditor clientId={client.id} />
            </div>
            <div className="glass rounded-2xl p-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-primary">Dicas e recomendações</Label>
              <Textarea defaultValue="Beber 2L de água. Evitar açúcar refinado." className="mt-2 min-h-[80px]" />
              <SaveButton className="mt-3 w-full" toastText="Dicas guardadas">Guardar dicas</SaveButton>
            </div>
          </div>
        )}

        {tab === "historico" && (
          <div className="space-y-3">
            <Collapsible open={upcomingOpen} onOpenChange={setUpcomingOpen} className="glass rounded-2xl">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">Próximas sessões</span>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">{upcoming.length}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", upcomingOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1.5 px-3 pb-3">
                  {upcoming.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-muted-foreground">Sem sessões agendadas.</p>
                  ) : (
                    upcoming.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-xl bg-secondary/40 p-2.5">
                        <p className="text-xs font-semibold">{format(new Date(s.scheduled_at), "EEE, d MMM · HH:mm", { locale: pt })}</p>
                        <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{s.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={historyOpen} onOpenChange={setHistoryOpen} className="glass rounded-2xl">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold">Sessões anteriores</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{history.length}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", historyOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1.5 px-3 pb-3">
                  {history.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-muted-foreground">Sem sessões anteriores registadas.</p>
                  ) : (
                    history.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-xl bg-secondary/40 p-2.5">
                        <p className="text-xs font-semibold">{format(new Date(s.scheduled_at), "EEE, d MMM · HH:mm", { locale: pt })}</p>
                        <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{s.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {tab === "ficha" && (
          <div className="space-y-4">
            <Field label="Objectivos">
              <Textarea defaultValue={client.goals} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Altura (cm)"><Input type="number" defaultValue={170} /></Field>
              <Field label="Peso (kg)"><Input type="number" step="0.1" defaultValue={68} /></Field>
            </div>
            <Field label="Lesões"><Textarea defaultValue={client.injuries} /></Field>
            <Field label="Notas do PT (privado)"><Textarea defaultValue={client.notes} /></Field>
            <SaveButton className="w-full" toastText="Ficha guardada">Guardar ficha</SaveButton>
          </div>
        )}
      </section>

      {libraryOpen && (
        <WorkoutLibraryDialog
          open={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          clientId={client.id}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function WorkoutLibraryDialog({ open, onClose, clientId }: { open: boolean; onClose: () => void; clientId: string }) {
  const [savedWorkouts, setSavedWorkouts] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("hercles.pt.workoutLibrary") ?? "[]"); } catch { return []; }
  });
  const navigate = useNavigate();

  function deleteWorkout(id: string) {
    if (confirm("Tens a certeza que queres eliminar este treino da biblioteca?")) {
      const next = savedWorkouts.filter((w) => w.id !== id);
      setSavedWorkouts(next);
      localStorage.setItem("hercles.pt.workoutLibrary", JSON.stringify(next));
      toast.success("Treino eliminado da biblioteca.");
    }
  }

  function copyWorkout(workout: any) {
    // Navigate to new workout but with this workout's exercises stored in some way, 
    // or we can just mock creating it and redirect to it.
    // For now we'll just show a success toast and close, since we're using mockData.
    // To actually populate it in the builder we can use localStorage to pass data.
    localStorage.setItem("hercles.pt.importWorkout", JSON.stringify(workout));
    toast.success("Treino importado! Redirecionando para o editor...");
    onClose();
    navigate(`/pt/clients/${clientId}/workouts/new?import=true`);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-accent" /> Biblioteca de Treinos
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
          {savedWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Ainda não tens treinos guardados na biblioteca.</p>
          ) : (
            savedWorkouts.map((w) => (
              <div key={w.id} className="glass flex flex-col gap-3 rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{w.name}</p>
                    <p className="text-xs text-muted-foreground">{w.exercises?.length || 0} exercícios</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => copyWorkout(w)} className="flex-1 bg-accent/20 text-accent hover:bg-accent/30 text-xs h-8">
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar para o aluno
                  </Button>
                  <Button variant="ghost" onClick={() => deleteWorkout(w.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
