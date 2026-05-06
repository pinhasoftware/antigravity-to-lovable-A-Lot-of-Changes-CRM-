import { useEffect, useRef, useState } from "react";
import { Mic, Paperclip, Send, X, Square, Image as ImageIcon, FileText, Play, Pause, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type ChatAttachmentKind = "image" | "file" | "audio";

export interface ChatAttachment {
  id: string;
  kind: ChatAttachmentKind;
  /** data: URL ou blob URL — sempre utilizável directamente em <img>/<audio>/<a>. */
  url: string;
  name: string;
  /** Para áudio: duração em segundos. */
  duration?: number;
  size?: number;
  mime?: string;
}

interface Props {
  text: string;
  setText: (v: string) => void;
  pending: ChatAttachment[];
  setPending: (a: ChatAttachment[] | ((prev: ChatAttachment[]) => ChatAttachment[])) => void;
  onSend: (text: string, attachments: ChatAttachment[]) => void;
  /** Slot opcional à esquerda (ex: botão de sugestões IA no PT chat) */
  leftSlot?: React.ReactNode;
  placeholder?: string;
}

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function ChatComposer({ text, setText, pending, setPending, onSend, leftSlot, placeholder }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState("");

  // Curated fallback GIFs (used when Tenor API not available)
  const FALLBACK_GIFS = [
    "https://media.tenor.com/4nGaF5G6j2EAAAAC/workout-gym.gif",
    "https://media.tenor.com/T4OOLQE-RkMAAAAC/thumbsup-thumbs-up.gif",
    "https://media.tenor.com/Kqe-TNKH10kAAAAC/lets-go-celebration.gif",
    "https://media.tenor.com/nRLo1WHT9E0AAAAC/encouragement-you-can-do-it.gif",
    "https://media.tenor.com/oRVrIPVAuqEAAAAC/muscle-strong.gif",
    "https://media.tenor.com/pKXQT72C3LcAAAAC/high-five-cool.gif",
  ];
  const [gifResults, setGifResults] = useState<string[]>(FALLBACK_GIFS);

  useEffect(() => {
    return () => {
      if (recRef.current && recRef.current.state !== "inactive") {
        try { recRef.current.stop(); } catch { /* */ }
      }
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  async function pickFiles(e: React.ChangeEvent<HTMLInputElement>, kind: "image" | "file") {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const next: ChatAttachment[] = [];
    for (const f of files) {
      try {
        const url = await fileToDataUrl(f);
        next.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          kind: kind === "image" ? "image" : (f.type.startsWith("image/") ? "image" : "file"),
          url,
          name: f.name,
          size: f.size,
          mime: f.type,
        });
      } catch {
        toast.error(`Falha ao ler ${f.name}`);
      }
    }
    setPending((prev) => [...prev, ...next]);
    e.target.value = "";
  }

  async function startRec() {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => { if (ev.data.size) chunksRef.current.push(ev.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const url = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result));
          r.onerror = rej;
          r.readAsDataURL(blob);
        });
        const dur = (Date.now() - startedAtRef.current) / 1000;
        if (dur < 0.5) {
          toast.message("Áudio muito curto");
          return;
        }
        setPending((prev) => [
          ...prev,
          {
            id: `${Date.now()}`,
            kind: "audio",
            url,
            name: `Mensagem de voz ${fmtTime(dur)}`,
            duration: dur,
            size: blob.size,
            mime: blob.type,
          },
        ]);
      };
      mr.start();
      recRef.current = mr;
      startedAtRef.current = Date.now();
      setRecording(true);
      setRecordSecs(0);
      tickRef.current = window.setInterval(() => {
        setRecordSecs(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
    } catch {
      toast.error("Sem acesso ao microfone");
    }
  }

  function stopRec(cancel = false) {
    if (recRef.current && recRef.current.state !== "inactive") {
      if (cancel) {
        recRef.current.ondataavailable = null;
        recRef.current.onstop = null;
        recRef.current.stop();
        chunksRef.current = [];
      } else {
        recRef.current.stop();
      }
    }
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setRecording(false);
  }

  const canSend = text.trim().length > 0 || pending.length > 0;

  function doSend() {
    if (!canSend) return;
    onSend(text, pending);
  }

  return (
    <div className="border-t border-border/60 bg-background/85 px-3 py-2.5 backdrop-blur-xl">
      {/* Pré-visualização de anexos pendentes */}
      {pending.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pending.map((a) => (
            <AttachmentPreview key={a.id} att={a} onRemove={() => setPending((prev) => prev.filter((x) => x.id !== a.id))} />
          ))}
        </div>
      )}

      {recording ? (
        <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 px-3 py-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-destructive text-destructive-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
          </span>
          <span className="flex-1 text-sm font-mono">{fmtTime(recordSecs)}</span>
          <Button size="icon" variant="ghost" onClick={() => stopRec(true)} aria-label="Cancelar gravação" className="h-9 w-9 rounded-full text-muted-foreground">
            <X className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={() => stopRec(false)} aria-label="Parar e anexar" className="h-10 w-10 rounded-full">
            <Square className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-nowrap items-end gap-1.5">
          {leftSlot}

          {/* Botão de anexos */}
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={() => setShowAttachMenu((v) => !v)}
              aria-label="Anexar"
              className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            {showAttachMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => { setShowAttachMenu(false); setShowGifPicker(false); }} />
                <div className="absolute bottom-12 left-0 z-40 flex flex-col gap-1 rounded-2xl border border-border bg-popover p-1.5 shadow-card">
                  <button
                    type="button"
                    onClick={() => { setShowAttachMenu(false); imgRef.current?.click(); }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    <ImageIcon className="h-4 w-4 text-primary" /> Foto / vídeo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAttachMenu(false); fileRef.current?.click(); }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" /> Ficheiro
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAttachMenu(false); setShowGifPicker((v) => !v); }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    <Smile className="h-4 w-4 text-energy" /> GIF
                  </button>
                </div>
              </>
            )}
            <input ref={imgRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => pickFiles(e, "image")} />
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => pickFiles(e, "file")} />
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doSend();
              }
            }}
            placeholder={placeholder ?? "Mensagem…"}
            className="min-h-[40px] max-h-32 min-w-0 flex-1 resize-none rounded-2xl"
          />

          {canSend ? (
            <Button size="icon" onClick={doSend} className="h-10 w-10 shrink-0 self-center rounded-full">
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              type="button"
              onPointerDown={(e) => { e.preventDefault(); startRec(); }}
              onPointerUp={() => stopRec(false)}
              onPointerLeave={() => recording && stopRec(false)}
              aria-label="Manter premido para gravar"
              className={cn("h-10 w-10 shrink-0 self-center rounded-full bg-primary text-primary-foreground")}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* GIF Picker panel */}
      {showGifPicker && (
        <div className="mt-2 rounded-2xl border border-border bg-popover p-2">
          <div className="mb-2 flex items-center gap-2">
            <input
              type="text"
              value={gifSearch}
              onChange={(e) => setGifSearch(e.target.value)}
              placeholder="Procurar GIF…"
              className="flex-1 rounded-xl bg-secondary px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button type="button" onClick={() => setShowGifPicker(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
            {gifResults
              .filter((url) => !gifSearch || url.toLowerCase().includes(gifSearch.toLowerCase()))
              .map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPending((prev) => [
                      ...prev,
                      {
                        id: `gif-${Date.now()}-${i}`,
                        kind: "image",
                        url,
                        name: `GIF ${i + 1}`,
                      },
                    ]);
                    setShowGifPicker(false);
                  }}
                  className="overflow-hidden rounded-lg aspect-video bg-secondary"
                >
                  <img src={url} alt={`GIF ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}


function AttachmentPreview({ att, onRemove }: { att: ChatAttachment; onRemove: () => void }) {
  return (
    <div className="relative">
      {att.kind === "image" ? (
        <img src={att.url} alt={att.name} className="h-16 w-16 rounded-xl object-cover" />
      ) : att.kind === "audio" ? (
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
          <Mic className="h-4 w-4 text-primary" />
          <span className="text-xs">{att.duration ? fmtTime(att.duration) : "Áudio"}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[140px] truncate text-xs">{att.name}</span>
        </div>
      )}
      <button
        onClick={onRemove}
        type="button"
        aria-label="Remover anexo"
        className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-foreground text-background shadow"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

/** Render de um anexo dentro de uma bolha de chat. */
export function ChatAttachmentBubble({ att }: { att: ChatAttachment }) {
  if (att.kind === "image") {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
        <img src={att.url} alt={att.name} className="max-h-72 w-full max-w-[260px] rounded-xl object-cover" />
      </a>
    );
  }
  if (att.kind === "audio") {
    return <AudioPlayer att={att} />;
  }
  return (
    <a
      href={att.url}
      download={att.name}
      target="_blank"
      rel="noopener noreferrer"
      className="flex max-w-[240px] items-center gap-2 rounded-xl bg-background/30 px-3 py-2 text-xs underline-offset-2 hover:underline"
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{att.name}</span>
    </a>
  );
}

function AudioPlayer({ att }: { att: ChatAttachment }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const dur = att.duration ?? 0;

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) { el.play(); } else { el.pause(); }
  }

  return (
    <div className="flex w-[220px] items-center gap-2">
      <button
        onClick={toggle}
        type="button"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground/10"
        aria-label={playing ? "Pausar" : "Reproduzir"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <div className="flex-1">
        <div className="h-1 overflow-hidden rounded-full bg-foreground/20">
          <div className="h-full bg-foreground/70" style={{ width: dur ? `${(pos / dur) * 100}%` : "0%" }} />
        </div>
        <p className="mt-1 text-[10px] opacity-70">{fmtTime(pos)} / {fmtTime(dur)}</p>
      </div>
      <audio
        ref={audioRef}
        src={att.url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setPos(0); }}
        onTimeUpdate={(e) => setPos((e.target as HTMLAudioElement).currentTime)}
      />
    </div>
  );
}
