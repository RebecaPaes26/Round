import { Bed, CalendarDays, CheckCircle2, ClipboardList, History, ListChecks, Target, UsersRound } from 'lucide-react';
import { getBootstrap, getHistory, type Bootstrap, type Patient } from '../../src/lib/api';
import { dateParamToIso, toBrazilianDate } from '../../src/lib/dates';

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

const carePosts = ['PA 30', 'PA 36', 'PA 41', 'PA 42', 'PA 44'];

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const selectedPost = params.unidade || '';
  const selectedPatientId = params.idPaciente || '';
  const selectedRoundId = params.round || '';
  const startDate = dateParamToIso(params.inicio);
  const endDate = dateParamToIso(params.fim);
  let bootstrap = fallback;
  let history: Array<Record<string, any>> = [];
  let apiError = '';

  try {
    bootstrap = await getBootstrap();
    if (selectedPatientId) {
      history = await getHistory({ idPaciente: selectedPatientId, inicio: startDate, fim: endDate });
    }
  } catch (error) {
    apiError = error instanceof Error ? error.message : 'API indisponível';
  }

  const postPatients = selectedPost
    ? bootstrap.pacientes.filter((patient) => patientCarePost(patient) === selectedPost)
    : [];
  const selectedPatient = bootstrap.pacientes.find((patient) => patient.idPaciente === selectedPatientId);
  const sortedHistory = [...history].sort((a, b) => String(b.round?.dataRound || '').localeCompare(String(a.round?.dataRound || '')));
  const selectedEntry = sortedHistory.find((entry) => entry.round?.idRound === selectedRoundId) || sortedHistory[0];
  const periodQuery = `${startDate ? `&inicio=${encodeURIComponent(startDate)}` : ''}${endDate ? `&fim=${encodeURIComponent(endDate)}` : ''}`;

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Linha do tempo clínica</p>
          <h1>Histórico do paciente</h1>
        </div>
        <span className={apiError ? 'status warn' : 'status ok'}>{apiError ? 'API offline' : 'API online'}</span>
      </header>

      {apiError ? <div className="banner">{apiError}</div> : null}

      <section className="panel history-control">
        <div className="history-control-head">
          <div>
            <h2>Selecione o posto assistencial</h2>
            <span>{selectedPost ? `${postPatients.length} pacientes ativos no ${selectedPost}` : 'Escolha o posto para listar os pacientes'}</span>
          </div>
        </div>
        <div className="care-post-grid">
          {carePosts.map((post) => (
            <a className={selectedPost === post ? 'care-post-card active' : 'care-post-card'} href={`/historico?unidade=${encodeURIComponent(post)}`} key={post}>
              <UsersRound size={18} />
              <strong>{post}</strong>
              <span>{bootstrap.pacientes.filter((patient) => patientCarePost(patient) === post).length} pacientes</span>
            </a>
          ))}
        </div>

        {selectedPost ? (
          <div className="history-patient-picker">
            <form className="history-header-filter">
              <input type="hidden" name="unidade" value={selectedPost} />
              <label>
                <span>Paciente</span>
                <select name="idPaciente" defaultValue={selectedPatientId}>
                  <option value="">Selecione</option>
                  {postPatients.map((patient) => (
                    <option key={patient.idPaciente} value={patient.idPaciente}>{patient.leito || '--'} - {patient.nomePaciente}</option>
                  ))}
                </select>
              </label>
              <label><span>Início</span><input name="inicio" type="date" defaultValue={startDate} /></label>
              <label><span>Fim</span><input name="fim" type="date" defaultValue={endDate} /></label>
              <button className="primary-action" type="submit">Filtrar</button>
            </form>
            <div className="panel-head">
              <h2>Paciente</h2>
              <span>{selectedPatient ? `Leito ${selectedPatient.leito}` : 'Selecione para abrir a linha do tempo'}</span>
            </div>
            <div className="history-patient-grid">
              {postPatients.length ? postPatients.map((patient) => (
                <a
                  className={selectedPatientId === patient.idPaciente ? 'history-patient-card active' : 'history-patient-card'}
                  href={selectedPatientId === patient.idPaciente
                    ? `/historico?unidade=${encodeURIComponent(selectedPost)}${periodQuery}`
                    : `/historico?unidade=${encodeURIComponent(selectedPost)}&idPaciente=${encodeURIComponent(patient.idPaciente)}${periodQuery}`}
                  key={patient.idPaciente}
                >
                  <span className="bed-icon"><Bed size={20} /></span>
                  <span>
                    <strong>Leito {patient.leito || '--'}</strong>
                    <small>{patient.nomePaciente}</small>
                    {selectedPatientId === patient.idPaciente ? (
                      <span className="history-patient-expanded">
                        <span>{patient.diagnosticoAtual || 'Diagnóstico não registrado'}</span>
                        <span>Previsão de alta: {toBrazilianDate(patient.previsaoAlta) || 'Não registrada'}</span>
                        <span>{patient.alertasAbertos ? `${patient.alertasAbertos} alerta(s) ativo(s)` : 'Sem alertas ativos'}</span>
                        <span>Clique novamente para recolher o histórico</span>
                      </span>
                    ) : null}
                  </span>
                </a>
              )) : <div className="empty compact-empty">Nenhum paciente ativo neste posto.</div>}
            </div>
          </div>
        ) : null}
      </section>

      {selectedPatient ? (
        <section className="panel history-patient-summary">
          <div className="patient-bed-title">
            <span className="bed-icon"><Bed size={22} /></span>
            <div>
              <strong>{selectedPatient.nomePaciente}</strong>
              <small>Leito {selectedPatient.leito || '--'} • {selectedPatient.unidade || patientCarePost(selectedPatient)}</small>
            </div>
          </div>
          <InfoPill label="Nascimento" value={toBrazilianDate(selectedPatient.dataNascimento) || 'Não registrado'} />
          <InfoPill label="Previsão de alta" value={toBrazilianDate(selectedPatient.previsaoAlta) || 'Não registrada'} />
          <InfoPill label="Diagnóstico" value={selectedPatient.diagnosticoAtual || 'Não registrado'} />
        </section>
      ) : null}

      {selectedPatient && sortedHistory.length ? (
        <>
          <section className="panel history-date-strip">
            <div className="panel-head">
              <h2>Rounds por data</h2>
              <span>{sortedHistory.length} registros encontrados</span>
            </div>
            <div className="history-date-row" aria-label="Datas dos rounds">
              {sortedHistory.map((entry) => {
                const active = entry.round?.idRound === selectedEntry?.round?.idRound;
                return (
                  <a
                    className={active ? 'history-date-chip active' : 'history-date-chip'}
                    href={`/historico?unidade=${encodeURIComponent(selectedPost)}&idPaciente=${encodeURIComponent(selectedPatientId)}&round=${encodeURIComponent(entry.round?.idRound || '')}${periodQuery}`}
                    key={entry.round?.idRound}
                  >
                    <CalendarDays size={16} />
                    <span>{toBrazilianDate(entry.round?.dataRound) || 'Sem data'}</span>
                    <small>{entry.round?.statusRound || 'Round'}</small>
                  </a>
                );
              })}
            </div>
          </section>

          {selectedEntry ? <RoundHistoryDetail entry={selectedEntry} /> : null}
        </>
      ) : selectedPatient ? (
        <section className="panel"><div className="empty">Nenhum round encontrado para este paciente.</div></section>
      ) : (
        <section className="panel"><div className="empty">Selecione um posto e um paciente para visualizar o histórico por datas.</div></section>
      )}
    </main>
  );
}

