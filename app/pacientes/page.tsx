import { Activity, AlertTriangle, Bed, ClipboardList, MapPin, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { getBootstrap, type Bootstrap, type Patient } from '../../src/lib/api';
import { AlertAssignment } from '../components/AlertAssignment';

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

export default async function PatientsPage() {
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
          <p className="eyebrow">Censo operacional</p>
          <h1>Pacientes</h1>
        </div>
        <span className={apiError ? 'status warn' : 'status ok'}>{apiError ? 'API offline' : 'API online'}</span>
      </header>

      {apiError ? <div className="banner">{apiError}</div> : null}

      <section className="kpis">
        <Kpi icon={<UsersRound />} label="Em acompanhamento" value={data.pacientes.length} />
        <Kpi icon={<ClipboardList />} label="Round registrado" value={data.pacientes.filter((patient) => patient.statusRound).length} />
        <Kpi icon={<AlertTriangle />} label="Com alertas" value={data.pacientes.filter((patient) => patient.alertasAtivos).length} />
        <Kpi icon={<Activity />} label="Unidades" value={data.unidades.length} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Lista de pacientes</h2>
          <span>{data.pacientes.length} registros</span>
        </div>
        <div className="patients">
          {data.pacientes.length ? data.pacientes.map((patient) => <PatientCard key={patient.idPaciente} patient={patient} />) : (
            <div className="empty">Nenhum paciente carregado. Rode o seed ou cadastre pela API.</div>
          )}
        </div>
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
  const alerts = [...(patient.alertasDetalhes || [])].sort((a, b) => severityRank(b.gravidade) - severityRank(a.gravidade));
  return (
    <article className={`patient-card patient-alert-card ${severityClass(patient.maiorGravidadeAlerta)}`}>
      <div className="patient-top">
        <div>
          <div className="patient-bed-title">
            <span className="bed-icon"><Bed size={20} /></span>
            <div>
              <strong>Leito {patient.leito}</strong>
              <small>{patient.nomePaciente}</small>
            </div>
          </div>
          <span className="patient-unit"><MapPin size={14} /> {patient.unidade}</span>
        </div>
        <em>{patient.statusRound || 'Não iniciado'}</em>
      </div>
      <p>{patient.diagnosticoAtual || 'Sem diagnàstico registrado'}</p>
      <div className="chips">
        {patient.riscosAtivos ? <span>Riscos: {patient.riscosAtivos}</span> : null}
        <span>Alertas abertos: {patient.alertasAbertos || 0}</span>
        {patient.maiorGravidadeAlerta ? <span>Maior gravidade: {patient.maiorGravidadeAlerta}</span> : null}
        {patient.dispositivosResumo ? <span>{patient.dispositivosResumo}</span> : null}
      </div>
      {alerts.length ? (
        <div className="patient-alerts">
          {alerts.slice(0, 4).map((alert) => (
            <div className={`patient-alert ${severityClass(alert.gravidade)}`} key={alert.idAlerta}>
              <div>
                <strong>{alert.problema || alert.tipoAlerta}</strong>
                <span>{alert.gravidade}</span>
              </div>
              <p>{alert.mensagem}</p>
              <AlertAssignment alert={alert} />
            </div>
          ))}
        </div>
      ) : <div className="empty compact-empty">Sem alertas abertos.</div>}
      <Link className="secondary-action patient-open-link" href={`/pacientes/${encodeURIComponent(patient.idPaciente)}`}>Abrir paciente</Link>
    </article>
  );
}

function severityRank(value?: string) {
  const text = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (text.includes('crit')) return 3;
  if (text.includes('alta')) return 2;
  if (text.includes('moder')) return 1;
  return 0;
}

function severityClass(value?: string) {
  const text = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (text.includes('crit')) return 'severity-critical';
  if (text.includes('alta')) return 'severity-high';
  if (text.includes('moder')) return 'severity-moderate';
  return '';
}
