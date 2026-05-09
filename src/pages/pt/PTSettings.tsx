import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { User, Dumbbell, Bell, Calendar, Users, Palette, Shield, Settings as SettingsIcon, LogOut, HelpCircle, AlertCircle } from "lucide-react";
import { SettingsLayout, type SettingsSection } from "@/components/SettingsLayout";
import { useDemo } from "@/contexts/DemoContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";
import { useProfile, fileToDataURL } from "@/contexts/ProfileContext";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

const SECTIONS: SettingsSection[] = [
  { id: "geral", label: "Geral", icon: SettingsIcon, items: ["Idioma", "Fuso horário", "Formato de data", "Moeda", "Unidade de peso"] },
  { id: "perfil", label: "Perfil profissional", icon: User, items: ["Nome profissional", "Biografia", "Email", "Telefone", "Especialidades", "Certificações", "Localização"] },
  { id: "treino", label: "Preferências de Treino", icon: Dumbbell, items: ["Duração padrão da sessão", "Formato preferido", "Sugestões da Hercles AI"] },
  { id: "notificacoes", label: "Notificações", icon: Bell, items: ["Mensagens de clientes", "Pagamentos em atraso", "Renovações próximas", "Novos check-ins", "Lembretes pessoais", "Resumo diário", "Som das notificações"] },
  { id: "agendamento", label: "Agendamento", icon: Calendar, items: ["Horário de trabalho", "Buffer entre sessões", "Política de cancelamento", "Modalidade preferida"] },
  { id: "clientes", label: "Gestão de Clientes", icon: Users, items: ["Mensagem de boas-vindas", "Frequência de check-ins", "Limite de clientes"] },
  { id: "aparencia", label: "Aparência", icon: Palette, items: ["Tema", "Cores da minha marca"] },
  { id: "seguranca", label: "Segurança", icon: Shield, items: ["Alterar palavra-passe", "Autenticação de dois fatores", "2FA", "Sessões ativas", "Terminar sessão", "Eliminar conta"] },
];

