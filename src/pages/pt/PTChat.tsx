import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Sparkles, MessageCircle, MessageSquarePlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { mockClients, mockChats, clientById, type MockChatMessage, type MockClient } from "@/lib/mocks";
import { ChatComposer, ChatAttachmentBubble, type ChatAttachment } from "@/components/chat/ChatComposer";
import { usePageState } from "@/contexts/PageStateContext";

const ADDED_KEY = "fitpilot_pt_chat_added";

const SUGGESTIONS_BANK: Record<string, string[]> = {
  default: [
    "Sem stress 💪 vamos compensar na próxima sessão.",
    "Combinado! Confirmas o horário por aqui?",
    "Boa! Lembra-te de descansar bem entre séries.",
  ],
  c1: [
    "Perfeito Ana, 10h marcada ✅",
    "Muito bem! Continua assim 🔥",
    "Claro, sem problema. Avisa-me se mudar algo.",
  ],
  c2: [
    "Sem problema. Faz 30 min de cardio moderado em vez de pernas.",
    "Os DOMS são normais nas primeiras semanas. Hidrata bem!",
    "Hoje descansa. Amanhã retomamos com pernas leves.",
  ],
};

export default function PTChat() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [chatStore, setChatStore] = usePageState<MockChatMessage[]>("pt.chat.store", [...mockChats]);
  const [addedIds, setAddedIds] = usePageState<string[]>("pt.chat.added", []);
  const [showAddSheet, setShowAddSheet] = useState(false);

  // legacy migrate: importa lista antiga em localStorage para PageState
  useEffect(() => {
    if (addedIds.length > 0) return;
    try {
      const legacy = JSON.parse(localStorage.getItem(ADDED_KEY) ?? "[]");
      if (Array.isArray(legacy) && legacy.length) setAddedIds(legacy);
    } catch { /* */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addClient(id: string) {
    setAddedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setSearch("");
    navigate(`/pt/chat/${id}`);
  }

  const threads = useMemo(() => {
    const lastByClient = new Map<string, MockChatMessage>();
    const unreadByClient = new Map<string, number>();
    for (const m of [...chatStore].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))) {
      if (!lastByClient.has(m.client_id)) lastByClient.set(m.client_id, m);
      if (m.sender_role === "client" && !m.read) {
        unreadByClient.set(m.client_id, (unreadByClient.get(m.client_id) ?? 0) + 1);
      }
    }
    return mockClients
      .filter((c) => addedIds.includes(c.id))
      .map((c) => ({ client: c, last: lastByClient.get(c.id), unread: unreadByClient.get(c.id) ?? 0 }))
      .sort((a, b) => {
        const da = a.last ? +new Date(a.last.created_at) : 0;
        const db = b.last ? +new Date(b.last.created_at) : 0;
        return db - da;
      });
  }, [chatStore, addedIds]);

  const q = search.trim().toLowerCase();

  // Contactos novos para adicionar (apenas alunos ainda não adicionados que combinem com q).
  const contactsToAdd = useMemo(() => {
    if (!q) return [];
    return mockClients.filter(
      (c) => !addedIds.includes(c.id) && c.full_name.toLowerCase().includes(q),
    );
  }, [q, addedIds]);

  // Threads existentes que combinem com nome OU conteúdo de mensagens.
  const matchingThreads = useMemo(() => {
    if (!q) return threads;
    return threads.filter((t) => {
      const nameHit = t.client.full_name.toLowerCase().includes(q);
      const msgHit = chatStore.some(
        (m) => m.client_id === t.client.id && m.content.toLowerCase().includes(q),
      );
      return nameHit || msgHit;
    });
  }, [q, threads, chatStore]);

  const client = clientId ? clientById(clientId) : undefined;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* LEFT PANEL */}
      <div
        className={cn(
          "flex flex-col h-full overflow-y-auto no-scrollbar",
          clientId ? "hidden md:flex md:w-[280px] md:shrink-0 md:border-r md:border-border/60" : "flex w-full md:w-[280px] md:shrink-0 md:border-r md:border-border/60"
        )}
      >
        <div className="px-5 pb-4 pt-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chat</h1>
          <p className="mt-1 text-sm text-muted-foreground">{threads.length} conversa{threads.length === 1 ? "" : "s"}</p>
        </div>
        <button
          onClick={() => setShowAddSheet((v) => !v)}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-glow"
          aria-label="Nova conversa"
        >
          <MessageSquarePlus className="h-4 w-4" /> Novo
        </button>
      </div>

      <div className="relative mt-4">
        <Input
          placeholder="Adicionar ao chat ou procurar aluno"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-2xl"
        />
      </div>

      {/* Quando há pesquisa: mostra primeiro contactos a adicionar e depois conversas que batem certo */}
      {q && (
        <div className="mt-3 space-y-4">
          {contactsToAdd.length > 0 && (
            <div className="space-y-1.5">
              <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Adicionar ao chat
              </p>
              {contactsToAdd.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addClient(c.id)}
                  className="flex w-full items-center gap-3 rounded-xl bg-secondary/40 p-2.5 text-left hover:bg-secondary/70"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                    {initials(c.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.full_name}</p>
                    <p className="text-[11px] capitalize text-muted-foreground">{c.type}</p>
                  </div>
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              ))}
            </div>
          )}

          {matchingThreads.length > 0 && (
            <div className="space-y-2">
              <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conversas</p>
              {matchingThreads.map((t) => (
                <Link
                  key={t.client.id}
                  to={`/pt/chat/${t.client.id}`}
                  className={cn(
                    "glass flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-secondary/40",
                    clientId === t.client.id && "bg-secondary/60 ring-1 ring-border"
                  )}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">
                    {initials(t.client.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{t.client.full_name}</p>
                      {t.last && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {new Date(t.last.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{t.last?.content ?? "Sem mensagens ainda"}</p>
                  </div>
                  {t.unread > 0 && (
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {t.unread}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {contactsToAdd.length === 0 && matchingThreads.length === 0 && (
            <p className="rounded-xl bg-secondary/40 p-6 text-center text-xs text-muted-foreground">
              Sem resultados para "{search}".
            </p>
          )}
        </div>
      )}

      {/* Folha "Nova conversa" quando o utilizador carrega no botão Novo */}
      {showAddSheet && !q && (
        <div className="mt-3 space-y-1.5 rounded-2xl border border-border/60 bg-secondary/20 p-3">
          <div className="flex items-center justify-between px-1 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Iniciar conversa
            </p>
            <button onClick={() => setShowAddSheet(false)} className="text-[10px] text-muted-foreground hover:text-foreground">Fechar</button>
          </div>
          {mockClients.filter((c) => !addedIds.includes(c.id)).length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">Todos os alunos já estão adicionados.</p>
          ) : (
            mockClients
              .filter((c) => !addedIds.includes(c.id))
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => { addClient(c.id); setShowAddSheet(false); }}
                  className="flex w-full items-center gap-3 rounded-xl bg-background/40 p-2.5 text-left hover:bg-background/70"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                    {initials(c.full_name)}
                  </div>
                  <span className="flex-1 truncate text-sm font-medium">{c.full_name}</span>
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              ))
          )}
        </div>
      )}

      {/* Lista normal das conversas existentes */}
      {!q && (
        <div className="mt-4 space-y-2">
          {threads.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="font-medium text-foreground">Sem conversas ainda</p>
              <p className="mt-1 text-xs">Usa a barra de pesquisa ou o botão "Novo" para adicionar um aluno ao chat.</p>
            </div>
          ) : (
            threads.map((t) => (
              <Link
                key={t.client.id}
                to={`/pt/chat/${t.client.id}`}
                className={cn(
                  "glass flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-secondary/40",
                  clientId === t.client.id && "bg-secondary/60 ring-1 ring-border"
                )}
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">
                  {initials(t.client.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{t.client.full_name}</p>
                    {t.last && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {new Date(t.last.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{t.last?.content ?? "Sem mensagens ainda"}</p>
                </div>
                {t.unread > 0 && (
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {t.unread}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className={cn(
          "flex-col flex-1 h-full min-w-0 bg-background overflow-hidden relative",
          clientId ? "flex" : "hidden md:flex items-center justify-center"
        )}
      >
        {clientId ? (
          <ChatThread client={client} chatStore={chatStore} setChatStore={setChatStore} onBack={() => navigate("/pt/chat")} />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground opacity-60">
            <MessageCircle className="h-12 w-12 mb-4" />
            <p className="text-sm">Seleciona uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatThread({
  client, chatStore, setChatStore, onBack,
}: {
  client?: MockClient;
  chatStore: MockChatMessage[];
  setChatStore: React.Dispatch<React.SetStateAction<MockChatMessage[]>>;
  onBack: () => void;
}) {
  const messages = useMemo(
    () => chatStore.filter((m) => m.client_id === client?.id).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    [chatStore, client],
  );
  const [input, setInput] = usePageState<string>(`pt.chat.draft.${client?.id ?? "x"}`, "");
  const [pending, setPending] = usePageState<ChatAttachment[]>(`pt.chat.pending.${client?.id ?? "x"}`, []);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function toggleSuggest() {
    if (!client) return;
    setSuggestions((prev) => (prev.length > 0 ? [] : (SUGGESTIONS_BANK[client.id] ?? SUGGESTIONS_BANK.default)));
  }

  function send(text: string, atts: ChatAttachment[]) {
    if (!client) return;
    const t = text.trim();
    if (!t && atts.length === 0) return;
    setSuggestions([]);
    setChatStore((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        client_id: client.id,
        sender_role: "trainer",
        content: t,
        created_at: new Date().toISOString(),
        read: true,
        attachments: atts.length ? atts : undefined,
      },
    ]);
    setInput("");
    setPending([]);
  }

  if (!client) {
    return (
      <div className="px-5 pt-6">
        <button onClick={onBack} className="text-sm text-muted-foreground">← Voltar</button>
        <p className="mt-4 text-sm">Cliente não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl">
        <button onClick={onBack} className="md:hidden grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-sm font-semibold">
          {initials(client.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{client.full_name}</p>
          <p className="text-[11px] text-muted-foreground capitalize">{client.type}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4" ref={scrollRef as never}>
        <div className="space-y-2 py-4">
          {messages.length === 0 && (
            <p className="py-12 text-center text-xs text-muted-foreground">Sem mensagens. Envia a primeira!</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.sender_role === "trainer" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] space-y-1.5 rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  m.sender_role === "trainer"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "glass rounded-bl-sm",
                )}
              >
                {m.attachments?.map((a) => <ChatAttachmentBubble key={a.id} att={a} />)}
                {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                <p className={cn("text-[9px] opacity-60", m.sender_role === "trainer" && "text-right")}>
                  {new Date(m.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {suggestions.length > 0 && (
        <div className="border-t border-border/60 bg-background/85 px-3 py-2 backdrop-blur-xl">
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">Sugestões IA</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onClick={() => setInput(s)}
                className="ai-border glass relative shrink-0 max-w-[260px] rounded-xl px-3 py-2 text-left text-xs hover:bg-accent/10"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <ChatComposer
        text={input}
        setText={setInput}
        pending={pending}
        setPending={setPending}
        onSend={send}
        placeholder="Mensagem…"
        leftSlot={
          <Button
            size="icon"
            variant="ghost"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={toggleSuggest}
            className={cn(
              "h-10 w-10 shrink-0 self-center rounded-full text-accent hover:bg-accent/10",
              suggestions.length > 0 && "bg-accent/15",
            )}
            aria-label="Sugestões IA"
            aria-pressed={suggestions.length > 0}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        }
      />
    </div>
  );
}
