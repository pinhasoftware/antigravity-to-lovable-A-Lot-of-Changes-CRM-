import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Plano de força 4 dias para hipertrofia",
  "Como motivar cliente que faltou 2 sessões?",
  "Sugere superset peito + costas",
  "Macros para cliente em défice de 500 kcal",
];

const HAS_NEW_SUGGESTION = true; // flag para indicar sugestão nova do AI

const CANNED: Record<string, string> = {
  default: "Boa pergunta! No modo demo as respostas são simuladas. Quando ligares ao backend, eu uso o **Lovable AI Gateway** para gerar respostas reais com base no contexto dos teus clientes.",
  hipertrofia: "**Plano 4 dias — Hipertrofia**\n\n- **Seg** Peito + Tríceps\n- **Ter** Costas + Bíceps\n- **Qui** Pernas + Core\n- **Sex** Ombros + Braços\n\n4 séries de 8-12 reps, descanso 60-90s. Progressão: +2.5kg quando bate teto superior 2 semanas seguidas.",
  motivar: "Sugiro mensagem curta:\n\n> *\"Olá! Notei que tens estado ausente — está tudo bem? Se precisares de adaptar o horário ou intensidade, diz-me. Estou aqui.\"*\n\nEvita tom culpabilizador. Oferece flexibilidade.",
  superset: "**Superset Peito + Costas**\n\n- A1 — Supino plano halteres · 4×10\n- A2 — Remada curvada · 4×10\n\nDescanso 90s entre supersets. Excelente para densidade muscular e poupança de tempo.",
  macros: "Para défice de 500 kcal:\n\n- **Proteína** 2g/kg peso corporal\n- **Gordura** 0.8g/kg\n- **Hidratos** restante das kcal\n\nExemplo (75kg, alvo 2000 kcal): 150g P · 60g G · 200g H.",
};

function pickReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("hipertrofia") || t.includes("força")) return CANNED.hipertrofia;
  if (t.includes("motivar") || t.includes("falta")) return CANNED.motivar;
  if (t.includes("superset")) return CANNED.superset;
  if (t.includes("macro") || t.includes("kcal") || t.includes("défice")) return CANNED.macros;
  return CANNED.default;
}

export default function PTAI() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: t }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: pickReply(t) }]);
      setLoading(false);
    }, 800);
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/90 px-5 py-3 backdrop-blur-xl">
        <div className="grid h-10 w-10 place-items-center rounded-xl shadow-[var(--shadow-ai)]" style={{ background: "var(--gradient-ai)" }}>
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pilot AI</h1>
          <p className="text-[11px] text-muted-foreground">O teu copilot de treino · demo</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-5 pt-4" ref={scrollRef as never}>
        <div className="space-y-3 pb-4 pr-1">
          {messages.length === 0 && !loading && (
            <div className="space-y-4 pt-6">
              <div className="ai-border glass relative rounded-2xl p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Olá! Sou o Pilot. Pergunta-me sobre <span className="text-foreground">planos de treino</span>, <span className="text-foreground">nutrição</span>, <span className="text-foreground">gestão de clientes</span>.
                </p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setSuggestionsOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-1"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sugestões</span>
                  {HAS_NEW_SUGGESTION && !suggestionsOpen && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-foreground">Novo</span>
                  )}
                  <span className={cn("text-[10px] text-muted-foreground transition-transform", suggestionsOpen && "rotate-180")}>▼</span>
                </button>
                {suggestionsOpen && SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="glass w-full rounded-xl px-4 py-3 text-left text-sm transition-colors hover:bg-accent/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "glass ai-border relative rounded-bl-sm",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="glass ai-border relative flex items-center gap-2 rounded-2xl rounded-bl-sm px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span className="text-xs text-muted-foreground">A pensar…</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input fixo mesmo acima da barra de navegação */}
      <div className="border-t border-border/60 bg-background/90 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Pergunta ao Pilot…"
            rows={1}
            className="h-11 min-h-[44px] max-h-32 flex-1 resize-none rounded-2xl py-2.5 leading-tight"
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="h-11 w-11 shrink-0 rounded-2xl"
            style={{ background: "var(--gradient-ai)" }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
