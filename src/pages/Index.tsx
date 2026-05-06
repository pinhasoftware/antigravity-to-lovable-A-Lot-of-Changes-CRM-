import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, Dumbbell, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import herclesLogo from "@/assets/hercles-logo.png";

export default function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user && role) navigate(role === "trainer" ? "/pt" : "/app", { replace: true });
  }, [user, role, loading, navigate]);

  return (
    <div className="relative mx-auto min-h-screen max-w-md overflow-hidden bg-gradient-hero">
      <title>Hercles — O copilot inteligente de Personal Trainers</title>
      <meta name="description" content="App PWA para personal trainers e clientes. Treinos, calendário, chat, nutrição e Hercles AI." />

      <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
      <div className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative flex min-h-screen flex-col px-6 pb-10 pt-16">
        <div className="mb-10 flex items-center gap-2">
          <img src={herclesLogo} alt="Hercles" className="h-14 w-auto" />
          <span className="text-lg font-bold tracking-tight">Hercles</span>
        </div>

        <h1 className="text-4xl font-black leading-[1.05] tracking-tight">
          O teu <span className="gradient-text-primary">copilot</span><br />de PT.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Gere clientes, treinos, faturação e nutrição num só sítio — com Hercles AI sempre a um toque.
        </p>

        <div className="mt-10 space-y-3">
          <Feature icon={Users} title="Para PTs" desc="Calendário, fichas de cliente, faturação, AI." />
          <Feature icon={Dumbbell} title="Para alunos" desc="Treino com timer, chat, nutrição, progresso." />
        </div>

        <div className="mt-10">
          <Link
            to="/auth"
            className="group relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary text-base font-bold text-primary-foreground shadow-glow transition-all hover:opacity-90"
          >
            Entrar
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Ainda sem conta?{" "}
            <Link to="/auth?mode=signup" className="font-semibold text-foreground underline-offset-4 hover:underline">
              Criar conta de PT
            </Link>
          </p>
        </div>

        <p className="mt-auto pt-10 text-center text-[11px] text-muted-foreground">
          v1.0 · feito em Portugal 🇵🇹
        </p>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary">
        <Icon className="h-6 w-6 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
