import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight, MailCheck, Users, Dumbbell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDemo } from "@/contexts/DemoContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import herclesLogo from "@/assets/hercles-logo.png";

export default function Auth() {
  const { user, role, signIn, signUp, loading: authLoading } = useAuth();
  const { setRole: setDemoRole } = useDemo();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inviteToken = params.get("invite");

  const [mode, setMode] = useState<"signin" | "signup">(inviteToken || params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [inviteTrainer, setInviteTrainer] = useState<string | null>(null);
  const [signupSent, setSignupSent] = useState(false);

  useEffect(() => {
    if (inviteToken) {
      supabase.rpc("get_invite_info", { _token: inviteToken }).then(({ data }) => {
        const row = Array.isArray(data) ? data[0] : data;
        if (row?.trainer_name) setInviteTrainer(row.trainer_name);
        else setInviteTrainer("o teu PT");
      });
    }
  }, [inviteToken]);

  useEffect(() => {
    if (!authLoading && user && role) {
      navigate(role === "trainer" ? "/pt" : "/app", { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const targetRole = inviteToken ? "client" : "trainer";
    const { error } = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password, fullName, targetRole, inviteToken ?? undefined);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (mode === "signup") {
      setSignupSent(true);
    }
  }

  function enterDemo(r: "trainer" | "client") {
    setDemoRole(r);
    navigate(r === "trainer" ? "/pt" : "/app", { replace: true });
  }

  if (signupSent) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gradient-hero px-6 py-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
        <div className="glass-strong relative w-full max-w-md rounded-2xl p-8 text-center shadow-card animate-fade-in">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <MailCheck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Confirma o teu email</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enviámos um email para <span className="font-semibold text-foreground">{email}</span>. Carrega no link dentro do email para ativar a tua conta.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Não recebeste? Verifica o spam ou tenta entrar — se a confirmação demorar, podes pedir reenvio mais tarde.
          </p>
          <Button
            onClick={() => { setSignupSent(false); setMode("signin"); }}
            className="mt-6 h-11 w-full bg-gradient-primary text-primary-foreground"
          >
            Ir para Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gradient-hero px-6 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={herclesLogo} alt="Hercles" className="mb-5 h-28 w-auto" />
          <h1 className="text-3xl font-bold tracking-tight">Hercles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {inviteToken && inviteTrainer
              ? `${inviteTrainer} convidou-te para treinar.`
              : "O teu copilot inteligente de PT."}
          </p>
        </div>

        {/* DEMO BYPASS — temporário para construção */}
        <div className="mb-4 rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-3">
          <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider gradient-text-ai">
            🚧 Modo construção — ver sem login
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => enterDemo("trainer")} variant="outline" className="h-10 text-xs">
              <Users className="mr-1.5 h-3.5 w-3.5" /> Ver como PT
            </Button>
            <Button onClick={() => enterDemo("client")} variant="outline" className="h-10 text-xs">
              <Dumbbell className="mr-1.5 h-3.5 w-3.5" /> Ver como Aluno
            </Button>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6 shadow-card">
          <div className="mb-5 flex rounded-xl bg-secondary p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >Entrar</button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >Criar conta</button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome completo</Label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9" placeholder="O teu nome" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="email@exemplo.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pwd">Palavra-passe</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="pwd" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" placeholder="Mínimo 6 caracteres" />
              </div>
            </div>

            <Button type="submit" disabled={busy} className="h-11 w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
              {busy ? "A processar..." : mode === "signin" ? "Entrar" : inviteToken ? "Aceitar convite" : "Criar conta de PT"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {!inviteToken && mode === "signup" && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              A criar conta como <span className="font-semibold text-foreground">Personal Trainer</span>. Os clientes entram via link de convite.
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Voltar</Link>
        </p>
      </div>
    </div>
  );
}