function RoundHistoryDetail({ entry }: { entry: Record<string, any> }) {
  const round = entry.round || {};
  return (
    <section className="history-round-detail">
      <article className="panel history-round-hero">
        <div>
          <p className="eyebrow">Round de {toBrazilianDate(round.dataRound) || 'data não registrada'}</p>
          <h2>{round.problemaAtivoPrincipal || 'Problema ativo não registrado'}</h2>
          <p>{round.barreirasAlta ? `Barreiras para alta: ${round.barreirasAlta}` : 'Sem barreiras para alta registradas.'}</p>
        </div>
        <span className="status ok">{round.statusRound || 'Round registrado'}</span>
      </article>

      <section className="history-sections-grid">
        <article className="panel history-domain-card">
          <div className="history-domain-head"><ListChecks size={18} /><h2>Check List Bundle ABCDEF</h2></div>
          <div className="history-param-grid">
            {bundleItems(entry.bundle).map((item) => <ParamItem key={item.label} {...item} />)}
          </div>
        </article>

        <article className="panel history-domain-card">
          <div className="history-domain-head"><Target size={18} /><h2>Metas</h2></div>
          <div className="history-list">
            {(entry.metas || []).length ? (entry.metas || []).map((goal: Record<string, any>) => (
              <div className="history-list-item" key={goal.idMeta || goal.meta}>
                <strong>{goal.meta || 'Meta sem descrição'}</strong>
                <span>{[toBrazilianDate(goal.prazo), goal.responsavel, goal.status].filter(Boolean).join(' • ') || 'Sem prazo/status'}</span>
              </div>
            )) : <p className="empty compact-empty">Sem metas registradas.</p>}
          </div>
        </article>

        <article className="panel history-domain-card">
          <div className="history-domain-head"><ClipboardList size={18} /><h2>Pendências</h2></div>
          <div className="history-list">
            {splitList(round.pendencias).length ? splitList(round.pendencias).map((item) => (
              <div className="history-list-item" key={item}><strong>{item}</strong></div>
            )) : <p className="empty compact-empty">Sem pendências registradas.</p>}
          </div>
        </article>
      </section>

      <section className="panel history-parameters">
        <div className="panel-head">
          <h2>Parâmetros avaliados</h2>
          <span>Resumo estruturado do round selecionado</span>
        </div>
        <div className="history-param-grid wide">
          {clinicalParameterItems(entry).map((item) => <ParamItem key={item.label} {...item} />)}
        </div>
      </section>
    </section>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return <div className="history-info-pill"><span>{label}</span><strong>{value}</strong></div>;
}

function ParamItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="history-param-item">
      <span>{label}</span>
      <strong>{value || 'Sem registro'}</strong>
    </div>
  );
}

