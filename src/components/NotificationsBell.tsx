import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface NotificationItem {
  id: string;
  icon: React.ElementType;
  text: string;
  /** Route path. Use a hash to auto-open a settings sub-section, e.g. "/pt/settings#seguranca". */
  to?: string;
  unread?: boolean;
}

interface Props {
  items: NotificationItem[];
  align?: "left" | "right";
  /** Unique key to persist the "cleared" state between reloads. */
  storageKey?: string;
}

/**
 * Sino de notificações minimalista.
 * Suporta limpar todas as notificações (com confirmação) — o estado fica persistido em localStorage.
 */
export function NotificationsBell({ items, align = "right", storageKey = "fitpilot.notifications.cleared" }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [clearedIds, setClearedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey + ".read");
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });
  const navigate = useNavigate();

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(Array.from(clearedIds))); } catch { /* noop */ }
  }, [clearedIds, storageKey]);

  useEffect(() => {
    try { localStorage.setItem(storageKey + ".read", JSON.stringify(Array.from(readIds))); } catch { /* noop */ }
  }, [readIds, storageKey]);

  const visible = useMemo(() => items.filter((n) => !clearedIds.has(n.id)).map(n => ({
    ...n,
    unread: n.unread && !readIds.has(n.id)
  })), [items, clearedIds, readIds]);
  const unreadCount = visible.filter((n) => n.unread).length;

  function go(to?: string) {
    setOpen(false);
    if (to) navigate(to);
  }

  function clearAll() {
    setClearedIds(new Set(items.map((n) => n.id)));
    setConfirmOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 place-items-center rounded-xl bg-secondary"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={cn(
              "z-50 overflow-hidden rounded-2xl border border-border bg-popover shadow-card",
              "fixed left-1/2 top-20 w-[92vw] max-w-sm -translate-x-1/2",
              "sm:absolute sm:top-12 sm:left-auto sm:translate-x-0 sm:w-[88vw]",
              align === "right" ? "sm:right-0" : "sm:left-0",
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-bold">Notificações</p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{unreadCount} novas</span>
                {visible.length > 0 && (
                  <button
                    onClick={() => setConfirmOpen(true)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Limpar todas"
                    title="Limpar todas"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
              {visible.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-muted-foreground">Sem novidades.</li>
              )}
              {visible.map((n) => {
                const Icon = n.icon;
                const isRevealed = revealedId === n.id;
                const inner = (
                  <div className="flex items-start gap-3 px-4 py-3 text-left">
                    <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className={cn("flex-1 text-xs leading-snug", n.unread ? "font-semibold text-foreground" : "text-muted-foreground")}>
                      {n.text}
                    </p>
                    {n.unread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  </div>
                );
                return (
                  <li key={n.id} className="relative overflow-hidden">
                    {n.to ? (
                      <>
                        <button
                          onClick={() => {
                            setRevealedId(isRevealed ? null : n.id);
                            if (n.unread && !isRevealed) {
                              setReadIds(prev => new Set(prev).add(n.id));
                            }
                          }}
                          className={cn(
                            "block w-full transition-transform duration-200 hover:bg-secondary/40",
                            isRevealed && "-translate-x-16",
                          )}
                        >
                          {inner}
                        </button>
                        <button
                          onClick={() => go(n.to)}
                          className={cn(
                            "absolute right-0 top-0 flex h-full w-16 items-center justify-center bg-primary text-xs font-bold text-primary-foreground transition-transform duration-200",
                            isRevealed ? "translate-x-0" : "translate-x-full",
                          )}
                          aria-label="Ir"
                        >
                          Ir →
                        </button>
                      </>
                    ) : (
                      <div>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todas as notificações?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove todas as notificações actuais. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={clearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Apagar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
