import { FileText, Target, UsersRound, Wand2 } from 'lucide-react';
import { TherapeuticPlan } from '../components/TherapeuticPlan';
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

export default async function TherapeuticPlanPage() {
  let data = fallback;
  let apiError = '';

  try {
    data = await getBootstrap();
  } catch (error) {
    apiError = error instanceof Error ? error.message : 'API indisponível';
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Continuidade do cuidado</p>
          <h1>Plano Terapêutico</h1>
        </div>
        <span className={apiError ? 'status warn' : 'status ok'}>{apiError ? 'API offline' : 'API online'}</span>
      </header>

      {apiError ? <div className="banner">{apiError}</div> : null}

      <section className="kpis">
        <Kpi icon={<UsersRound />} label="Pacientes" value={data.pacientes.length} />
        <Kpi icon={<Target />} label="Com metas" value={data.pacientes.filter((patient) => patient.metasResumo).length} />
        <Kpi icon={<FileText />} label="Com diagnóstico" value={data.pacientes.filter((patient) => patient.diagnosticoAtual).length} />
        <Kpi icon={<Wand2 />} label="Preenchimento" value="Automático" />
      </section>

      <TherapeuticPlan patients={data.pacientes} />
    </main>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string | number; value: string | number }) {
  return (
    <article className="kpi">
      <div className="kpi-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
