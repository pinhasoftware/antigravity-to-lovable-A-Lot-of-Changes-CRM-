import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Perfil local — guarda avatar, nome e dados básicos.
 * O nome do PT é sincronizado a partir do utilizador autenticado (auth.user.user_metadata.full_name).
 */

interface Profile {
  pt: {
    name: string;
    avatarDataUrl: string | null;
  };
  client: {
    name: string;
    avatarDataUrl: string | null;
  };
  brand: {
    enabled: boolean;
    primary: string;
    background: string;
    text: string;
  };
}

const DEFAULT: Profile = {
  pt: { name: "", avatarDataUrl: null },
  client: { name: "", avatarDataUrl: null },
  brand: {
    enabled: false,
    primary: "#BEF264",
    background: "#0A0A0A",
    text: "#FFFFFF",
  },
};

const KEY = "hercles.profile.v1";
const LEGACY_KEY = "fitpilot.profile.v1";

interface Ctx {
  profile: Profile;
  setPTAvatar: (dataUrl: string | null) => void;
  setClientAvatar: (dataUrl: string | null) => void;
  setPTName: (name: string) => void;
  setClientName: (name: string) => void;
  setBrand: (brand: Partial<Profile["brand"]>) => void;
}

const ProfileContext = createContext<Ctx | undefined>(undefined);

function load(): Profile {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT,
      ...parsed,
      pt: { ...DEFAULT.pt, ...(parsed.pt ?? {}) },
      client: { ...DEFAULT.client, ...(parsed.client ?? {}) },
      brand: { ...DEFAULT.brand, ...(parsed.brand ?? {}) },
    };
  } catch {
    return DEFAULT;
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(load);
  const { user, role } = useAuth();

  // Sincroniza o nome a partir do utilizador autenticado.
  useEffect(() => {
    if (!user) return;
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split("@")[0] ??
      "";
    if (!fullName) return;
    setProfile((p) => {
      if (role === "trainer") {
        if (p.pt.name === fullName) return p;
        return { ...p, pt: { ...p.pt, name: fullName } };
      }
      if (role === "client") {
        if (p.client.name === fullName) return p;
        return { ...p, client: { ...p.client, name: fullName } };
      }
      return p;
    });
  }, [user, role]);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch { /* */ }
  }, [profile]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setPTAvatar: (d) => setProfile((p) => ({ ...p, pt: { ...p.pt, avatarDataUrl: d } })),
        setClientAvatar: (d) => setProfile((p) => ({ ...p, client: { ...p.client, avatarDataUrl: d } })),
        setPTName: (n) => setProfile((p) => ({ ...p, pt: { ...p.pt, name: n } })),
        setClientName: (n) => setProfile((p) => ({ ...p, client: { ...p.client, name: n } })),
        setBrand: (b) => setProfile((p) => ({ ...p, brand: { ...p.brand, ...b } })),
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}

/** Helper para converter um File em data-URL (guardamos local sem backend). */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
