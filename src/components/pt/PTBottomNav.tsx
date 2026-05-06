import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, Sparkles, MessageCircle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePTUI } from "@/contexts/PTUIContext";
import { mockChats, overduePayments } from "@/lib/mocks";

export function PTBottomNav() {
  const { pathname } = useLocation();
  const { resolveClientsRoute } = usePTUI();
  const unreadThreads = new Set(mockChats.filter((m) => m.sender_role === "client" && !m.read).map((m) => m.client_id)).size;
  const overdue = overduePayments().length;

  const tabs = [
    { to: "/pt", label: "Home", icon: Home, end: true, match: "/pt", badge: 0 },
    { to: resolveClientsRoute(), label: "Clientes", icon: Users, match: "/pt/clients", badge: 0 },
    { to: "/pt/ai", label: "AI", icon: Sparkles, accent: true, match: "/pt/ai", badge: 0 },
    { to: "/pt/chat", label: "Chat", icon: MessageCircle, match: "/pt/chat", badge: unreadThreads },
    { to: "/pt/business", label: "Faturação", icon: BarChart3, match: "/pt/business", badge: overdue },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto max-w-md safe-bottom">
        <ul className="grid grid-cols-5">
          {tabs.map(({ to, label, icon: Icon, end, accent, match, badge }) => {
            const active = end ? pathname === match : pathname.startsWith(match);
            return (
              <li key={label}>
                <NavLink
                  to={to}
                  end={end}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                    active ? (accent ? "text-accent" : "text-primary") : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div className={cn("relative grid h-7 w-7 place-items-center", active && accent && "drop-shadow-[0_0_8px_hsl(var(--accent))]", active && !accent && "drop-shadow-[0_0_8px_hsl(var(--primary))]")}>
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                    {badge > 0 && (
                      <span className="absolute -right-1.5 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span>{label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
