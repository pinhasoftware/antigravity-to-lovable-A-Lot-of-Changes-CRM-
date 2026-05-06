import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Tab = "Calendário" | "Todos" | "Presencial" | "Consultoria" | "Atenção";

export type CRMTab = "Todos" | "Ativos" | "Pausados" | "Prospetos" | "Ex-clientes";
export interface CRMFilters {
  service: "all" | "presencial" | "consultoria" | "online";
  payment: "all" | "em_dia" | "em_falta";
  attendance: "all" | "below_60" | "above_60";
  tag: string;
}

interface PTUIState {
  clientsTab: Tab;
  setClientsTab: (t: Tab) => void;
  lastClientId: string | null;
  setLastClientId: (id: string | null) => void;
  crmTab: CRMTab;
  setCrmTab: (t: CRMTab) => void;
  crmFilters: CRMFilters;
  setCrmFilters: (f: CRMFilters) => void;
  /** Returns the route to land on when re-entering the Clients tab. */
  resolveClientsRoute: () => string;
}

const PTUIContext = createContext<PTUIState | undefined>(undefined);

const KEY_TAB = "fitpilot.pt.clientsTab";
const KEY_LAST = "fitpilot.pt.lastClientId";
const KEY_CRM_TAB = "fitpilot.pt.crmTab";
const KEY_CRM_FILTERS = "fitpilot.pt.crmFilters";

const DEFAULT_CRM_FILTERS: CRMFilters = {
  service: "all",
  payment: "all",
  attendance: "all",
  tag: "",
};

export function PTUIProvider({ children }: { children: ReactNode }) {
  // sessionStorage: persiste enquanto a app está aberta, reseta ao fechar.
  const [clientsTab, setTabState] = useState<Tab>(() => {
    if (typeof window === "undefined") return "Calendário";
    return (sessionStorage.getItem(KEY_TAB) as Tab | null) ?? "Calendário";
  });
  const [lastClientId, setLastIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(KEY_LAST);
  });
  const [crmTab, setCrmTabState] = useState<CRMTab>(() => {
    if (typeof window === "undefined") return "Todos";
    return (sessionStorage.getItem(KEY_CRM_TAB) as CRMTab | null) ?? "Todos";
  });
  const [crmFilters, setCrmFiltersState] = useState<CRMFilters>(() => {
    if (typeof window === "undefined") return DEFAULT_CRM_FILTERS;
    const stored = sessionStorage.getItem(KEY_CRM_FILTERS);
    return stored ? JSON.parse(stored) : DEFAULT_CRM_FILTERS;
  });

  useEffect(() => {
    sessionStorage.setItem(KEY_TAB, clientsTab);
  }, [clientsTab]);

  useEffect(() => {
    if (lastClientId) sessionStorage.setItem(KEY_LAST, lastClientId);
    else sessionStorage.removeItem(KEY_LAST);
  }, [lastClientId]);

  useEffect(() => {
    sessionStorage.setItem(KEY_CRM_TAB, crmTab);
  }, [crmTab]);

  useEffect(() => {
    sessionStorage.setItem(KEY_CRM_FILTERS, JSON.stringify(crmFilters));
  }, [crmFilters]);

  function resolveClientsRoute() {
    if (lastClientId) return `/pt/clients/${lastClientId}`;
    return "/pt/clients";
  }

  return (
    <PTUIContext.Provider
      value={{
        clientsTab,
        setClientsTab: setTabState,
        lastClientId,
        setLastClientId: setLastIdState,
        crmTab,
        setCrmTab: setCrmTabState,
        crmFilters,
        setCrmFilters: setCrmFiltersState,
        resolveClientsRoute,
      }}
    >
      {children}
    </PTUIContext.Provider>
  );
}

export function usePTUI() {
  const ctx = useContext(PTUIContext);
  if (!ctx) throw new Error("usePTUI must be used within PTUIProvider");
  return ctx;
}
