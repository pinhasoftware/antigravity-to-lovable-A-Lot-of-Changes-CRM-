import { Outlet, useNavigate } from "react-router-dom";
import { ClientBottomNav } from "./ClientBottomNav";
import { useDemo } from "@/contexts/DemoContext";
import { mockClients } from "@/lib/mocks";

function StudentViewBanner() {
  const { role, setRole } = useDemo();
  const navigate = useNavigate();
  const clientId = localStorage.getItem("hercles.studentView.clientId");
  const client = mockClients.find((c) => c.id === clientId);

  // Only show when PT is previewing as a client
  // We detect this by checking if there's a stored clientId
  if (!clientId || !client) return null;

  function exitStudentView() {
    localStorage.removeItem("hercles.studentView.clientId");
    setRole("trainer");
    navigate("/pt", { replace: true });
  }

  return (
    <button
      onClick={exitStudentView}
      className="sticky top-0 z-[999] flex w-full items-center justify-center gap-2 bg-accent px-4 py-4 text-sm font-bold text-accent-foreground shadow-lg animate-pulse-glow"
      style={{ minHeight: "56px" }}
    >
      <span>👁️</span>
      <span className="text-center">
        Estás a ver como <strong>{client.full_name}</strong> — Carrega aqui para sair
      </span>
      <span>✕</span>
    </button>
  );
}

export function ClientLayout() {
  return (
    <div className="relative mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-gradient-glow" />
      <div
        className="relative flex flex-1 flex-col overflow-y-auto overscroll-none safe-top"
        style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      >
        <StudentViewBanner />
        <Outlet />
      </div>
      {/* Nav is fixed so keyboard does NOT push it up */}
      <ClientBottomNav />
    </div>
  );
}

