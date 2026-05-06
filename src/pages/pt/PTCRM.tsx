import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Plus, Filter, MoreHorizontal, MessageCircle, 
  CheckCircle, FileText, UserCircle, Link as LinkIcon, Trash2,
  ArrowUpDown, X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt as ptLocale } from "date-fns/locale";
import { usePTUI, type CRMTab, type CRMFilters } from "@/contexts/PTUIContext";
import { mockClients, mockSessions, mockPayments } from "@/lib/mocks";
import { fmtEUR } from "@/lib/format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/UserAvatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TABS: { id: CRMTab; label: string }[] = [
  { id: "Todos", label: "Todos" },
  { id: "Ativos", label: "Ativos" },
  { id: "Pausados", label: "Pausados" },
  { id: "Prospetos", label: "Prospetos" },
  { id: "Ex-clientes", label: "Ex-clientes" },
];

export default function PTCRM() {
  const navigate = useNavigate();
  const { crmTab, setCrmTab, crmFilters, setCrmFilters } = usePTUI();
  const [search, setSearch] = useState("");
  
  // Mobile orientation handling
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && screen.orientation && screen.orientation.lock) {
      screen.orientation.lock("landscape").catch(() => {
        // Silently ignore if not supported or denied
      });
    }
    return () => {
      if (isMobile && screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
  }, []);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  const filteredClients = useMemo(() => {
    return mockClients.filter(client => {
      // 1. Tab filter
      if (crmTab === "Ativos" && client.status !== "ativo") return false;
      if (crmTab === "Pausados" && client.status !== "pausado") return false;
      if (crmTab === "Prospetos" && client.status !== "prospeto") return false;
      if (crmTab === "Ex-clientes" && client.status !== "ex_cliente") return false;

      // 2. Search
      if (search && !client.full_name.toLowerCase().includes(search.toLowerCase())) return false;

      // 3. Filters
      if (crmFilters.service !== "all" && client.type !== crmFilters.service) return false;
      if (crmFilters.attendance === "below_60" && client.attendance_pct >= 60) return false;
      if (crmFilters.attendance === "above_60" && client.attendance_pct < 60) return false;
      if (crmFilters.tag && !client.tags?.includes(crmFilters.tag)) return false;

      // Payment filter is slightly more complex, depending on mockPayments
      if (crmFilters.payment !== "all") {
        const hasOverdue = mockPayments.some(p => p.client_id === client.id && !p.paid && new Date(p.due_date) < new Date());
        if (crmFilters.payment === "em_falta" && !hasOverdue) return false;
        if (crmFilters.payment === "em_dia" && hasOverdue) return false;
      }

      return true;
    }).sort((a, b) => {
      if (!sortConfig) return 0;
      let valA: any = a[sortConfig.key as keyof typeof a];
      let valB: any = b[sortConfig.key as keyof typeof b];

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [crmTab, crmFilters, search, sortConfig]);

  const allTags = Array.from(new Set(mockClients.flatMap(c => c.tags || [])));

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background md:static md:z-auto md:h-full md:bg-transparent">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 p-4 md:px-0 md:pt-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate(-1)}>
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
        </div>
        <Button onClick={() => navigate("/pt/clients/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Adicionar contacto</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex shrink-0 flex-col gap-4 border-b border-border/60 p-4 md:px-0">
          <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-hide">
            <Tabs value={crmTab} onValueChange={(v) => setCrmTab(v as CRMTab)}>
              <TabsList className="bg-secondary/60">
                {TABS.map(t => (
                  <TabsTrigger key={t.id} value={t.id} className="text-xs sm:text-sm">{t.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar por nome..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" /> Filtros
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Serviço</p>
                  <select 
                    className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={crmFilters.service}
                    onChange={(e) => setCrmFilters({ ...crmFilters, service: e.target.value as any })}
                  >
                    <option value="all">Todos</option>
                    <option value="presencial">Presencial</option>
                    <option value="consultoria">Consultoria</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div className="p-2">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Pagamento</p>
                  <select 
                    className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={crmFilters.payment}
                    onChange={(e) => setCrmFilters({ ...crmFilters, payment: e.target.value as any })}
                  >
                    <option value="all">Todos</option>
                    <option value="em_dia">Em dia</option>
                    <option value="em_falta">Em falta</option>
                  </select>
                </div>
                <div className="p-2">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Assiduidade</p>
                  <select 
                    className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={crmFilters.attendance}
                    onChange={(e) => setCrmFilters({ ...crmFilters, attendance: e.target.value as any })}
                  >
                    <option value="all">Todos</option>
                    <option value="above_60">Acima de 60%</option>
                    <option value="below_60">Abaixo de 60%</option>
                  </select>
                </div>
                {allTags.length > 0 && (
                  <div className="p-2">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Tag</p>
                    <select 
                      className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={crmFilters.tag}
                      onChange={(e) => setCrmFilters({ ...crmFilters, tag: e.target.value })}
                    >
                      <option value="">Todas as tags</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="p-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setCrmFilters({ service: "all", payment: "all", attendance: "all", tag: "" })}
                  >
                    Limpar filtros
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto p-4 md:px-0">
          <div className="min-w-[1200px] rounded-xl border border-border/60 bg-secondary/20">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-border/60 text-muted-foreground">
                  <Th label="Nome" sortKey="full_name" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Serviço" sortKey="type" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Valor" sortKey="monthly_value" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Assiduidade" sortKey="attendance_pct" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Último Treino" />
                  <Th label="Pagamento" />
                  <Th label="Tempo como cliente" />
                  <Th label="Origem" sortKey="source" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Tags" />
                  {crmTab === "Prospetos" && <Th label="Próximo Passo" sortKey="next_step" currentSort={sortConfig} onSort={handleSort} />}
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredClients.map(client => {
                  const hasOverdue = mockPayments.some(p => p.client_id === client.id && !p.paid && new Date(p.due_date) < new Date());
                  const overdueDays = hasOverdue ? Math.floor((Date.now() - new Date(mockPayments.find(p => p.client_id === client.id && !p.paid)!.due_date).getTime()) / 86400000) : 0;
                  const timeAsClient = client.start_date ? Math.floor((Date.now() - new Date(client.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
                  
                  // Mock random last workout time for demonstration
                  const lastWorkoutDays = Math.floor(Math.random() * 10) + 1;

                  return (
                    <tr key={client.id} className="group hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={client.full_name} src={client.avatar_url} size="sm" />
                          <span className="font-semibold">{client.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize">{client.type}</td>
                      <td className="px-4 py-3">
                        {client.monthly_value ? fmtEUR(client.monthly_value) + "/mês" : client.session_value ? fmtEUR(client.session_value) + "/sessão" : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                            <div 
                              className={cn("h-full rounded-full", client.attendance_pct >= 80 ? "bg-primary" : client.attendance_pct >= 50 ? "bg-yellow-500" : "bg-destructive")}
                              style={{ width: `${client.attendance_pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{client.attendance_pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        há {lastWorkoutDays} dias
                      </td>
                      <td className="px-4 py-3">
                        {hasOverdue ? (
                          <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                            Em falta — {overdueDays} dias
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                            Em dia
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {timeAsClient > 0 ? `${timeAsClient} meses` : "Novo"}
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{client.source || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {client.tags?.map(tag => (
                            <span key={tag} className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      {crmTab === "Prospetos" && (
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {client.next_step?.replace(/_/g, " ") || "—"}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <ClientActions client={client} />
                      </td>
                    </tr>
                  );
                })}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({ label, sortKey, currentSort, onSort }: { label: string; sortKey?: string; currentSort?: any; onSort?: (k: string) => void }) {
  if (!sortKey) return <th className="px-4 py-3 font-medium">{label}</th>;
  const isActive = currentSort?.key === sortKey;
  return (
    <th 
      className="cursor-pointer select-none px-4 py-3 font-medium transition-colors hover:text-foreground"
      onClick={() => onSort?.(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={cn("h-3 w-3", isActive ? "text-primary" : "text-muted-foreground/50")} />
      </div>
    </th>
  );
}

function ClientActions({ client }: { client: any }) {
  const navigate = useNavigate();
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://hercles.app/invite/${client.id}`);
    toast.success("Link de convite copiado");
  };

  const handleMarkPaid = () => {
    toast.success("Pagamento marcado como pago");
  };

  const handleSaveNote = () => {
    toast.success("Nota adicionada ao histórico");
    setNoteOpen(false);
    setNoteText("");
  };

  const handleDelete = () => {
    if (confirm("Tem a certeza que deseja eliminar este contacto?")) {
      toast.success("Contacto eliminado");
    }
  };

  const handleChangeStatus = (newStatus: string) => {
    toast.success(`Estado alterado para ${newStatus}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate(`/pt/chat/${client.id}`)}>
            <MessageCircle className="mr-2 h-4 w-4" /> Mensagem
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`/pt/clients/${client.id}`)}>
            <UserCircle className="mr-2 h-4 w-4" /> Ver perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleMarkPaid}>
            <CheckCircle className="mr-2 h-4 w-4" /> Marcar como pago
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setNoteOpen(true)}>
            <FileText className="mr-2 h-4 w-4" /> Adicionar nota
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            <LinkIcon className="mr-2 h-4 w-4" /> Copiar convite
          </DropdownMenuItem>
          
          <div className="my-1 h-px bg-border/60" />
          
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Mudar estado</div>
          <DropdownMenuItem onClick={() => handleChangeStatus("ativo")}>Ativo</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleChangeStatus("pausado")}>Pausado</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleChangeStatus("prospeto")}>Prospeto</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleChangeStatus("ex_cliente")}>Ex-cliente</DropdownMenuItem>

          <div className="my-1 h-px bg-border/60" />
          
          <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar contacto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar nota rápida</DialogTitle>
          </DialogHeader>
          <textarea
            className="min-h-[100px] w-full resize-none rounded-xl border border-input bg-transparent p-3 text-sm outline-none focus:ring-1 focus:ring-primary"
            placeholder="Ex: Ligou a dizer que..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveNote} disabled={!noteText.trim()}>Guardar nota</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
