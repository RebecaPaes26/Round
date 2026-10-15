import { ClipboardList, PlayCircle, Save, UsersRound } from 'lucide-react';
import { RoundWorkspace } from '../components/RoundWorkspace';
import { getBootstrap, type Bootstrap } from '../../src/lib/api';

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

export default async function RoundPage() {
  let data = fallback;
  let apiError = '';

  try {
    data = await getBootstrap();
  } catch (error) {
    apiError = error instanceof Error ? error.message : 'API indisponível';
  }

  const pending = data.pacientes.filter((patient) => !patient.statusRound || patient.statusRound === 'Pendente' || patient.statusRound === 'Não iniciado');
  const running = data.pacientes.filter((patient) => patient.statusRound === 'EmAndamento' || patient.statusRound === 'Em andamento');

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Execucao assistencial</p>
          <h1>Round</h1>
        </div>
        <span className={apiError ? 'status warn' : 'status ok'}>{apiError ? 'API offline' : 'API online'}</span>
      </header>

      {apiError ? <div className="banner">{apiError}</div> : null}

      <section className="kpis">
        <Kpi icon={<UsersRound />} label="Pacientes" value={data.pacientes.length} />
        <Kpi icon={<ClipboardList />} label="Pendentes" value={pending.length} />
        <Kpi icon={<PlayCircle />} label="Em andamento" value={running.length} />
        <Kpi icon={<Save />} label="Autosave" value="Ativo" />
      </section>

      {data.pacientes.length ? <RoundWorkspace patients={data.pacientes} /> : (
        <section className="panel">
          <div className="empty">Nenhum paciente carregado para iniciar round.</div>
        </section>
      )}
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
