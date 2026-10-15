const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export type Patient = {
  idPaciente: string;
  prontuario?: string;
  nomePaciente: string;
  dataNascimento?: string;
  leito: string;
  unidade: string;
  idade?: number;
  motivoInternacao?: string;
  diagnosticoAtual?: string;
  diasInternacao?: number;
  tempoVMDias?: number;
  previsaoAlta?: string;
  statusRound?: string;
  evolucaoPaciente?: string;
  problemaAtivoPrincipal?: string;
  barreirasAlta?: string;
  metasResumo?: string;
  metasPendentesAnterioresResumo?: string;
  metasProximas24hResumo?: string;
  pendenciasResumo?: string;
  riscosAtivos?: string;
  alertasAtivos?: string;
  alertasAbertos?: number;
  maiorGravidadeAlerta?: string;
  alertasDetalhes?: Array<Record<string, any>>;
  dispositivosResumo?: string;
};

export type PatientDetail = Patient & {
  rounds: Array<Record<string, any>>;
  metas: Array<Record<string, any>>;
  alertas: Array<Record<string, any>>;
  dispositivos: Array<Record<string, any>>;
};

export type Dashboard = {
  totalPacientesAtivos: number;
  pacienteDiaElegivel?: number;
  periodo?: { inicio: string; fim: string; unidade: string };
  indicadores: Record<string, any>;
  gruposAlertas: Array<{ tipo: string; quantidade: number; pacientes: string[] }>;
  participacaoEquipe: Array<{ equipe: string; quantidade: number }>;
};

export type Bootstrap = {
  pacientes: Patient[];
  alertas?: Array<Record<string, any>>;
  dashboard: Dashboard;
  unidades: string[];
  diagnostico: Record<string, unknown>;
};

export type RoundPayload = {
  paciente?: Patient;
  round?: Record<string, any>;
  metas: Array<Record<string, any>>;
  metasAnteriores: Array<Record<string, any>>;
  bundle: Record<string, any>;
  infeccao: Array<Record<string, any>>;
  assistencia: Record<string, any>;
  riscos: Record<string, any>;
  dispositivos: Array<Record<string, any>>;
  lesoes: Array<Record<string, any>>;
  prefill?: Record<string, any>;
  metadata?: Record<string, any>;
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

export async function getDashboard(query: Record<string, string> = {}) {
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value));
  return request<Dashboard>(`/dashboard${params.size ? `?${params}` : ''}`);
}

export async function getDeviceControl(query: Record<string, string> = {}) {
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value));
  return request<Record<string, any>>(`/devices/control${params.size ? `?${params}` : ''}`);
}

export async function getPatient(idPaciente: string) {
  return request<PatientDetail>(`/patients/${encodeURIComponent(idPaciente)}`);
}

export async function getHistory(query: Record<string, string> = {}) {
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value));
  return request<Array<Record<string, any>>>(`/history${params.size ? `?${params}` : ''}`);
}

export async function getDailyReport(query: Record<string, string> = {}) {
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value));
  return request<Record<string, any>>(`/daily-report${params.size ? `?${params}` : ''}`);
}

export async function startRound(idPaciente: string): Promise<RoundPayload> {
  return request<RoundPayload>('/rounds/start', {
    method: 'POST',
    body: JSON.stringify({ idPaciente, equipesPresentes: [] }),
  });
}

export async function savePatient(payload: Record<string, any>): Promise<Patient> {
  return request<Patient>('/patients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function archivePatient(idPaciente: string, payload: Record<string, any>): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/patients/${encodeURIComponent(idPaciente)}/archive`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function saveRound(idRound: string, payload: Record<string, any>): Promise<RoundPayload> {
  return request<RoundPayload>(`/rounds/${encodeURIComponent(idRound)}/save`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAlert(idAlerta: string, payload: Record<string, any>) {
  return request<Record<string, any>>(`/alerts/${encodeURIComponent(idAlerta)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
