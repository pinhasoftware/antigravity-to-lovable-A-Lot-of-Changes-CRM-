// Centralized mock data for visual demo (no backend).
import { addDays, addHours, setHours, startOfWeek } from "date-fns";

export type DemoRole = "trainer" | "client";

export interface MockClient {
  id: string;
  full_name: string;
  avatar_url: string | null;
  type: "presencial" | "consultoria" | "online";
  status: "ativo" | "pausado" | "prospeto" | "ex_cliente" | "atencao" | "inativo";
  attendance_pct: number;
  monthly_value: number | null;
  session_value: number | null;
  start_date: string;
  goals: string;
  injuries: string;
  notes: string;
  source?: "referencia" | "instagram" | "google" | "outro";
  tags?: string[];
  next_step?: "aguardar_resposta" | "sessao_agendada" | "proposta_enviada" | "sem_resposta";
  quick_notes?: { text: string; timestamp: string }[];
}

export interface MockSession {
  id: string;
  client_id: string;
  scheduled_at: string;
  duration_min: number;
  type: "presencial" | "consultoria";
  status: "agendado" | "em_curso" | "concluido" | "atencao" | "faltou";
  paid: boolean;
}

export interface MockChatAttachment {
  id: string;
  kind: "image" | "file" | "audio";
  url: string;
  name: string;
  duration?: number;
  size?: number;
  mime?: string;
}

export interface MockChatMessage {
  id: string;
  client_id: string;
  sender_role: "trainer" | "client";
  content: string;
  created_at: string;
  read: boolean;
  attachments?: MockChatAttachment[];
}

export type ExerciseMode = "reps" | "time";

export interface MockExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight_kg: number | null;
  rest_s: number;
  group?: string; // "A" for superset A — exercises with same group letter run alternated
  video_url?: string;
  mode?: ExerciseMode; // "time" for plank/static holds; default "reps"
  duration_s?: number; // when mode === "time"
}

export interface MockWorkout {
  id: string;
  client_id: string;
  name: string;
  day: string; // "Segunda", "Quarta"...
  exercises: MockExercise[];
}

export interface MockMeal {
  id: string;
  time: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  items: string[];
}

const today = new Date();
const monday = startOfWeek(today, { weekStartsOn: 1 });

export const mockClients: MockClient[] = [
  {
    id: "c1",
    full_name: "Ana Silva",
    avatar_url: null,
    type: "presencial",
    status: "ativo",
    attendance_pct: 92,
    monthly_value: null,
    session_value: 30,
    start_date: addDays(today, -120).toISOString().slice(0, 10),
    goals: "Perder 5 kg até ao verão",
    injuries: "Tendinite ombro direito (resolvida)",
    notes: "Muito motivada. Prefere treinos curtos e intensos.",
    source: "instagram",
    tags: ["dedicada", "focada"],
    quick_notes: [{ text: "Fazer avaliação próxima semana", timestamp: new Date().toISOString() }],
  },
  {
    id: "c2",
    full_name: "João Santos",
    avatar_url: null,
    type: "consultoria",
    status: "ativo",
    attendance_pct: 78,
    monthly_value: 75,
    session_value: null,
    start_date: addDays(today, -60).toISOString().slice(0, 10),
    goals: "Ganho de massa muscular (hipertrofia geral)",
    injuries: "Nenhuma",
    notes: "Treina em casa 4×/semana com halteres ajustáveis.",
    source: "referencia",
    tags: ["hipertrofia", "home-workout"],
  },
  {
    id: "c3",
    full_name: "Mariana Costa",
    avatar_url: null,
    type: "presencial",
    status: "atencao",
    attendance_pct: 41,
    monthly_value: null,
    session_value: 35,
    start_date: addDays(today, -200).toISOString().slice(0, 10),
    goals: "Reabilitação pós-parto",
    injuries: "Diástase abdominal ligeira",
    notes: "Faltou às últimas 2 sessões. Contactar.",
    source: "google",
    tags: ["pós-parto"],
  },
  {
    id: "c4",
    full_name: "Rui Costa",
    avatar_url: null,
    type: "online",
    status: "prospeto",
    attendance_pct: 0,
    monthly_value: 0,
    session_value: null,
    start_date: today.toISOString().slice(0, 10),
    goals: "Perda de peso",
    injuries: "Nenhuma",
    notes: "",
    source: "instagram",
    tags: ["indeciso"],
    next_step: "aguardar_resposta",
  },
  {
    id: "c5",
    full_name: "Tiago Mendes",
    avatar_url: null,
    type: "presencial",
    status: "pausado",
    attendance_pct: 40,
    monthly_value: null,
    session_value: 30,
    start_date: addDays(today, -300).toISOString().slice(0, 10),
    goals: "Manutenção",
    injuries: "Entorse no tornozelo",
    notes: "Pausado por 1 mês devido a lesão no futebol.",
    source: "referencia",
    tags: ["lesionado", "futebol"],
  },
];

