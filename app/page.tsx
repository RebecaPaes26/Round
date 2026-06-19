import { Activity, AlertTriangle, ClipboardList, HeartPulse, UsersRound } from 'lucide-react';
import { getBootstrap, type Bootstrap, type Patient } from '../src/lib/api';

const fallback: Bootstrap = {
  pacientes: [],
  unidades: [],
  dashboard: {
    totalPacientesAtivos: 0,
    indicadores: {},
    gruposAlertas: [],
    participacaoEquipe: [],
  },
  diagnostico: {},
};

export default async function Home() {
  let data = fallback;
  let apiError = '';

  try {
    data = await getBootstrap();
  } catch (error) {
    apiError = error instanceof Error ? error.message : 'API indisponivel';
  }

  const indicadores = data.dashboard?.indicadores || {};

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <HeartPulse size={26} />
          <span>ROUND UTI</span>
        </div>
        <nav>
          <a className="active">Dashboard</a>
          <a>Pacientes</a>
          <a>Round</a>
          <a>Histórico</a>
          <a>Relatório diário</a>
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

        <section className="kpis">
          <Kpi icon={<UsersRound />} label="Pacientes ativos" value={data.dashboard?.totalPacientesAtivos ?? 0} />
          <Kpi icon={<ClipboardList />} label="Taxa round" value={`${indicadores.taxaRound ?? 0}%`} />
          <Kpi icon={<Activity />} label="Metas concluídas" value={`${indicadores.metasConcluidas ?? 0}%`} />
          <Kpi icon={<AlertTriangle />} label="Alertas ativos" value={data.dashboard?.gruposAlertas?.reduce((sum, item) => sum + item.quantidade, 0) ?? 0} />
        </section>

        <section className="layout">
          <div className="panel">
            <div className="panel-head">
              <h2>Pacientes</h2>
              <span>{data.pacientes.length} em acompanhamento</span>
            </div>
            <div className="patients">
              {data.pacientes.length ? data.pacientes.map((patient) => <PatientCard key={patient.idPaciente} patient={patient} />) : (
                <div className="empty">Nenhum paciente carregado. Rode o seed ou cadastre pela API.</div>
              )}
            </div>
          </div>

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
        </section>
      </section>
    </main>
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

function PatientCard({ patient }: { patient: Patient }) {
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
    </article>
  );
}
