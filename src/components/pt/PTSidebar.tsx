import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, Sparkles, MessageCircle, BarChart3, Settings as SettingsIcon, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePTUI } from "@/contexts/PTUIContext";
import { mockChats, overduePayments } from "@/lib/mocks";
import { useProfile } from "@/contexts/ProfileContext";
import { UserAvatar } from "@/components/UserAvatar";
import herclesLogo from "@/assets/hercles-logo.png";

export function PTSidebar() {
  const { pathname } = useLocation();
  const { resolveClientsRoute } = usePTUI();
  const { profile } = useProfile();
  const unread = mockChats.filter((m) => m.sender_role === "client" && !m.read).length;
  const overdue = overduePayments().length;

  const tabs = [
    { to: "/pt", label: "Home", icon: Home, end: true, match: "/pt", badge: 0 },
    { to: resolveClientsRoute(), label: "Clientes", icon: Users, match: "/pt/clients", badge: 0 },
    { to: "/pt/ai", label: "Hercles AI", icon: Sparkles, accent: true, match: "/pt/ai", badge: 0 },
    { to: "/pt/chat", label: "Chat", icon: MessageCircle, match: "/pt/chat", badge: unread },
    { to: "/pt/business", label: "Faturação", icon: BarChart3, match: "/pt/business", badge: overdue },
    { to: "/pt/crm", label: "CRM", icon: Briefcase, match: "/pt/crm", badge: 0 },
  ];

  return (
    <aside className="hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-border/60 bg-background/95 backdrop-blur-xl md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-background border border-border/40 shadow-sm overflow-hidden">
          <img src={herclesLogo} alt="H" className="h-6 w-auto" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight">Hercles</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trainer</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {tabs.map(({ to, label, icon: Icon, end, accent, match, badge }) => {
            const active = end ? pathname === match : pathname.startsWith(match);
            return (
              <li key={label}>
                <NavLink
                  to={to}
                  end={end}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? accent
                        ? "bg-accent/15 text-accent"
                        : "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.5 : 2} />
                  <span className="flex-1">{label}</span>
                  {badge > 0 && (
                    <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                      {badge}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border/60 p-3">
        <NavLink
          to="/pt/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl p-2 transition-colors",
              isActive ? "bg-secondary" : "hover:bg-secondary/60",
            )
          }
        >
          <UserAvatar name={profile.pt.name || "PT"} src={profile.pt.avatarDataUrl} size="sm" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs font-semibold">{profile.pt.name || "Treinador"}</p>
            <p className="text-[10px] text-muted-foreground">Definições</p>
          </div>
          <SettingsIcon className="h-4 w-4 text-muted-foreground" />
        </NavLink>
      </div>
    </aside>
  );
}