export type PaymentFrequency = "antes_aula" | "depois_aula" | "semanal_segunda" | "mensal_ultimo_dia" | "mensal_dia_1";

export interface MockPayment {
  id: string;
  client_id: string;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
}

export const PAYMENT_FREQUENCY_LABEL: Record<PaymentFrequency, string> = {
  antes_aula: "Antes de cada aula",
  depois_aula: "Depois de cada aula",
  semanal_segunda: "Semanal — todas as segundas",
  mensal_ultimo_dia: "Mensal — último dia do mês",
  mensal_dia_1: "Mensal — dia 1 do mês",
};

export const mockPayments: MockPayment[] = [
  { id: "p1", client_id: "c2", amount: 75, due_date: addDays(today, -2).toISOString().slice(0, 10), paid: false, paid_at: null },
  { id: "p2", client_id: "c3", amount: 35, due_date: addDays(today, -5).toISOString().slice(0, 10), paid: false, paid_at: null },
  { id: "p3", client_id: "c1", amount: 30, due_date: addDays(today, 1).toISOString().slice(0, 10), paid: false, paid_at: null },
];

export const overduePayments = () => mockPayments.filter((p) => !p.paid && new Date(p.due_date) < new Date());

export const clientById = (id: string) => mockClients.find((c) => c.id === id);

// Sessions: 3 today + spread across week
export const mockSessions: MockSession[] = [
  { id: "s1", client_id: "c1", scheduled_at: setHours(today, 9).toISOString(), duration_min: 60, type: "presencial", status: "concluido", paid: true },
  { id: "s2", client_id: "c3", scheduled_at: setHours(today, 11).toISOString(), duration_min: 60, type: "presencial", status: "em_curso", paid: false },
  { id: "s3", client_id: "c2", scheduled_at: setHours(today, 18).toISOString(), duration_min: 45, type: "consultoria", status: "agendado", paid: false },
  { id: "s4", client_id: "c1", scheduled_at: setHours(addDays(monday, 1), 10).toISOString(), duration_min: 60, type: "presencial", status: "agendado", paid: false },
  { id: "s5", client_id: "c1", scheduled_at: setHours(addDays(monday, 3), 10).toISOString(), duration_min: 60, type: "presencial", status: "agendado", paid: false },
  { id: "s6", client_id: "c3", scheduled_at: setHours(addDays(monday, 4), 17).toISOString(), duration_min: 60, type: "presencial", status: "agendado", paid: false },
  // Last week (concluído, pago) — for revenue chart
  { id: "s7", client_id: "c1", scheduled_at: setHours(addDays(monday, -6), 10).toISOString(), duration_min: 60, type: "presencial", status: "concluido", paid: true },
  { id: "s8", client_id: "c1", scheduled_at: setHours(addDays(monday, -4), 10).toISOString(), duration_min: 60, type: "presencial", status: "concluido", paid: true },
  { id: "s9", client_id: "c3", scheduled_at: setHours(addDays(monday, -3), 17).toISOString(), duration_min: 60, type: "presencial", status: "concluido", paid: true },
];