function patientCarePost(patient: Patient) {
  const unit = String(patient.unidade || '').trim().toUpperCase();
  const explicit = carePosts.find((post) => unit === post || unit.includes(post));
  if (explicit) return explicit;
  const bed = String(patient.leito || '').replace(/\D/g, '');
  const prefix = bed.slice(0, 2);
  return carePosts.find((post) => post.endsWith(prefix)) || carePosts[0];
}

function bundleItems(bundle: Record<string, any> = {}) {
  return [
    { label: 'Analgesia adequada', value: bundle.analgesiaAdequada },
    { label: 'Redução de sedação', value: bundle.podeReduzirSedacao },
    { label: 'Alvo RASS', value: bundle.alvoRASS },
    { label: 'Despertar diário', value: bundle.despertarDiario },
    { label: 'Delirium', value: bundle.pacienteDelirium },
    { label: 'Desmame ventilatório', value: bundle.podeIniciarDesmame },
    { label: 'TRE', value: bundle.indicacaoTRE },
    { label: 'Extubação', value: bundle.realizarExtubacao },
    { label: 'Mobilização', value: [bundle.podeMobilizarHoje, bundle.nivelMobilidade, bundle.progredirMobilidade].filter(Boolean).join(' • ') },
    { label: 'Família informada', value: bundle.familiaInformadaPlano },
  ];
}

function clinicalParameterItems(entry: Record<string, any>) {
  const assistance = entry.assistencia || {};
  return [
    { label: 'Evolução', value: entry.round?.evolucaoPaciente },
    { label: 'Hemodinâmica', value: [assistance.instabilidadeUltimasHoras && `Instabilidade: ${assistance.instabilidadeUltimasHoras}`, assistance.usoDrogaVasoativa && `DVA: ${assistance.usoDrogaVasoativa}`, assistance.aumentoDoseDrogaVasoativa && `Aumento DVA: ${assistance.aumentoDoseDrogaVasoativa}`].filter(Boolean).join(' • ') },
    { label: 'Respiratório', value: [assistance.suporteRespiratorio, assistance.viaAerea, assistance.modoVentilatorioAtual, assistance.statusSuporteVentilatorio].filter(Boolean).join(' • ') },
    { label: 'Renal', value: [assistance.pacienteEmHD && `HD: ${assistance.pacienteEmHD}`, assistance.tipoHD, assistance.ajusteAntibioticoDialise && `Ajuste ATB/HD: ${assistance.ajusteAntibioticoDialise}`].filter(Boolean).join(' • ') },
    { label: 'Nutrição', value: [formatFoodRoute(assistance.viasAlimentacao), assistance.tneVetPleno && `VET enteral: ${assistance.tneVetPleno}`, assistance.tneAdequacaoPercentual && `Adequação enteral: ${assistance.tneAdequacaoPercentual}%`, assistance.npoDias && `Dieta zero: ${assistance.npoDias}d`].filter(Boolean).join(' • ') },
    { label: 'Infecção/Antibiótico', value: (entry.infeccao || []).map((item: Record<string, any>) => [item.nomeAntibiotico, item.provavelFoco, item.tempoTratamentoPrevistoDias && `${item.tempoTratamentoPrevistoDias}d`, item.condutaSemMelhora].filter(Boolean).join(' • ')).filter(Boolean).join('\n') },
    { label: 'Riscos', value: riskSummary(entry.riscos) },
    { label: 'Dispositivos', value: (entry.dispositivos || []).map((device: Record<string, any>) => [device.tipoDispositivo, device.sitio, device.tempoDispositivoDias !== undefined ? `${device.tempoDispositivoDias}d` : '', device.conduta].filter(Boolean).join(' • ')).join('\n') },
    { label: 'Lesões', value: (entry.lesoes || []).map((lesion: Record<string, any>) => [lesion.localLesao, lesion.estadiamento, lesion.acompanhamento].filter(Boolean).join(' • ')).join('\n') },
  ];
}

function splitList(value?: string) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function formatFoodRoute(value?: string | string[]) {
  if (Array.isArray(value)) return value.join(', ');
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean).join(', ');
}

function riskSummary(risk: Record<string, any> = {}) {
  return [
    ['riscoTEV', 'TEV'],
    ['riscoInfeccao', 'Infecção'],
    ['riscoSangramento', 'Sangramento'],
    ['riscoLPP', 'LPP'],
    ['riscoNutricional', 'Nutricional'],
    ['riscoDelirium', 'Delirium'],
    ['riscoBroncoaspiracao', 'Broncoaspiração'],
    ['riscoQueda', 'Queda'],
  ].filter(([key]) => risk[key] === 'Sim' || risk[key] === true).map(([, label]) => label).join(', ');
}
