import { Outlet, useNavigate } from "react-router-dom";
import { ClientBottomNav } from "./ClientBottomNav";
import { useDemo } from "@/contexts/DemoContext";
import { mockClients } from "@/lib/mocks";

function StudentViewBanner() {
  return null;
}



export function ClientLayout() {
  return (
    <div className="relative mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-gradient-glow" />
      <div
        className="relative flex flex-1 flex-col overflow-y-auto overscroll-none safe-top"
        style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      >
        <Outlet />
      </div>
      {/* Nav is fixed so keyboard does NOT push it up */}
      <ClientBottomNav />
    </div>
  );
}