export const mockChats: MockChatMessage[] = [
  { id: "m1", client_id: "c1", sender_role: "client", content: "Bom dia! Posso passar a sessão de quinta para sexta?", created_at: addHours(today, -2).toISOString(), read: true },
  { id: "m2", client_id: "c1", sender_role: "trainer", content: "Bom dia Ana! Sim, sem problema. 10h serve?", created_at: addHours(today, -1.5).toISOString(), read: true },
  { id: "m3", client_id: "c1", sender_role: "client", content: "Perfeito 💪", created_at: addHours(today, -1).toISOString(), read: false },
  { id: "m4", client_id: "c2", sender_role: "client", content: "Posso fazer cardio em vez de pernas hoje? Estou com DOMS forte.", created_at: addHours(today, -5).toISOString(), read: false },
  { id: "m5", client_id: "c3", sender_role: "trainer", content: "Olá Mariana, está tudo bem? Não te vi nas últimas sessões.", created_at: addHours(today, -26).toISOString(), read: true },
];

// Public domain demo video used for all exercises until real videos are uploaded by the PT.
const DEMO_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export const mockWorkouts: MockWorkout[] = [
  {
    id: "w1",
    client_id: "c1",
    name: "Full Body A",
    day: "Segunda",
    exercises: [
      { id: "e1", name: "Agachamento", sets: 4, reps: "8-10", weight_kg: 50, rest_s: 90, video_url: DEMO_VIDEO },
      { id: "e2", name: "Supino plano", sets: 4, reps: "8-10", weight_kg: 35, rest_s: 90, group: "A", video_url: DEMO_VIDEO },
      { id: "e3", name: "Remada curvada", sets: 4, reps: "10", weight_kg: 30, rest_s: 90, group: "A", video_url: DEMO_VIDEO },
      { id: "e4", name: "Prancha", sets: 3, reps: "—", weight_kg: null, rest_s: 45, mode: "time", duration_s: 45, video_url: DEMO_VIDEO },
    ],
  },
  {
    id: "w2",
    client_id: "c1",
    name: "Full Body B",
    day: "Quarta",
    exercises: [
      { id: "e5", name: "Peso morto romeno", sets: 4, reps: "8", weight_kg: 60, rest_s: 120, video_url: DEMO_VIDEO },
      { id: "e6", name: "Press militar", sets: 3, reps: "10", weight_kg: 20, rest_s: 75, video_url: DEMO_VIDEO },
      { id: "e7", name: "Lunges", sets: 3, reps: "12 cada", weight_kg: 12, rest_s: 60, video_url: DEMO_VIDEO },
    ],
  },
];

export const mockMeals: MockMeal[] = [
  { id: "n1", time: "08:00", name: "Pequeno-almoço", kcal: 480, protein: 32, carbs: 55, fat: 14, items: ["Aveia 60g", "Whey 30g", "Banana", "Manteiga amendoim 15g"] },
  { id: "n2", time: "13:00", name: "Almoço", kcal: 650, protein: 45, carbs: 70, fat: 18, items: ["Frango 180g", "Arroz integral 100g", "Salada", "Azeite 10g"] },
  { id: "n3", time: "17:00", name: "Lanche", kcal: 280, protein: 25, carbs: 25, fat: 8, items: ["Iogurte grego 200g", "Frutos vermelhos", "Granola 20g"] },
  { id: "n4", time: "20:30", name: "Jantar", kcal: 590, protein: 42, carbs: 50, fat: 20, items: ["Salmão 160g", "Batata doce 200g", "Brócolos"] },
];

// Client app: streak + weekly progress
export const mockClientStats = {
  streak_days: 12,
  workouts_this_week: 3,
  workouts_target: 4,
  weight_history: [
    { week: "S1", kg: 78.4 },
    { week: "S2", kg: 78.0 },
    { week: "S3", kg: 77.5 },
    { week: "S4", kg: 77.1 },
    { week: "S5", kg: 76.8 },
    { week: "S6", kg: 76.3 },
  ],
  volume_history: [
    { week: "S1", tons: 8.2 },
    { week: "S2", tons: 9.1 },
    { week: "S3", tons: 9.8 },
    { week: "S4", tons: 10.4 },
    { week: "S5", tons: 11.0 },
    { week: "S6", tons: 11.6 },
  ],
};
