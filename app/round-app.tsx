'use client';

import { Activity, AlertTriangle, ClipboardList, HeartPulse, PlayCircle, UsersRound } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { startRound, type Bootstrap, type Patient } from '../src/lib/api';

type View = 'dashboard' | 'pacientes' | 'round' | 'historico' | 'relatorio';

const navItems: Array<{ id: View; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pacientes', label: 'Pacientes' },
  { id: 'round', label: 'Round' },
  { id: 'historico', label: 'Histórico' },
  { id: 'relatorio', label: 'Relatório diário' },
];

export function RoundApp({ data, apiError }: { data: Bootstrap; apiError: string }) {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [roundMessage, setRoundMessage] = useState('');
  const [startingPatientId, setStartingPatientId] = useState('');

  const indicadores = data.dashboard?.indicadores || {};
  const totalAlertas = useMemo(
    () => data.dashboard?.gruposAlertas?.reduce((sum, item) => sum + item.quantidade, 0) ?? 0,
    [data.dashboard?.gruposAlertas],
  );

  async function handleStartRound(patient: Patient) {
    setStartingPatientId(patient.idPaciente);
    setRoundMessage('');

    try {
      await startRound(patient.idPaciente);
      setRoundMessage(`Round iniciado para ${patient.nomePaciente}.`);
    } catch (error) {
      setRoundMessage(error instanceof Error ? error.message : 'Não foi possível iniciar o round.');
    } finally {
      setStartingPatientId('');
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <HeartPulse size={26} />
          <span>ROUND UTI</span>
        </div>
        <nav aria-label="Navegação principal">
          {navItems.map((item) => (
            <button
              className={activeView === item.id ? 'active' : ''}
              key={item.id}
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Sistema operacional</p>
            <h1>Round Multidisciplinar UTI</h1>
          </div>
          <span className={apiError ? 'status warn' : 'status ok'}>{apiError ? 'API offline' : 'API online'}</span>
        </header>

        {apiError ? <div className="banner">{apiError}</div> : null}

        {activeView === 'dashboard' ? (
          <DashboardView data={data} indicadores={indicadores} totalAlertas={totalAlertas} />
        ) : null}

        {activeView === 'pacientes' ? (
          <PatientsView patients={data.pacientes} />
        ) : null}

        {activeView === 'round' ? (
          <RoundView
            message={roundMessage}
            onStartRound={handleStartRound}
            patients={data.pacientes}
            startingPatientId={startingPatientId}
          />
        ) : null}

        {activeView === 'historico' ? (
          <HistoryView patients={data.pacientes} />
        ) : null}

        {activeView === 'relatorio' ? (
          <ReportView data={data} indicadores={indicadores} totalAlertas={totalAlertas} />
        ) : null}
      </section>
    </main>
  );
}

function DashboardView({
  data,
  indicadores,
  totalAlertas,
}: {
  data: Bootstrap;
  indicadores: Record<string, number>;
  totalAlertas: number;
}) {
  return (
    <>
      <section className="kpis">
        <Kpi icon={<UsersRound />} label="Pacientes ativos" value={data.dashboard?.totalPacientesAtivos ?? 0} />
        <Kpi icon={<ClipboardList />} label="Taxa round" value={`${indicadores.taxaRound ?? 0}%`} />
        <Kpi icon={<Activity />} label="Metas concluídas" value={`${indicadores.metasConcluidas ?? 0}%`} />
        <Kpi icon={<AlertTriangle />} label="Alertas ativos" value={totalAlertas} />
      </section>

      <section className="layout">
        <PatientsPanel patients={data.pacientes} />
        <AlertsPanel data={data} />
      </section>
    </>
  );
}

function PatientsView({ patients }: { patients: Patient[] }) {
  return <PatientsPanel patients={patients} />;
}

function RoundView({
  message,
  onStartRound,
  patients,
  startingPatientId,
}: {
  message: string;
  onStartRound: (patient: Patient) => void;
  patients: Patient[];
  startingPatientId: string;
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Round</h2>
        <span>{patients.length} pacientes disponíveis</span>
      </div>
      {message ? <div className="notice">{message}</div> : null}
      <div className="patients">
        {patients.length ? patients.map((patient) => (
          <PatientCard
            action={(
              <button
                className="action-button"
                disabled={startingPatientId === patient.idPaciente}
                onClick={() => onStartRound(patient)}
                type="button"
              >
                <PlayCircle size={18} />
                {startingPatientId === patient.idPaciente ? 'Iniciando...' : 'Iniciar round'}
              </button>
            )}
            key={patient.idPaciente}
            patient={patient}
          />
        )) : (
          <div className="empty">Nenhum paciente carregado. Rode o seed ou cadastre pela API.</div>
        )}
      </div>
    </div>
  );
}

function HistoryView({ patients }: { patients: Patient[] }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Histórico</h2>
        <span>Últimos status registrados</span>
      </div>
      <div className="stack">
        {patients.length ? patients.map((patient) => (
          <div className="row" key={patient.idPaciente}>
            <span>{patient.leito} - {patient.nomePaciente}</span>
            <strong>{patient.statusRound || 'Sem status'}</strong>
          </div>
        )) : <div className="empty">Nenhum histórico disponível.</div>}
      </div>
    </div>
  );
}

function ReportView({
  data,
  indicadores,
  totalAlertas,
}: {
  data: Bootstrap;
  indicadores: Record<string, number>;
  totalAlertas: number;
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Relatório diário</h2>
        <span>Resumo operacional</span>
      </div>
      <div className="stack">
        <div className="row">
          <span>Pacientes ativos</span>
          <strong>{data.dashboard?.totalPacientesAtivos ?? 0}</strong>
        </div>
        <div className="row">
          <span>Taxa round</span>
          <strong>{indicadores.taxaRound ?? 0}%</strong>
        </div>
        <div className="row">
          <span>Metas concluídas</span>
          <strong>{indicadores.metasConcluidas ?? 0}%</strong>
        </div>
        <div className="row">
          <span>Alertas ativos</span>
          <strong>{totalAlertas}</strong>
        </div>
      </div>
    </div>
  );
}

function PatientsPanel({ patients }: { patients: Patient[] }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Pacientes</h2>
        <span>{patients.length} em acompanhamento</span>
      </div>
      <div className="patients">
        {patients.length ? patients.map((patient) => <PatientCard key={patient.idPaciente} patient={patient} />) : (
          <div className="empty">Nenhum paciente carregado. Rode o seed ou cadastre pela API.</div>
        )}
      </div>
    </div>
  );
}

function AlertsPanel({ data }: { data: Bootstrap }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Alertas</h2>
        <span>Ativos por tipo</span>
      </div>
      <div className="stack">
        {data.dashboard.gruposAlertas.length ? data.dashboard.gruposAlertas.map((alert) => (
          <div className="row" key={alert.tipo}>
            <span>{alert.tipo}</span>
            <strong>{alert.quantidade}</strong>
          </div>
        )) : <div className="empty">Sem alertas ativos.</div>}
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <article className="kpi">
      <div className="kpi-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function PatientCard({ action, patient }: { action?: React.ReactNode; patient: Patient }) {
  return (
    <article className="patient-card">
      <div className="patient-top">
        <div>
          <strong>{patient.leito} - {patient.nomePaciente}</strong>
          <span>{patient.unidade}</span>
        </div>
        <em>{patient.statusRound}</em>
      </div>
      <p>{patient.diagnosticoAtual || 'Sem diagnóstico registrado'}</p>
      <div className="chips">
        {patient.riscosAtivos ? <span>Riscos: {patient.riscosAtivos}</span> : null}
        {patient.alertasAtivos ? <span>Alertas: {patient.alertasAtivos}</span> : null}
        {patient.dispositivosResumo ? <span>{patient.dispositivosResumo}</span> : null}
      </div>
      {action ? <div className="card-actions">{action}</div> : null}
    </article>
  );
}
