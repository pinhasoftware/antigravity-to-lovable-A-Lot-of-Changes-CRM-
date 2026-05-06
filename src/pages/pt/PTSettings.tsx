import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, Dumbbell, Bell, Calendar, Users, Wallet, Palette, Plug, Shield, Cog, Settings as SettingsIcon, LogOut, Eye } from "lucide-react";
import { SettingsLayout, type SettingsSection } from "@/components/SettingsLayout";
import { useDemo } from "@/contexts/DemoContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";
import { useProfile, fileToDataURL } from "@/contexts/ProfileContext";
import { UserAvatar } from "@/components/UserAvatar";
import { mockClients } from "@/lib/mocks";

const SECTIONS: SettingsSection[] = [
  { id: "geral", label: "Geral", icon: SettingsIcon, items: ["Idioma", "Fuso horário", "Formato de data", "Moeda", "Unidade de peso"] },
  { id: "perfil", label: "Perfil", icon: User, items: ["Nome profissional", "Biografia", "Email", "Telefone", "Especialidades", "Certificações", "Localização"] },
  { id: "treino", label: "Preferências de Treino", icon: Dumbbell, items: ["Duração padrão da sessão", "Formato preferido", "Sugestões da Pilot AI", "Auto-progressão"] },
  { id: "notificacoes", label: "Notificações", icon: Bell, items: ["Mensagens de clientes", "Pagamentos em atraso", "Renovações próximas", "Novos check-ins", "Lembretes pessoais", "Resumo diário", "Som das notificações"] },
  { id: "agendamento", label: "Agendamento", icon: Calendar, items: ["Horário de trabalho", "Buffer entre sessões", "Política de cancelamento", "Modalidade preferida"] },
  { id: "clientes", label: "Gestão de Clientes", icon: Users, items: ["Mensagem de boas-vindas", "Frequência de check-ins", "Limite de clientes"] },
  { id: "pagamentos", label: "Pagamentos e Finanças", icon: Wallet, items: ["Método de pagamento", "IBAN", "NIF"] },
  { id: "aparencia", label: "Aparência", icon: Palette, items: ["Tema", "Cor da marca"] },
  { id: "integracoes", label: "Integrações", icon: Plug, items: ["WhatsApp Business", "Google Calendar", "Zoom", "Apple Health", "Google Fit", "Exportar para Excel"] },
  { id: "seguranca", label: "Segurança", icon: Shield, items: ["Alterar palavra-passe", "Autenticação de dois fatores", "2FA", "Sessões ativas", "Terminar sessão", "Eliminar conta"] },
  { id: "visao-aluno", label: "Ver como Aluno", icon: Eye, items: ["Visualizar como aluno"] },
  { id: "avancadas", label: "Avançadas", icon: Cog, items: ["Versão", "Enviar feedback", "Exportar dados", "Termos de Serviço", "Política de Privacidade"] },
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

  function handleSave() {
    toast.success("Definições guardadas", { id: "settings-saved" });
    // Volta para o índice de definições (vista geral) depois de guardar.
    setActive(null);
    if (location.hash) navigate("/pt/settings", { replace: true });
  }

  async function handleLogout() {
    setRole(null);
    await signOut();
    navigate("/auth", { replace: true });
  }

  return (
    <SettingsLayout
      title="Definições"
      backTo="/pt"
      sections={SECTIONS}
      active={active}
      onSelect={setActive}
      onSave={handleSave}
    >
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
          <FieldToggle label="Sugestões da Pilot AI no Workout Builder" defaultChecked />
          <FieldToggle label="Auto-progressão recomendada" defaultChecked />
        </Section>
      )}

      {active === "notificacoes" && (
        <Section title="Notificações" desc="Push e in-app">
          <FieldToggle label="Mensagens de clientes" defaultChecked />
          <FieldToggle label="Pagamentos em atraso" defaultChecked />
          <FieldToggle label="Renovações próximas" defaultChecked />
          <FieldToggle label="Novos check-ins de clientes" defaultChecked />
          <FieldToggle label="Lembretes pessoais" defaultChecked />
          <FieldToggle label="Resumo diário (manhã)" />
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

      {active === "pagamentos" && (
        <Section title="Pagamentos e Finanças" desc="Métodos e dados bancários">
          <FieldSelect label="Método de pagamento preferido" defaultValue="mbway" options={[
            { value: "mbway", label: "MB WAY" },
            { value: "transferencia", label: "Transferência bancária" },
            { value: "stripe", label: "Stripe" },
            { value: "dinheiro", label: "Dinheiro" },
          ]}/>
          <Field label="IBAN"><Input placeholder="PT50 0000 0000 0000 0000 0000 0" /></Field>
          <Field label="NIF"><Input placeholder="999 999 999" /></Field>
        </Section>
      )}

      {active === "aparencia" && (
        <Section title="Aparência" desc="Tema e identidade visual">
          <ThemeField />
          <Field label="Cor da marca"><Input type="color" defaultValue="#BEF264" className="h-11 w-24" /></Field>
        </Section>
      )}

      {active === "integracoes" && (
        <Section title="Integrações" desc="Liga ferramentas externas">
          <FieldToggle label="WhatsApp Business" />
          <FieldToggle label="Google Calendar" />
          <FieldToggle label="Zoom" />
          <FieldToggle label="Apple Health / Google Fit" />
          <FieldToggle label="Exportar para Excel" defaultChecked />
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

      {active === "avancadas" && (
        <Section title="Avançadas" desc="Versão, dados e legal">
          <Field label="Versão"><Input value="v1.0.0" readOnly /></Field>
          <Button variant="outline" className="w-full justify-start">Enviar feedback</Button>
          <Button variant="outline" className="w-full justify-start">Exportar os meus dados</Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground">Termos de Serviço</Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground">Política de Privacidade</Button>
        </Section>
      )}
      {active === "visao-aluno" && <StudentViewSection />}
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

function FieldToggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary/40 p-3">
      <span className="text-sm">{label}</span>
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

function StudentViewSection() {
  const { setRole } = useDemo();
  const navigate = useNavigate();

  function viewAs(clientId: string) {
    // Store the selected client ID for the banner to display
    localStorage.setItem("hercles.studentView.clientId", clientId);
    setRole("client");
    navigate("/app", { replace: true });
  }

  return (
    <Section title="Ver como Aluno" desc="Veja exatamente o que os seus alunos vêem">
      <p className="text-xs text-muted-foreground">Seleciona um aluno para entrar na sua vista. Quando quiser sair, prime o botão que aparece no topo do ecrã.</p>
      <div className="space-y-2 mt-2">
        {mockClients.map((c) => (
          <button
            key={c.id}
            onClick={() => viewAs(c.id)}
            className="flex w-full items-center gap-3 rounded-xl bg-secondary/40 p-3 text-left hover:bg-secondary/70 transition-colors"
          >
            <UserAvatar name={c.full_name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{c.full_name}</p>
              <p className="text-xs capitalize text-muted-foreground">{c.type}</p>
            </div>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </Section>
  );
}
