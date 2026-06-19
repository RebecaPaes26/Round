const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export type Patient = {
  idPaciente: string;
  nomePaciente: string;
  leito: string;
  unidade: string;
  diagnosticoAtual?: string;
  statusRound?: string;
  evolucaoPaciente?: string;
  metasResumo?: string;
  riscosAtivos?: string;
  alertasAtivos?: string;
  dispositivosResumo?: string;
};

export type Dashboard = {
  totalPacientesAtivos: number;
  indicadores: Record<string, number>;
  gruposAlertas: Array<{ tipo: string; quantidade: number; pacientes: string[] }>;
  participacaoEquipe: Array<{ equipe: string; quantidade: number }>;
};

export type Bootstrap = {
  pacientes: Patient[];
  dashboard: Dashboard;
  unidades: string[];
  diagnostico: Record<string, unknown>;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

export async function getBootstrap() {
  return request<Bootstrap>('/bootstrap');
}

export async function startRound(idPaciente: string) {
  return request('/rounds/start', {
    method: 'POST',
    body: JSON.stringify({ idPaciente, equipesPresentes: [] }),
  });
}
