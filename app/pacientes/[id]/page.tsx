import { ArrowLeft, Bell, ClipboardList, HeartPulse, History, MonitorDot, Target } from 'lucide-react';
import Link from 'next/link';
import { getPatient, type PatientDetail } from '../../../src/lib/api';
import { toBrazilianDate } from '../../../src/lib/dates';

type PatientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientPage({ params }: PatientPageProps) {
  const { id } = await params;
  let patient: PatientDetail | null = null;
  let apiError = '';

  try {
    patient = await getPatient(decodeURIComponent(id));
  } catch (error) {
    apiError = error instanceof Error ? error.message : 'API indisponível';
  }
  const runningGoals = patient ? patient.metas.filter((goal) => normalizeStatus(goal.status) === 'Em andamento') : [];
  const pendingGoals = patient ? patient.metas.filter((goal) => normalizeStatus(goal.status) === 'Pendente') : [];
  const activeGoalsCount = runningGoals.length + pendingGoals.length;

  return (
    <main>
      <header className="patient-header">
        <Link className="back-link" href="/pacientes">
          <ArrowLeft size={18} />
          Voltar
        </Link>
        <div>
          <p className="eyebrow">Tela do paciente</p>
          <h1>{patient ? `${patient.leito} - ${patient.nomePaciente}` : 'Paciente indisponível'}</h1>
        </div>
        <span className={apiError ? 'status warn' : 'status ok'}>{apiError ? 'API offline' : 'API online'}</span>
      </header>

      {apiError || !patient ? (
        <div className="banner">{apiError || 'Paciente nao encontrado.'}</div>
      ) : (
        <>
          <section className="patient-summary">
            <InfoCard icon={<HeartPulse />} label="Unidade" value={patient.unidade} />
            <InfoCard icon={<ClipboardList />} label="Round" value={patient.statusRound || 'Não iniciado'} />
            <InfoCard icon={<MonitorDot />} label="Internação" value={`${patient.diasInternacao ?? 0} dias`} />
            <InfoCard icon={<Target />} label="VM" value={`${patient.tempoVMDias ?? 0} dias`} />
          </section>

          <section className="patient-grid">
            <article className="panel detail-panel">
              <div className="panel-head">
                <h2>Resumo clínico</h2>
                <span>{patient.prontuario ? `Prontuário ${patient.prontuario}` : patient.idPaciente}</span>
              </div>
              <dl className="clinical-list">
                <div>
                  <dt>Motivo da internação</dt>
                  <dd>{patient.motivoInternacao || 'Não registrado'}</dd>
                </div>
                <div>
                  <dt>Diagnóstico atual</dt>
                  <dd>{patient.diagnosticoAtual || 'Não registrado'}</dd>
                </div>
                <div>
                  <dt>Evolução</dt>
                  <dd>{patient.evolucaoPaciente || 'Não registrada'}</dd>
                </div>
                <div>
                  <dt>Pendências</dt>
                  <dd>{patient.pendenciasResumo || 'Sem pendências registradas'}</dd>
                </div>
              </dl>
            </article>

            <article className="panel detail-panel">
              <div className="panel-head">
                <h2>Alertas</h2>
                <span>{patient.alertas.length} ativos</span>
              </div>
              <div className="stack">
                {patient.alertas.length ? patient.alertas.map((alert) => (
                  <div className="detail-row" key={alert.idAlerta}>
                    <Bell size={17} />
                    <div>
                      <strong>{alert.tipoAlerta}</strong>
                      <span>{alert.mensagem || alert.gravidade || 'Alerta ativo'}</span>
                    </div>
                  </div>
                )) : <div className="empty">Sem alertas ativos.</div>}
              </div>
            </article>
          </section>

          <section className="patient-grid">
            <article className="panel detail-panel">
              <div className="panel-head">
                <h2>Metas</h2>
                <span>{activeGoalsCount} ativas</span>
              </div>
              <div className="goal-status-stack">
                <GoalGroup title="Em andamento" goals={runningGoals} />
                <GoalGroup title="Pendentes" goals={pendingGoals} />
                {!activeGoalsCount ? <div className="empty">Sem metas pendentes ou em andamento.</div> : null}
              </div>
            </article>

            <article className="panel detail-panel">
              <div className="panel-head">
                <h2>Dispositivos</h2>
                <span>{patient.dispositivos.length} ativos</span>
              </div>
              <div className="stack">
                {patient.dispositivos.length ? patient.dispositivos.map((device) => (
                  <div className="detail-row" key={device.idDispositivo}>
                    <MonitorDot size={17} />
                    <div>
                      <strong>{device.tipoDispositivo}</strong>
                      <span>{[device.sitio, `${device.tempoDispositivoDias ?? 0} dias`].filter(Boolean).join(' | ')}</span>
                    </div>
                  </div>
                )) : <div className="empty">Sem dispositivos ativos.</div>}
              </div>
            </article>
          </section>

          <section className="panel detail-panel">
            <div className="panel-head">
              <h2>Histórico de rounds</h2>
              <span>{patient.rounds.length} registros</span>
            </div>
            <div className="timeline">
              {patient.rounds.length ? patient.rounds.map((round) => (
                <div className="timeline-item" key={round.idRound}>
                  <History size={18} />
                  <div>
                    <strong>{toBrazilianDate(round.dataRound)} - {round.statusRound}</strong>
                    <span>{round.evolucaoPaciente || round.condutaDefinida || 'Sem evolucao registrada'}</span>
                  </div>
                </div>
              )) : <div className="empty">Nenhum round registrado.</div>}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="kpi patient-kpi">
      <div className="kpi-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function GoalGroup({ title, goals }: { title: string; goals: Array<Record<string, any>> }) {
  if (!goals.length) return null;
  return (
    <section className="goal-status-group">
      <h3>{title}</h3>
      <div className="stack">
        {goals.map((goal) => (
          <div className="detail-row" key={goal.idMeta}>
            <Target size={17} />
            <div>
              <strong>{goal.meta}</strong>
              <span>{[toBrazilianDate(goal.prazo), goal.responsavel, goal.status].filter(Boolean).join(' | ') || 'Sem detalhes'}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function normalizeStatus(status?: string) {
  return String(status || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === 'em andamento'
    ? 'Em andamento'
    : String(status || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === 'pendente'
      ? 'Pendente'
      : String(status || '');
}