export default function PTSettings() {
  const [active, setActive] = useState<string | null>(null);
  const { setRole } = useDemo();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Deep-link via #hash → abre a secção indicada (ex: #seguranca).
  useEffect(() => {
    const id = location.hash.replace("#", "");
    if (id && SECTIONS.some((s) => s.id === id)) setActive(id);
  }, [location.hash]);

  async function handleLogout() {
    setRole(null);
    await signOut();
    navigate("/auth", { replace: true });
  }

  // Permite que as sub-secções registem uma função de guardar personalizada
  const sectionSaveRef = useRef<(() => void) | null>(null);

  function handleSave() {
    if (sectionSaveRef.current) sectionSaveRef.current();
    toast.success("Definições guardadas", { id: "settings-saved" });
    setActive(null);
    if (location.hash) navigate("/pt/settings", { replace: true });
  }

  return (
    <SettingsLayout
      title="Definições"
      backTo="/pt"
      sections={SECTIONS}
      active={active}
      onSelect={setActive}
      onSave={active ? handleSave : undefined}
    >
      {!active && (
        <div className="mt-10 border-t border-border/40 pt-6 pb-10 text-center">
          <div className="flex justify-center gap-6 text-[11px] text-muted-foreground">
            <Link to="#" className="hover:text-foreground">Política de Privacidade</Link>
            <Link to="#" className="hover:text-foreground">Termos e Condições</Link>
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground/60">v1.0.0 · Hercles Trainer</p>
        </div>
      )}
      {active === "geral" && (
        <Section title="Geral" desc="Idioma, fuso horário e formatos">
          <FieldSelect label="Idioma" defaultValue="pt-PT" options={[
            { value: "pt-PT", label: "Português (PT)" },
            { value: "pt-BR", label: "Português (BR)" },
            { value: "en", label: "English" },
            { value: "es", label: "Español" },
          ]}/>
          <FieldSelect label="Fuso horário" defaultValue="Europe/Lisbon" options={[
            { value: "Europe/Lisbon", label: "Europe/Lisbon (UTC+0)" },
            { value: "Europe/Madrid", label: "Europe/Madrid (UTC+1)" },
            { value: "America/Sao_Paulo", label: "America/Sao_Paulo (UTC-3)" },
          ]}/>
          <FieldSelect label="Formato de data" defaultValue="dmy" options={[
            { value: "dmy", label: "DD/MM/AAAA" },
            { value: "mdy", label: "MM/DD/AAAA" },
            { value: "ymd", label: "AAAA-MM-DD" },
          ]}/>
          <FieldSelect label="Moeda" defaultValue="EUR" options={[
            { value: "EUR", label: "€ Euro" },
            { value: "USD", label: "$ US Dollar" },
            { value: "BRL", label: "R$ Real" },
            { value: "GBP", label: "£ Pound" },
          ]}/>
          <FieldSelect label="Unidade de peso" defaultValue="kg" options={[
            { value: "kg", label: "Quilogramas (kg)" },
            { value: "lbs", label: "Libras (lbs)" },
          ]}/>
        </Section>
      )}

      {active === "perfil" && <ProfileSection />}


      {active === "treino" && (
        <Section title="Preferências de Treino" desc="Defaults para os planos que crias">
          <FieldSelect label="Duração padrão da sessão" defaultValue="60" options={[
            { value: "30", label: "30 min" },
            { value: "45", label: "45 min" },
            { value: "60", label: "60 min" },
            { value: "90", label: "90 min" },
          ]}/>
          <FieldSelect label="Formato preferido" defaultValue="presencial" options={[
            { value: "presencial", label: "Presencial" },
            { value: "online", label: "Online" },
            { value: "hibrido", label: "Híbrido" },
          ]}/>
          <FieldToggle label="Sugestões da Hercles AI no Workout Builder" defaultChecked />
        </Section>
      )}

      {active === "notificacoes" && (
        <Section title="Notificações" desc="Push e in-app">
          <FieldToggle label="Mensagens de clientes" defaultChecked help="Recebe alertas quando os teus clientes te enviam mensagens no chat." />
          <FieldToggle label="Pagamentos em atraso" defaultChecked help="Avisamos-te mal um pagamento ultrapasse a data limite definida." />
          <FieldToggle label="Renovações próximas" defaultChecked help="Notificações 7 dias antes do plano de um cliente expirar." />
          <FieldToggle label="Novos check-ins de clientes" defaultChecked help="Sabe mal um aluno responda ao check-in ou submeta novos dados." />
          <FieldToggle label="Lembretes pessoais" defaultChecked help="Notificações baseadas nos teus lembretes de agenda." />
          <FieldToggle label="Resumo diário (manhã)" help="Um resumo rápido às 8h com o que tens agendado para o dia." />
          <FieldToggle label="Som das notificações" defaultChecked />
        </Section>
      )}

      {active === "agendamento" && (
        <Section title="Agendamento" desc="Disponibilidade e regras de cancelamento">
          <Field label="Horário de trabalho"><Input placeholder="Seg-Sex 07:00–21:00" /></Field>
          <FieldSelect label="Buffer entre sessões" defaultValue="15" options={[
            { value: "0", label: "Sem buffer" },
            { value: "10", label: "10 minutos" },
            { value: "15", label: "15 minutos" },
            { value: "30", label: "30 minutos" },
          ]}/>
          <FieldSelect label="Política de cancelamento" defaultValue="24" options={[
            { value: "12", label: "12h antes" },
            { value: "24", label: "24h antes" },
            { value: "48", label: "48h antes" },
          ]}/>
        </Section>
      )}

      {active === "clientes" && (
        <Section title="Gestão de Clientes" desc="Onboarding e templates">
          <Field label="Mensagem de boas-vindas"><Textarea defaultValue="Bem-vindo! Estou aqui para te ajudar a alcançar os teus objetivos." /></Field>
          <FieldSelect label="Frequência sugerida de check-ins" defaultValue="30" options={[
            { value: "15", label: "Cada 15 dias" },
            { value: "30", label: "Cada 30 dias" },
            { value: "60", label: "Cada 60 dias" },
          ]}/>
          <Field label="Limite de clientes"><Input type="number" defaultValue="50" /></Field>
        </Section>
      )}

      {active === "aparencia" && (
        <Section title="Aparência" desc="Tema e identidade visual">
          <ThemeField />
          <div className="my-6 h-px bg-border/40" />
          <BrandColorsSection onRegisterSave={(fn) => { sectionSaveRef.current = fn; }} />
        </Section>
      )}

      {active === "seguranca" && (
        <Section title="Segurança" desc="Conta, password e sessões">
          <Button variant="outline" className="w-full justify-start">Alterar palavra-passe</Button>
          <FieldToggle label="Autenticação de dois fatores (2FA)" />
          <Button variant="outline" className="w-full justify-start">Ver sessões ativas</Button>
          <Button onClick={handleLogout} variant="outline" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" /> Terminar sessão
          </Button>
          <Button variant="destructive" className="w-full">Eliminar conta</Button>
        </Section>
      )}
    </SettingsLayout>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function FieldSelect({ label, defaultValue, options }: { label: string; defaultValue: string; options: { value: string; label: string }[] }) {
  return (
    <Field label={label}>
      <Select defaultValue={defaultValue}>
        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </Field>
  );
}

function FieldToggle({ label, defaultChecked, help }: { label: string; defaultChecked?: boolean; help?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary/40 p-3">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{label}</span>
        {help && (
          <button 
            type="button" 
            onClick={() => toast.info(label, { description: help })}
            className="text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-3 w-3" />
          </button>
        )}
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function ThemeField() {
  const { theme, setTheme } = useTheme();
  return (
    <Field label="Tema">
      <Select value={theme} onValueChange={(v) => setTheme(v as ThemeMode)}>
        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="dark">Escuro</SelectItem>
          <SelectItem value="light">Claro</SelectItem>
          <SelectItem value="system">Automático (sistema)</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

function AvatarField({ who }: { who: "pt" | "client" }) {
  const { profile, setPTAvatar, setClientAvatar } = useProfile();
  const data = who === "pt" ? profile.pt : profile.client;
  const set = who === "pt" ? setPTAvatar : setClientAvatar;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await fileToDataURL(f);
      set(url);
      toast.success("Foto de perfil atualizada");
    } catch {
      toast.error("Não consegui ler a imagem");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <Field label="Foto de perfil">
      <div className="flex items-center gap-4 rounded-xl bg-secondary/40 p-3">
        <UserAvatar name={data.name} src={data.avatarDataUrl} size="lg" />
        <div className="flex flex-1 flex-col gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground">
            {data.avatarDataUrl ? "Alterar foto" : "Carregar foto"}
            <input type="file" accept="image/*" className="hidden" onChange={onPick} />
          </label>
          {data.avatarDataUrl && (
            <button
              type="button"
              onClick={() => set(null)}
              className="text-left text-[11px] text-muted-foreground hover:text-foreground"
            >
              Remover foto
            </button>
          )}
        </div>
      </div>
    </Field>
  );
}

function ProfileSection() {
  const { profile, setPTName } = useProfile();
  const { user } = useAuth();
  return (
    <Section title="Perfil profissional" desc="O que os teus clientes vêem">
      <AvatarField who="pt" />
      <Field label="Nome profissional">
        <Input
          value={profile.pt.name}
          onChange={(e) => setPTName(e.target.value)}
          placeholder="O teu nome"
        />
      </Field>
      <Field label="Biografia"><Textarea placeholder="Conta a tua história..." /></Field>
      <Field label="Email">
        <Input type="email" value={user?.email ?? ""} readOnly />
      </Field>
      <Field label="Telefone"><Input type="tel" placeholder="+351 9XX XXX XXX" /></Field>
      <Field label="Especialidades"><Input placeholder="Hipertrofia, reabilitação, perda de peso..." /></Field>
      <Field label="Certificações"><Textarea placeholder="IPDJ Nível IV, NSCA-CPT..." /></Field>
      <Field label="Localização"><Input placeholder="Lisboa, Portugal" /></Field>
    </Section>
  );
}

function BrandColorsSection({ onRegisterSave }: { onRegisterSave: (fn: (() => void) | null) => void }) {
  const { profile, setBrand } = useProfile();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingEnabled, setPendingEnabled] = useState(false);
  
  // Local state for colors to satisfy "must click save to apply" requirement
  const [localColors, setLocalColors] = useState({
    primary: profile.brand.primary,
    background: profile.brand.background,
    text: profile.brand.text
  });

  // Register the save function with the parent ref
  useEffect(() => {
    onRegisterSave(() => { setBrand(localColors); });
    return () => onRegisterSave(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localColors]);

  const handleToggle = (checked: boolean) => {
    setPendingEnabled(checked);
    setConfirmOpen(true);
  };

  const confirmChange = () => {
    setBrand({ enabled: pendingEnabled });
    setConfirmOpen(false);
    toast.success(pendingEnabled ? "Cores da marca ativadas!" : "Cores da marca desativadas", {
      description: "As mudanças serão aplicadas automaticamente à app dos teus alunos."
    });
  };

  const enabled = profile.brand.enabled;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Cores da minha marca</h3>
            <p className="text-[11px] text-muted-foreground">Personaliza as cores que os teus alunos vêem na app.</p>
          </div>
          <Switch 
            checked={enabled} 
            onCheckedChange={handleToggle}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className={cn("space-y-4 transition-opacity", !enabled && "opacity-40 pointer-events-none")}>
          <Field label="Cor Principal">
            <div className="flex gap-2">
              <Input 
                type="color" 
                value={localColors.primary} 
                onChange={(e) => setLocalColors(prev => ({ ...prev, primary: e.target.value }))}
                className="h-10 w-20 p-1"
              />
              <Input 
                value={localColors.primary} 
                onChange={(e) => setLocalColors(prev => ({ ...prev, primary: e.target.value }))}
                className="flex-1"
              />
            </div>
          </Field>
          
          <Field label="Cor de Fundo">
            <div className="flex gap-2">
              <Input 
                type="color" 
                value={localColors.background} 
                onChange={(e) => setLocalColors(prev => ({ ...prev, background: e.target.value }))}
                className="h-10 w-20 p-1"
              />
              <Input 
                value={localColors.background} 
                onChange={(e) => setLocalColors(prev => ({ ...prev, background: e.target.value }))}
                className="flex-1"
              />
            </div>
          </Field>

          <Field label="Cor do Texto">
            <div className="flex gap-2">
              <Input 
                type="color" 
                value={localColors.text} 
                onChange={(e) => setLocalColors(prev => ({ ...prev, text: e.target.value }))}
                className="h-10 w-20 p-1"
              />
              <Input 
                value={localColors.text} 
                onChange={(e) => setLocalColors(prev => ({ ...prev, text: e.target.value }))}
                className="flex-1"
              />
            </div>
          </Field>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pré-visualização (App do Aluno)</p>
          <div className="relative h-[400px] w-[200px] overflow-hidden rounded-[2.5rem] border-[6px] border-secondary/50 shadow-2xl bg-black">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-b-xl bg-secondary/50" />
            
            {/* Mock App Content */}
            <div 
              className="relative h-full w-full overflow-hidden p-4 pt-8 transition-colors duration-500"
              style={{ backgroundColor: enabled ? localColors.background : "#0A0A0A" }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 w-20 rounded bg-secondary/20" />
                <div className="h-8 w-8 rounded-full bg-secondary/20" />
              </div>
              
              <div 
                className="mb-4 h-24 w-full rounded-2xl p-3 shadow-lg"
                style={{ backgroundColor: enabled ? localColors.primary : "#BEF264" }}
              >
                <div className="h-3 w-1/2 rounded bg-black/10 mb-2" />
                <div className="h-6 w-3/4 rounded bg-black/20" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-secondary/10 p-3">
                  <div className="h-8 w-8 rounded-lg bg-secondary/20" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 rounded bg-secondary/20" />
                    <div className="h-2 w-1/2 rounded bg-secondary/10" />
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-secondary/10 p-3">
                  <div className="h-8 w-8 rounded-lg bg-secondary/20" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 rounded bg-secondary/20" />
                    <div className="h-2 w-1/2 rounded bg-secondary/10" />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 left-0 right-0 px-4">
                <div 
                  className="h-10 w-full rounded-xl shadow-md"
                  style={{ backgroundColor: enabled ? localColors.primary : "#BEF264" }}
                />
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground max-w-[180px]">
            Experimenta as cores para veres como fica na conta dos teus alunos em tempo real.
          </p>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-energy" />
              Confirmar alteração
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground leading-relaxed">
            {pendingEnabled 
              ? "Ao ativar as cores da marca, a aparência da app para todos os teus alunos será alterada para as cores que definires." 
              : "Ao desativar, a app dos teus alunos voltará ao tema padrão da Hercles. As tuas cores personalizadas serão guardadas."}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={confirmChange} className="w-full bg-gradient-primary text-primary-foreground">
              Confirmar e aplicar
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" className="w-full">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

