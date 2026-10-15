import { ClipboardList, Filter, ListChecks, Target } from 'lucide-react';
import { PrintButton } from '../components/PrintButton';
import { getDailyReport } from '../../src/lib/api';
import { dateParamToIso, toBrazilianDate } from '../../src/lib/dates';

const carePosts = ['PA 30', 'PA 36', 'PA 41', 'PA 42', 'PA 44'];

type ChecklistItem = {
  title: string;
  detail?: string;
  checked?: boolean;
};

export default async function DailyReportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const selectedDate = dateParamToIso(params.data) || new Date().toISOString().slice(0, 10);
  const selectedPost = params.posto || '';
  let report: Record<string, any> = { rounds: [], data: selectedDate };
  let apiError = '';

  try {
    report = await getDailyReport({ data: selectedDate, posto: selectedPost });
  } catch (error) {
    apiError = error instanceof Error ? error.message : 'API indisponivel';
  }

  const rounds = [...(report.rounds || [])].sort((a: Record<string, any>, b: Record<string, any>) => String(a.paciente?.leito || '').localeCompare(String(b.paciente?.leito || ''), 'pt-BR', { numeric: true }));
  const totals = rounds.reduce((acc: Record<string, number>, entry: Record<string, any>) => {
    acc.metas += goalItems(entry).length;
    acc.pendencias += pendingItems(entry).length;
    return acc;
  }, { metas: 0, pendencias: 0 });

  return (
    <main>
      <header className="topbar daily-report-topbar">
        <div>
          <p className="eyebrow">Pos-round</p>
          <h1>Relatorio diario</h1>
        </div>
        <div className="daily-report-actions">
          <PrintButton />
          <span className={apiError ? 'status warn' : 'status ok'}>{apiError ? 'API offline' : 'API online'}</span>
        </div>
      </header>

      {apiError ? <div className="banner">{apiError}</div> : null}

      <form className="filters daily-report-filters">
        <label><span>Data</span><input name="data" type="date" defaultValue={selectedDate} /></label>
        <label>
          <span>Posto assistencial</span>
          <select name="posto" defaultValue={selectedPost}>
            <option value="">Todos os postos</option>
            {carePosts.map((post) => <option key={post} value={post}>{post}</option>)}
          </select>
        </label>
        <button className="primary-action" type="submit"><Filter size={16} /> Gerar</button>
        <PrintButton label="Imprimir relatorio" />
      </form>

      <section className="kpis daily-report-kpis">
        <Kpi icon={<ClipboardList />} label="Pacientes avaliados" value={rounds.length} />
        <Kpi icon={<Target />} label="Metas" value={totals.metas} />
        <Kpi icon={<ListChecks />} label="Pendencias" value={totals.pendencias} />
      </section>

      <section className="panel daily-print-sheet">
        <div className="daily-print-head">
          <div>
            <h2>Lista de metas pos-round</h2>
            <span>{report.posto || selectedPost || 'Todos os postos'} | {toBrazilianDate(report.data || selectedDate)}</span>
          </div>
          <strong>{rounds.length} paciente(s)</strong>
        </div>

        <div className="daily-simple-list">
          {rounds.length ? rounds.map((entry: Record<string, any>, index: number) => (
            <PatientRow entry={entry} index={index + 1} key={entry.round?.idRound || entry.paciente?.idPaciente} />
          )) : <div className="empty">Nenhum round registrado para o filtro selecionado.</div>}
        </div>
      </section>

      <section className="signature-line">
        <span>Supervisao Assistencial</span>
      </section>
    </main>
  );
}

function PatientRow({ entry, index }: { entry: Record<string, any>; index: number }) {
  const patient = entry.paciente || {};
  const goals = goalItems(entry);
  const pendings = pendingItems(entry);

  return (
    <article className="daily-simple-patient">
      <div className="daily-patient-identification">
        <span>{index}</span>
        <div>
          <strong>Leito {patient.leito || '--'}</strong>
          <small>{patient.nomePaciente || 'Paciente sem identificacao'}</small>
          <em>{[patient.unidade, toBrazilianDate(entry.round?.dataRound)].filter(Boolean).join(' | ')}</em>
        </div>
      </div>

      <div className="daily-simple-content">
        <section>
          <h3>Metas</h3>
          {goals.length ? (
            <ul>
              {goals.map((goal, goalIndex) => (
                <li key={`${goal.title}-${goalIndex}`}>
                  <label>
                    <input type="checkbox" defaultChecked={goal.checked} />
                    <span>
                      <strong>{goal.title}</strong>
                      {goal.detail ? <small>{goal.detail}</small> : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : <p>Sem metas registradas.</p>}
        </section>

        {pendings.length ? (
          <section>
            <h3>Pendencias</h3>
            <ul>
              {pendings.map((pending, pendingIndex) => (
                <li key={`${pending.title}-${pendingIndex}`}>
                  <label>
                    <input type="checkbox" />
                    <span><strong>{pending.title}</strong></span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <article className="kpi"><div className="kpi-icon">{icon}</div><span>{label}</span><strong>{value}</strong></article>;
}

function goalItems(entry: Record<string, any>): ChecklistItem[] {
  return (entry.metas || [])
    .filter((goal: Record<string, any>) => goal.meta)
    .map((goal: Record<string, any>) => ({
      title: goal.meta,
      detail: [goal.responsavel && `Responsavel: ${goal.responsavel}`, goal.prazo && `Prazo: ${toBrazilianDate(goal.prazo)}`, goal.status && `Status: ${goal.status}`].filter(Boolean).join(' | '),
      checked: normalize(goal.status) === 'concluida',
    }));
}

function pendingItems(entry: Record<string, any>): ChecklistItem[] {
  return splitText(entry.round?.pendencias)
    .map((item) => ({ title: item }));
}

function splitText(value?: string) {
  return String(value || '')
    .split(/\n|;/)
    .flatMap((item) => item.split(/,(?=\s*[A-ZÀ-Ú0-9])/))
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalize(value?: string) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
