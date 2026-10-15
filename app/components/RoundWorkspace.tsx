'use client';

import { AlertTriangle, Bed, Building2, CheckCircle2, Copy, FileText, Plus, Save, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { archivePatient, savePatient, saveRound, startRound, type Patient, type RoundPayload } from '../../src/lib/api';
import { buildEvolution } from './TherapeuticPlan';

const professionals = [
  'Médico',
  'Enfermeiro (a)',
  'Técnico (a) de enfermagem',
  'Fisioterapeuta',
  'Fonoaudiologo (a)',
  'Assistente Social',
  'Psicólogo (a)',
  'Cirurgião (a) dentista',
  'Nutricionista',
  'CCIH',
  'GELP',
  'Farmacêutico',
  'Terapeuta Ocupacional',
];

const carePosts = ['PA 30', 'PA 36', 'PA 41', 'PA 42', 'PA 44'];

const roundTabs = [
  'Bundle ABCDEF',
  'Alimentação',
  'Riscos e Profilaxias',
  'Hemodinâmica e Respiratória',
  'Renal',
  'Infecção',
  'Dispositivos',
  'Lesão',
];

const yesNo = ['Sim', 'Não'];
const yesNoNa = ['Sim', 'Não', 'Não se aplica'];
const goalStatuses = ['Pendente', 'Em andamento', 'Concluída', 'Atrasado', 'Cancelada'];
const mobilityLevels = [
  'Mobilização passiva - Restrito ao leito',
  'Mobilização ativa no leito',
  'Sedestação no leito',
  'Sedestação na poltrona',
  'Ortostase',
  'Deambulação com auxílio',
  'Deambulação sem auxílio',
];
const respiratorySupport = ['Ar ambiente', 'Cateter nasal', 'Máscara reservatória', 'Ventilação não invasiva', 'Ventilação mecânica'];
const airways = ['Fisiológica', 'TOT', 'TQT'];
const ventilatoryModes = ['PCV', 'PSV', 'VCV', 'PRVC'];
const supportStatus = ['Aumentou', 'Reduziu', 'Sem alteração', 'Não se aplica'];
const hdTypes = ['Contínua', 'Intermitente'];
const infectionFocus = [
  'Pulmonar',
  'Corrente sanguínea',
  'Urinário',
  'Abdominal/Intra-abdominal',
  'Pele e partes moles',
  'Sítio cirúrgico',
  'Cateter/Dispositivos',
  'Osteoarticular',
  'Otorrinolaringologico',
  'Odontogênico',
  'Cavidade oral',
  'Outros',
];
const antibioticConduct = ['Troca', 'Mantido', 'Ajuste de dose', 'Descalonamento', 'Suspensão'];
const deviceTypes = ['AVP', 'PVC', 'SNE', 'CVC', 'SVD', 'SNG', 'Dreno', 'PAI', 'CDL', 'TOT', 'TQT', 'Outro'];
const deviceConductOptions = ['Manter', 'Retirar hoje', 'Reavaliar em 24 horas', 'Substituir', 'Trocar sítio', 'Aguardar avaliação especializada'];
const deviceJustifications: Record<string, string[]> = {
  AVP: ['Administração de medicamentos intravenosos', 'Antibioticoterapia intravenosa', 'Hidratação venosa', 'Reposição de eletrólitos', 'Administração de hemoderivados', 'Administração intermitente de medicamentos', 'Necessidade de acesso venoso para emergência', 'Impossibilidade temporária de via oral', 'Outra indicação técnica'],
  CVC: ['Uso de droga vasoativa', 'Múltiplas infusões simultâneas', 'Soluções incompatíveis por via periférica', 'Soluções hipertônicas', 'Nutrição parenteral', 'Acesso venoso periférico difícil', 'Terapia intravenosa prolongada', 'Monitorização hemodinâmica', 'Necessidade clínica de acesso venoso central', 'Outra indicação técnica'],
  PVC: ['Antibioticoterapia prolongada', 'Nutrição parenteral', 'Terapia intravenosa prolongada', 'Acesso venoso periférico difícil', 'Múltiplas infusões', 'Acesso venoso de média ou longa permanência', 'Outra indicação técnica'],
  CDL: ['Hemodiálise intermitente', 'Terapia renal substitutiva contínua', 'Insuficiência renal aguda com indicação dialítica', 'Hipercalemia refratária', 'Sobrecarga hídrica refratária', 'Acidose metabólica grave refratária', 'Complicações urêmicas', 'Aguardando definição sobre terapia renal substitutiva', 'Outra indicação técnica'],
  PAI: ['Instabilidade hemodinâmica', 'Uso de droga vasoativa', 'Titulação frequente de droga vasoativa', 'Choque', 'Monitorização contínua da pressão arterial', 'Coletas arteriais frequentes', 'Pós-operatório de alto risco', 'Outra indicação técnica'],
  SVD: ['Controle rigoroso de diurese', 'Instabilidade hemodinâmica', 'Choque', 'Droga vasoativa com monitoramento rigoroso', 'Retenção urinária', 'Obstrução urinária', 'Condição urológica específica', 'Pós-operatório urológico', 'Lesão sacral/perineal extensa associada à incontinência', 'Conforto em cuidados paliativos', 'Outra indicação técnica'],
  SNE: ['Nutrição enteral exclusiva', 'Nutrição enteral complementar', 'Impossibilidade de alimentação oral segura', 'Disfagia', 'Rebaixamento do nível de consciência', 'Suporte nutricional enteral', 'Administração de medicamentos quando indicada', 'Aguardando progressão para via oral', 'Aguardando definição de via alimentar de longa permanência', 'Outra indicação técnica'],
  SNG: ['Descompressão gástrica', 'Drenagem gástrica', 'Obstrução gastrointestinal', 'Íleo', 'Distensão gástrica importante', 'Administração temporária de medicamentos', 'Indicação gastrointestinal específica', 'Outra indicação técnica'],
  Dreno: ['Drenagem de coleção', 'Drenagem pleural', 'Drenagem abdominal', 'Drenagem mediastinal', 'Drenagem de abscesso', 'Controle de fístula', 'Pós-operatório com drenagem mantida', 'Débito clínicamente significativo', 'Monitoramento da característica do débito', 'Outra indicação técnica'],
  TOT: ['Ventilação mecânica invasiva', 'Insuficiência respiratória aguda', 'Proteção de vias aéreas', 'Rebaixamento do nível de consciência sem proteção da via aérea', 'Instabilidade clínica incompatível com extubação', 'Pós-operatório com suporte ventilatório invasivo', 'Critérios de extubação ainda não atingidos', 'Outra indicação técnica'],
  TQT: ['Ventilação mecânica prolongada', 'Desmame ventilatório prolongado', 'Proteção da via aérea', 'Incapacidade de manejo de secreções', 'Aspiração frequente', 'Obstrução de vias aéreas superiores', 'Reabilitação respiratória', 'Critérios de decanulação ainda não atingidos', 'Outra indicação técnica'],
};
const lesionFollowUp = ['Melhorou', 'Piorou', 'Sem alteração'];
const sedationReasons = [
  'Hipoxemia',
  'Assincronia ventilatória',
  'FiO2/PEEP elevados',
  'Uso de prona',
  'Instabilidade hemodinâmica',
  'Vasopressor',
  'Bloqueio neuromuscular',
  'Neurocrítico/PIC',
  'Agitação/Risco de extubação',
  'Procedimento iminente',
  'Dor não controlada',
  'Delirium hiperativo',
  'Outros',
];
const outcomeOptions = ['Alta', 'Óbito', 'Transferência interna', 'Transferência externa'];

type Dict = Record<string, any>;
type Goal = { idMeta?: string; meta: string; prazo?: string; responsavel?: string; status?: string; autoKey?: string };
type Infection = {
  idInfeccao?: string;
  suspeitaInfeccaoAtiva?: string;
  provavelFoco?: string;
  outroFoco?: string;
  nomeAntibiotico?: string;
  dataInicioAntibiotico?: string;
  tempoTratamentoPrevistoDias?: string;
  melhoraParametrosInfeccao?: string;
  condutaSemMelhora?: string;
};
type Device = {
  idDispositivo?: string;
  tipoDispositivo: string;
  outroTipo?: string;
  presente?: string;
  sitio?: string;
  dataInsercao?: string;
  horaInsercao?: string;
  dataRetirada?: string;
  horaRetirada?: string;
  indicacaoInicial?: string;
  dispositivoAindaNecessario?: string;
  podeRetirarHoje?: string;
  motivoNaoRetirada?: string;
  conduta?: string;
  responsavelReavaliacao?: string;
  dataProximaReavaliacao?: string;
  dataUltimaReavaliacao?: string;
  usuarioUltimaReavaliacao?: string;
  justificativaPermanencia?: string;
  statusDispositivo?: string;
};
type Lesion = { idLesao?: string; localLesao?: string; estadiamento?: string; acompanhamento?: string; dataExclusao?: string; statusLesao?: string };
type RoundState = {
  idRound: string;
  equipesPresentes: string[];
  problemaAtivoPrincipal: string;
  barreirasAlta: string;
  evolucaoPaciente: string;
  pendencias: string[];
  metasAnteriores: Goal[];
  metas: Goal[];
  deletedAutoGoalKeys: string[];
  bundle: Dict;
  assistencia: Dict;
  riscos: Dict;
  infeccoes: Infection[];
  dispositivos: Device[];
  lesoes: Lesion[];
  statusRound?: string;
};

const emptyState: RoundState = {
  idRound: '',
  equipesPresentes: [],
  problemaAtivoPrincipal: '',
  barreirasAlta: '',
  evolucaoPaciente: 'Estável',
  pendencias: [''],
  metasAnteriores: [],
  metas: [{ meta: '', prazo: '', responsavel: '', status: 'Pendente' }],
  deletedAutoGoalKeys: [],
  bundle: {},
  assistencia: { viasAlimentacao: [] },
  riscos: {},
  infeccoes: [{ suspeitaInfeccaoAtiva: '', provavelFoco: '', nomeAntibiotico: '' }],
  dispositivos: [{ tipoDispositivo: '', sitio: '', podeRetirarHoje: '' }],
  lesoes: [],
};

function freshEmptyState(): RoundState {
  return {
    ...emptyState,
    equipesPresentes: [],
    pendencias: [''],
    metasAnteriores: [],
    metas: [{ meta: '', prazo: '', responsavel: '', status: 'Pendente' }],
    deletedAutoGoalKeys: [],
    bundle: {},
    assistencia: { viasAlimentacao: [] },
    riscos: {},
    infeccoes: [{ suspeitaInfeccaoAtiva: '', provavelFoco: '', nomeAntibiotico: '' }],
    dispositivos: [{ tipoDispositivo: '', sitio: '', podeRetirarHoje: '' }],
    lesoes: [],
  };
}

function patientCarePost(patient: Patient) {
  const unit = String(patient.unidade || '').trim().toUpperCase();
  const explicit = carePosts.find((post) => unit === post || unit.includes(post));
  if (explicit) return explicit;
  const bed = String(patient.leito || '').replace(/\D/g, '');
  const prefix = bed.slice(0, 2);
  const inferred = carePosts.find((post) => post.endsWith(prefix));
  return inferred || carePosts[0];
}

function patientAlertSummary(patient: Patient) {
  const count = Number(patient.alertasAbertos || 0);
  if (!count) return 'Sem alertas';
  const severity = patient.maiorGravidadeAlerta ? ` - ${patient.maiorGravidadeAlerta}` : '';
  return `${count} alerta${count > 1 ? 's' : ''}${severity}`;
}

function patientAlertDescriptions(patient: Patient) {
  const details = Array.isArray(patient.alertasDetalhes) ? patient.alertasDetalhes : [];
  const fromDetails = details
    .map((alert) => {
      const title = String(alert.problema || alert.tipoAlerta || '').trim();
      const message = String(alert.mensagem || alert.acaoEsperada || '').trim();
      if (title && message && normalizeText(title) !== normalizeText(message)) return `${title}: ${message}`;
      return title || message;
    })
    .filter(Boolean);
  if (fromDetails.length) return fromDetails;
  return String(patient.alertasAtivos || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function patientAlertDetails(patient: Patient): Dict[] {
  const details = Array.isArray(patient.alertasDetalhes) ? patient.alertasDetalhes : [];
  if (details.length) return details;
  return patientAlertDescriptions(patient).map((description) => ({
    problema: description,
    mensagem: '',
    gravidade: '',
    acaoEsperada: '',
    motivo: '',
  }));
}

export function RoundWorkspace({ patients }: { patients: Patient[] }) {
  const [patientList, setPatientList] = useState(patients);
  const [selectedCarePost, setSelectedCarePost] = useState('');
  const [patientId, setPatientId] = useState('');
  const [activeRoundPatientId, setActiveRoundPatientId] = useState('');
  const [activeTab, setActiveTab] = useState(roundTabs[0]);
  const [state, setState] = useState<RoundState>(() => freshEmptyState());
  const [savedAt, setSavedAt] = useState('');
  const [savedBy, setSavedBy] = useState('Equipe do round');
  const [lastSaveInfo, setLastSaveInfo] = useState('');
  const [prefillReview, setPrefillReview] = useState<{ visible: boolean; summary: string }>({ visible: false, summary: '' });
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ nomePaciente: '', leito: '', prontuario: '', unidade: 'UTI Adulto', dataNascimento: '', previsaoAlta: '', diagnosticoAtual: '' });
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveData, setArchiveData] = useState({ desfecho: '', dataDesfecho: '' });
  const [therapeuticPlanOpen, setTherapeuticPlanOpen] = useState(false);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const storageKey = useMemo(() => `round-draft-${patientId || 'sem-paciente'}`, [patientId]);
  const filteredPatients = useMemo(
    () => selectedCarePost ? patientList.filter((item) => patientCarePost(item) === selectedCarePost) : [],
    [patientList, selectedCarePost],
  );
  const patient = patientList.find((item) => item.idPaciente === patientId);
  const autoGoals = useMemo(() => buildAutoGoals(state.bundle, state.dispositivos), [state.bundle, state.dispositivos]);
  const nextGoals = useMemo(() => mergeAutoGoals(state.metas, autoGoals, state.deletedAutoGoalKeys), [state.metas, autoGoals, state.deletedAutoGoalKeys]);
  const delayedPendencies = state.metasAnteriores.filter((goal) => goal.status === 'Atrasado').map((goal) => goal.meta).filter(Boolean);
  const pendencies = useMemo(() => mergePendencies(state.pendencias, delayedPendencies), [state.pendencias, delayedPendencies]);
  const hdAntibioticAlert = state.assistencia.pacienteEmHD === 'Sim'
    && state.assistencia.antibioticoEmUso === 'Sim'
    && !['Sim', 'Não se aplica'].includes(String(state.assistencia.ajusteAntibioticoDialise || ''));
  const therapeuticPlanPatient = useMemo(() => patient ? {
    ...patient,
    problemaAtivoPrincipal: state.problemaAtivoPrincipal || patient.problemaAtivoPrincipal,
    evolucaoPaciente: state.evolucaoPaciente || patient.evolucaoPaciente,
    metasPendentesAnterioresResumo: state.metasAnteriores.map(formatGoalSummaryLine).filter(Boolean).join('\n') || patient.metasPendentesAnterioresResumo,
    metasProximas24hResumo: nextGoals.map(formatGoalSummaryLine).filter(Boolean).join('\n') || patient.metasProximas24hResumo || patient.metasResumo,
    pendenciasResumo: pendencies.filter(Boolean).join('\n') || patient.pendenciasResumo,
    riscosAtivos: summarizeActiveRisks(state.riscos) || patient.riscosAtivos,
  } : null, [patient, state.problemaAtivoPrincipal, state.evolucaoPaciente, state.metasAnteriores, state.riscos, nextGoals, pendencies]);
  const therapeuticPlanText = therapeuticPlanPatient ? buildEvolution(therapeuticPlanPatient) : '';

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    setLoadError('');
    setActiveRoundPatientId('');
    setState(freshEmptyState());
    setSavedAt('');
    setLastSaveInfo('');
    setPrefillReview({ visible: false, summary: '' });
    startRound(patientId)
      .then((payload) => {
        if (!active) return;
        const stored = window.localStorage.getItem(storageKey);
        const loadedState = fromPayload(payload);
        setState(stored ? { ...loadedState, ...JSON.parse(stored), idRound: payload.round?.idRound || '' } : loadedState);
        setActiveRoundPatientId(patientId);
        const lastInfo = lastSaveLabel(payload.metadata?.ultimoSalvamentoAtual || payload.metadata?.ultimoSalvamentoAnterior);
        setLastSaveInfo(lastInfo);
        setSavedAt(lastInfo);
        setPrefillReview({
          visible: Boolean(!stored && payload.metadata?.prefillDisponivel),
          summary: buildPrefillSummary(payload),
        });
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : 'Não foi possível abrir o round.');
        const stored = window.localStorage.getItem(storageKey);
        setState(stored ? JSON.parse(stored) : freshEmptyState());
      });

    return () => {
      active = false;
    };
  }, [patientId, storageKey]);

  useEffect(() => {
    if (!patientId || !state.idRound || activeRoundPatientId !== patientId) return;
    const payload = serializeState({ ...state, metas: nextGoals, pendencias: pendencies });
    window.localStorage.setItem(storageKey, JSON.stringify({ ...state, metas: nextGoals, pendencias: pendencies }));

    const timer = window.setTimeout(() => {
      persistRound(false);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [state, nextGoals, pendencies, patientId, state.idRound, storageKey, savedBy, activeRoundPatientId]);

  function selectPatient(idPaciente: string, resetDraft = false) {
    if (resetDraft) window.localStorage.removeItem(`round-draft-${idPaciente || 'sem-paciente'}`);
    setActiveRoundPatientId('');
    setActiveTab(roundTabs[0]);
    setState(freshEmptyState());
    setSavedAt('');
    setLastSaveInfo('');
    setPrefillReview({ visible: false, summary: '' });
    setArchiveOpen(false);
    setTherapeuticPlanOpen(false);
    setAlertPanelOpen(false);
    setArchiveData({ desfecho: '', dataDesfecho: '' });
    setPatientId(idPaciente);
  }

  function selectCarePost(post: string) {
    setSelectedCarePost(post);
    setNewPatient((current) => ({ ...current, unidade: post }));
    selectPatient('', true);
  }

  function patch(patchValue: Partial<RoundState>) {
    setState((current) => ({ ...current, ...patchValue }));
  }

  function updateGroup(group: 'bundle' | 'assistencia' | 'riscos', field: string, value: any) {
    setState((current) => ({ ...current, [group]: { ...current[group], [field]: value } }));
  }

  function toggleProfessional(professional: string, checked: boolean) {
    patch({
      equipesPresentes: checked
        ? [...new Set([...state.equipesPresentes, professional])]
        : state.equipesPresentes.filter((item) => item !== professional),
    });
  }

  async function persistRound(showFeedback = true, nextStatus?: string) {
    if (!state.idRound) return false;
    const nextState = { ...state, statusRound: nextStatus || state.statusRound, metas: nextGoals, pendencias: pendencies };
    const payload = { ...serializeState(nextState), usuarioSalvamento: savedBy || 'Equipe do round' };
    try {
      const response = await saveRound(state.idRound, payload);
      setSaveError('');
      const label = lastSaveLabel(response.metadata?.ultimoSalvamentoAtual) || new Date().toLocaleString('pt-BR');
      setSavedAt(label);
      setLastSaveInfo(label);
      window.localStorage.removeItem(storageKey);
      if (showFeedback) setPrefillReview((current) => ({ ...current, visible: false }));
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Falha ao salvar na API. Rascunho local mantido.');
      return false;
    }
  }

  async function finalizeRound() {
    patch({ statusRound: 'Finalizado' });
    const saved = await persistRound(true, 'Finalizado');
    if (!saved) return;
    setPatientList((current) => current.map((item) => item.idPaciente === patientId ? { ...item, statusRound: 'Finalizado' } : item));
    setPatientId('');
    setActiveRoundPatientId('');
    setState(freshEmptyState());
    setActiveTab(roundTabs[0]);
    setPrefillReview({ visible: false, summary: '' });
  }

  async function copyTherapeuticPlan() {
    if (!therapeuticPlanText) return;
    await navigator.clipboard.writeText(therapeuticPlanText);
  }

  async function createPatient() {
    try {
      const created = await savePatient(newPatient);
      setPatientList((current) => [...current.filter((item) => item.idPaciente !== created.idPaciente), created]);
      selectPatient(created.idPaciente, true);
      setNewPatientOpen(false);
      setNewPatient({ nomePaciente: '', leito: '', prontuario: '', unidade: selectedCarePost || 'UTI Adulto', dataNascimento: '', previsaoAlta: '', diagnosticoAtual: '' });
      setSaveError('');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível adicionar o paciente.');
    }
  }

  async function archiveCurrentPatient() {
    if (!patient) return;
    if (!archiveData.desfecho || !archiveData.dataDesfecho) {
      setSaveError('Informe o desfecho e a data do desfecho antes de excluir o card.');
      return;
    }
    try {
      await archivePatient(patient.idPaciente, { desfecho: archiveData.desfecho, dataDesfecho: archiveData.dataDesfecho });
      const remaining = patientList.filter((item) => item.idPaciente !== patient.idPaciente);
      setPatientList(remaining);
      selectPatient(remaining[0]?.idPaciente || '', true);
      setSaveError('');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível excluir o card do paciente.');
    }
  }

  return (
    <div className="round-workspace">
      <section className="panel round-entry">
        <div className="round-entry-head">
          <div className="round-entry-icon"><Building2 size={22} /></div>
          <div>
            <p className="eyebrow">Início do round</p>
            <h2>Selecione o posto assistencial</h2>
          </div>
        </div>
        <div className="care-post-grid" role="list" aria-label="Postos assistenciais">
          {carePosts.map((post) => (
            <button
              className={selectedCarePost === post ? 'care-post-card active' : 'care-post-card'}
              key={post}
              type="button"
              onClick={() => selectCarePost(post)}
            >
              <Building2 size={18} />
              <strong>{post}</strong>
              <span>{patientList.filter((item) => patientCarePost(item) === post).length} pacientes</span>
            </button>
          ))}
        </div>
        {selectedCarePost ? (
          <div className="bed-selector">
            <div className="panel-head">
              <h2>Leitos do {selectedCarePost}</h2>
              <span>{filteredPatients.length} pacientes ativos</span>
            </div>
            <div className="bed-card-grid">
              {filteredPatients.length ? filteredPatients.map((item) => (
                <button
                  className={patientId === item.idPaciente ? 'bed-card active' : 'bed-card'}
                  key={item.idPaciente}
                  type="button"
                  onClick={() => selectPatient(item.idPaciente)}
                >
                  <span className="bed-icon"><Bed size={22} /></span>
                  <span>
                    <strong>Leito {item.leito || '--'}</strong>
                    <small>{item.nomePaciente}</small>
                    <small className={Number(item.alertasAbertos || 0) > 0 ? 'bed-alert active' : 'bed-alert'}>
                      {patientAlertSummary(item)}
                    </small>
                    {Number(item.alertasAbertos || 0) > 0 ? (
                      <span className="bed-alert-list">
                        {patientAlertDescriptions(item).slice(0, 2).map((alert, alertIndex) => <span key={`${alert}-${alertIndex}`}>{alert}</span>)}
                        {patientAlertDescriptions(item).length > 2 ? <span>+{patientAlertDescriptions(item).length - 2} alertas</span> : null}
                      </span>
                    ) : null}
                  </span>
                </button>
              )) : <div className="empty compact-empty">Nenhum paciente ativo neste posto.</div>}
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel round-toolbar">
        <div className="round-actions">
          <label className="saved-by">
            <span>Usuário</span>
            <input value={savedBy} onChange={(event) => setSavedBy(event.target.value)} />
          </label>
          <span className="autosave"><Save size={16} /> {savedAt ? `Salvo em ${savedAt}` : 'Salvamento automático'}</span>
          <button className="secondary-action" type="button" onClick={() => { setNewPatient((current) => ({ ...current, unidade: selectedCarePost || current.unidade })); setNewPatientOpen(true); }}>
            <UserPlus size={18} />
            Novo paciente
          </button>
          <button className="secondary-action" type="button" disabled={!patientId || !state.idRound} onClick={() => persistRound(true)}>
            <Save size={18} />
            Salvar
          </button>
          <button className="primary-action" type="button" disabled={!patientId || !state.idRound} onClick={finalizeRound}>
            <CheckCircle2 size={18} />
            Finalizar Round
          </button>
        </div>
      </section>

      {patient ? (
        <section className="panel patient-strip">
          <div className="selected-patient-title">
            <span className="bed-icon"><Bed size={22} /></span>
            <div>
              <strong>Leito {patient.leito} - {patient.nomePaciente}</strong>
              <small>{patient.unidade || patientCarePost(patient)}</small>
            </div>
          </div>
          <span>{patient.diagnosticoAtual || 'Sem diagnóstico atual'}</span>
          <span>{patient.riscosAtivos || 'Sem riscos identificados'}</span>
          <button className="primary-action plan-action" type="button" onClick={() => setTherapeuticPlanOpen((current) => !current)}>
            <FileText size={16} />
            Gerar plano terapêutico
          </button>
          {patientAlertDetails(patient).length ? (
            <button className="secondary-action plan-action alert-action" type="button" onClick={() => setAlertPanelOpen((current) => !current)}>
              <AlertTriangle size={16} />
              {alertPanelOpen ? 'Ocultar alertas' : 'Ver alertas'}
            </button>
          ) : null}
          <button className="secondary-action danger-action" type="button" onClick={() => setArchiveOpen(true)}>
            <Trash2 size={16} />
            Excluir card
          </button>
        </section>
      ) : <section className="panel"><div className="empty">Selecione um paciente para abrir o card do round.</div></section>}
      {patient && alertPanelOpen && patientAlertDetails(patient).length ? (
        <section className="panel round-alert-detail open">
          <div className="round-alert-head">
            <div className="round-alert-title">
              <AlertTriangle size={18} />
              <div>
                <h2>Alertas do paciente</h2>
                <span>{patientAlertSummary(patient)}</span>
              </div>
            </div>
            <button className="secondary-action" type="button" onClick={() => setAlertPanelOpen(false)}>Fechar</button>
          </div>
          <div className="round-alert-list">
            {patientAlertDetails(patient).map((alert, alertIndex) => (
              <article className="round-alert-item" key={String(alert.idAlerta || alert.codigo || `${alert.problema}-${alertIndex}`)}>
                <div>
                  <strong>{alert.problema || alert.tipoAlerta || 'Alerta assistencial'}</strong>
                  {alert.gravidade ? <span>{alert.gravidade}</span> : null}
                </div>
                {alert.mensagem ? <p>{alert.mensagem}</p> : null}
                {alert.acaoEsperada ? <small>Conduta esperada: {alert.acaoEsperada}</small> : null}
                {alert.motivo || alert.condicao ? <small>Critério: {alert.motivo || alert.condicao}</small> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {patient && therapeuticPlanOpen ? (
        <section className="panel integrated-plan">
          <div className="panel-head">
            <div>
              <h2>Plano terapêutico</h2>
              <span>Gerado com os dados atuais do round</span>
            </div>
            <div className="round-actions">
              <button className="secondary-action" type="button" onClick={copyTherapeuticPlan}>
                <Copy size={16} />
                Copiar
              </button>
              <button className="secondary-action" type="button" onClick={() => setTherapeuticPlanOpen(false)}>Fechar</button>
            </div>
          </div>
          <pre className="evolution-text">{therapeuticPlanText}</pre>
        </section>
      ) : null}
      {archiveOpen && patient ? (
        <section className="panel archive-panel">
          <div>
            <h2>Excluir card do paciente</h2>
            <p>{patient.leito} - {patient.nomePaciente}</p>
          </div>
          <SelectField label="Desfecho" options={outcomeOptions} value={archiveData.desfecho} onChange={(value) => setArchiveData((current) => ({ ...current, desfecho: value }))} />
          <Field label="Data do desfecho" type="date" value={archiveData.dataDesfecho} onChange={(value) => setArchiveData((current) => ({ ...current, dataDesfecho: value }))} />
          <div className="round-actions">
            <button className="secondary-action" type="button" onClick={() => setArchiveOpen(false)}>Cancelar</button>
            <button className="primary-action danger-primary" type="button" onClick={archiveCurrentPatient}>Confirmar exclusão</button>
          </div>
        </section>
      ) : null}

      {loadError ? <div className="banner">{loadError}</div> : null}
      {saveError ? <div className="banner">{saveError}</div> : null}
      {hdAntibioticAlert ? <div className="banner urgent">Paciente em HD e em uso de antibiótico. Confirmar ajuste da antibióticoterapia considerando o tratamento dialítico.</div> : null}
      {lastSaveInfo ? <div className="banner info">Último salvamento: {lastSaveInfo}</div> : null}
      {patient && prefillReview.visible ? (
        <section className="panel round-memory">
          <div>
            <h2>Resumo do quadro anterior</h2>
            <p>{prefillReview.summary}</p>
          </div>
        </section>
      ) : null}
      {newPatientOpen ? (
        <section className="panel quick-patient">
          <div className="panel-head">
            <h2>Novo paciente no round</h2>
            <button className="icon-action" type="button" aria-label="Fechar cadastro" onClick={() => setNewPatientOpen(false)}><X size={16} /></button>
          </div>
          <div className="form-grid">
            <Field label="Nome do paciente" value={newPatient.nomePaciente} onChange={(value) => setNewPatient((current) => ({ ...current, nomePaciente: value }))} />
            <Field label="Leito" value={newPatient.leito} onChange={(value) => setNewPatient((current) => ({ ...current, leito: value }))} />
            <Field label="Prontuário" value={newPatient.prontuario} onChange={(value) => setNewPatient((current) => ({ ...current, prontuario: value }))} />
            <Field label="Data de nascimento" type="date" value={newPatient.dataNascimento} onChange={(value) => setNewPatient((current) => ({ ...current, dataNascimento: value }))} />
            <Field label="Previsão de alta" type="date" value={newPatient.previsaoAlta} onChange={(value) => setNewPatient((current) => ({ ...current, previsaoAlta: value }))} />
            <Field label="Unidade" value={newPatient.unidade} onChange={(value) => setNewPatient((current) => ({ ...current, unidade: value }))} />
            <TextareaField label="Diagnóstico atual" value={newPatient.diagnosticoAtual} onChange={(value) => setNewPatient((current) => ({ ...current, diagnosticoAtual: value }))} />
          </div>
          <button className="primary-action" type="button" onClick={createPatient}><UserPlus size={18} /> Adicionar ao round</button>
        </section>
      ) : null}

      {patient ? (
      <>
      <section className="panel round-section">
        <div className="panel-head">
          <h2>Profissionais presentes na discussão</h2>
          <span>{state.statusRound === 'Finalizado' ? 'Finalizado' : 'Em preenchimento'}</span>
        </div>
        <div className="checkbox-grid">
          {professionals.map((professional) => (
            <label className="check-option" key={professional}>
              <input type="checkbox" checked={state.equipesPresentes.includes(professional)} onChange={(event) => toggleProfessional(professional, event.target.checked)} />
              <span>{professional}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="panel round-section">
        <div className="panel-head">
          <h2>Síntese diária</h2>
          <span>Problema, barreiras e evolução</span>
        </div>
        <div className="field-table">
          <TextareaField label="Problema ativo" value={state.problemaAtivoPrincipal} onChange={(value) => patch({ problemaAtivoPrincipal: value })} />
          <TextareaField label="Barreiras para alta" value={state.barreirasAlta} onChange={(value) => patch({ barreirasAlta: value })} />
          <SelectField label="Evolução" options={['Melhorou', 'Deteriorou', 'Estável']} value={state.evolucaoPaciente} onChange={(value) => patch({ evolucaoPaciente: value })} />
        </div>
      </section>

      <section className="panel round-section">
        <div className="panel-head">
          <h2>Metas das últimas 24h</h2>
          <span>Apenas status editável</span>
        </div>
        <PreviousGoals goals={state.metasAnteriores} onChange={(metasAnteriores) => patch({ metasAnteriores })} />
      </section>

      <section className="panel round-section">
        <div className="panel-head">
          <h2>Metas para as próximas 24h</h2>
          <span>Automáticas e manuais</span>
        </div>
        <GoalEditor
          goals={nextGoals}
          onChange={(metas) => patch({
            metas,
            deletedAutoGoalKeys: [
              ...state.deletedAutoGoalKeys,
              ...nextGoals
                .filter((goal) => goal.autoKey && !metas.some((item) => item.autoKey === goal.autoKey))
                .map((goal) => String(goal.autoKey)),
            ],
          })}
        />
      </section>

      <section className="panel round-section">
        <div className="panel-head">
          <h2>Pendências</h2>
          <span>Inclui metas atrasadas automaticamente</span>
        </div>
        <StringList values={pendencies} onChange={(pendencias) => patch({ pendencias })} placeholder="Descreva a pendência" />
      </section>

      <section className="panel round-section">
        <div className="round-tabs" role="tablist" aria-label="Areas do round">
          {roundTabs.map((tab) => (
            <button className={tab === activeTab ? 'active' : ''} key={tab} type="button" onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
        <div className="tab-panel">
          {activeTab === 'Bundle ABCDEF' ? <BundleTab state={state} update={updateGroup} /> : null}
          {activeTab === 'Alimentação' ? <NutritionTab state={state} update={updateGroup} /> : null}
          {activeTab === 'Riscos e Profilaxias' ? <RisksTab state={state} update={updateGroup} /> : null}
          {activeTab === 'Hemodinâmica e Respiratória' ? <HemoRespTab state={state} update={updateGroup} /> : null}
          {activeTab === 'Renal' ? <RenalTab state={state} update={updateGroup} /> : null}
          {activeTab === 'Infecção' ? <InfectionTab infections={state.infeccoes} onChange={(infeccoes) => patch({ infeccoes })} /> : null}
          {activeTab === 'Dispositivos' ? <DevicesTab devices={state.dispositivos} onChange={(dispositivos) => patch({ dispositivos })} /> : null}
          {activeTab === 'Lesão' ? <LesionsTab lesions={state.lesoes} onChange={(lesoes) => patch({ lesoes })} /> : null}
        </div>
      </section>
      </>
      ) : null}
    </div>
  );
}

function BundleTab({ state, update }: { state: RoundState; update: (group: 'bundle', field: string, value: any) => void }) {
  const bundle = state.bundle;
  const canMobilize = bundle.podeMobilizarHoje === 'Sim';
  return (
    <div className="tab-stack">
      <section className="round-subsection">
        <h3>A. Analgesia e Sedação</h3>
        <div className="field-table">
          <SelectField label="Analgesia adequada" options={yesNoNa} value={bundle.analgesiaAdequada || ''} onChange={(value) => update('bundle', 'analgesiaAdequada', value)} />
          <SelectField label="Pode reduzir a sedação" options={yesNoNa} value={bundle.podeReduzirSedacao || ''} onChange={(value) => update('bundle', 'podeReduzirSedacao', value)} />
          <SelectField label="Realizar despertar diário" options={yesNoNa} value={bundle.despertarDiario || ''} onChange={(value) => update('bundle', 'despertarDiario', value)} />
          <Field label="Alvo RASS" value={bundle.alvoRASS || ''} onChange={(value) => update('bundle', 'alvoRASS', value)} />
          {bundle.podeReduzirSedacao === 'Não' ? <SelectField label="Justificativa para não reduzir sedação" options={sedationReasons} value={bundle.justificativaNaoReducaoSedacao || ''} onChange={(value) => update('bundle', 'justificativaNaoReducaoSedacao', value)} /> : null}
          {bundle.justificativaNaoReducaoSedacao === 'Outros' ? <Field label="Outra justificativa para não reduzir sedação" value={bundle.outroJustificativaSedacao || ''} onChange={(value) => update('bundle', 'outroJustificativaSedacao', value)} /> : null}
        </div>
      </section>
      <section className="round-subsection">
        <h3>Respiracao e Mobilidade</h3>
        <div className="field-table">
          <SelectField label="Iniciar Desmame Ventilatório" options={yesNoNa} value={bundle.podeIniciarDesmame || ''} onChange={(value) => update('bundle', 'podeIniciarDesmame', value)} />
          <SelectField label="Realizar TRE" options={yesNoNa} value={bundle.indicacaoTRE || ''} onChange={(value) => update('bundle', 'indicacaoTRE', value)} />
          <SelectField label="Realizar Extubação" options={yesNoNa} value={bundle.realizarExtubacao || ''} onChange={(value) => update('bundle', 'realizarExtubacao', value)} />
          <SelectField label="Possivel mobilizar o paciente" options={yesNo} value={bundle.podeMobilizarHoje || ''} onChange={(value) => update('bundle', 'podeMobilizarHoje', value)} />
          {canMobilize ? (
            <>
              <SelectField label="Nível de mobilidade atual" options={mobilityLevels} value={bundle.nivelMobilidade || ''} onChange={(value) => update('bundle', 'nivelMobilidade', value)} />
              <SelectField label="Meta de Progressao de mobilidade" options={mobilityLevels} value={bundle.progredirMobilidade || ''} onChange={(value) => update('bundle', 'progredirMobilidade', value)} />
            </>
          ) : <SelectField label="Justificativa para não mobilizar" options={['Instabilidade Hemodinâmica', 'Contraindicação por TEV']} value={bundle.justificativaNaoMobilizar || ''} onChange={(value) => update('bundle', 'justificativaNaoMobilizar', value)} />}
        </div>
      </section>
      <section className="round-subsection">
        <h3>Família</h3>
        <label className="check-option">
          <input type="checkbox" checked={bundle.familiaInformadaPlano === 'Sim'} onChange={(event) => update('bundle', 'familiaInformadaPlano', event.target.checked ? 'Sim' : '')} />
          <span>Família informada sobre quadro clínico e plano terapêutico</span>
        </label>
      </section>
    </div>
  );
}

function HemoRespTab({ state, update }: { state: RoundState; update: (group: 'assistencia', field: string, value: any) => void }) {
  const a = state.assistencia;
  return (
    <div className="tab-stack">
      <section className="round-subsection">
        <h3>Hemodinâmica</h3>
        <div className="field-table">
          <SelectField label="Instabilidade nas últimas horas" options={yesNo} value={a.instabilidadeUltimasHoras || ''} onChange={(value) => update('assistencia', 'instabilidadeUltimasHoras', value)} />
          <SelectField label="Uso de drogas vasoativas" options={yesNo} value={a.usoDrogaVasoativa || ''} onChange={(value) => update('assistencia', 'usoDrogaVasoativa', value)} />
          <SelectField label="Aumento de dose da droga vasoativa" options={yesNo} value={a.aumentoDoseDrogaVasoativa || ''} onChange={(value) => update('assistencia', 'aumentoDoseDrogaVasoativa', value)} />
        </div>
      </section>
      <section className="round-subsection">
        <h3>Respiratória</h3>
        <div className="field-table">
          <SelectField label="Suporte" options={respiratorySupport} value={a.suporteRespiratorio || ''} onChange={(value) => update('assistencia', 'suporteRespiratorio', value)} />
          <SelectField label="Via Aérea" options={airways} value={a.viaAerea || ''} onChange={(value) => update('assistencia', 'viaAerea', value)} />
          <SelectField label="Modo Ventilatório" options={ventilatoryModes} value={a.modoVentilatorioAtual || ''} onChange={(value) => update('assistencia', 'modoVentilatorioAtual', value)} />
          <Field label="Início do modo ventilatório" type="date" value={a.dataInicioModoVentilatorio || ''} onChange={(value) => update('assistencia', 'dataInicioModoVentilatorio', value)} />
          <ReadOnly label="Tempo no modo" value={`${daysSince(a.dataInicioModoVentilatorio)} dia(s)`} />
          <SelectField label="Status do Suporte Ventilatório" options={supportStatus} value={a.statusSuporteVentilatorio || ''} onChange={(value) => update('assistencia', 'statusSuporteVentilatorio', value)} />
        </div>
      </section>
    </div>
  );
}

function RenalTab({ state, update }: { state: RoundState; update: (group: 'assistencia', field: string, value: any) => void }) {
  const a = state.assistencia;
  return (
    <div className="field-table">
      <SelectField label="Paciente em HD" options={yesNo} value={a.pacienteEmHD || ''} onChange={(value) => update('assistencia', 'pacienteEmHD', value)} />
      {a.pacienteEmHD === 'Sim' ? <SelectField label="Tipo HD" options={hdTypes} value={a.tipoHD || ''} onChange={(value) => update('assistencia', 'tipoHD', value)} /> : null}
      <SelectField label="Antibiótico em uso" options={yesNo} value={a.antibioticoEmUso || ''} onChange={(value) => update('assistencia', 'antibioticoEmUso', value)} />
      <SelectField label="Ajuste da antibióticoterapia considerando HD?" options={yesNoNa} value={a.ajusteAntibioticoDialise || ''} onChange={(value) => update('assistencia', 'ajusteAntibioticoDialise', value)} />
    </div>
  );
}

function NutritionTab({ state, update }: { state: RoundState; update: (group: 'assistencia', field: string, value: any) => void }) {
  const a = state.assistencia;
  const vias = Array.isArray(a.viasAlimentacao) ? a.viasAlimentacao : String(a.viasAlimentacao || '').split(',').map((x) => x.trim()).filter(Boolean);
  const toggle = (via: string, checked: boolean) => update('assistencia', 'viasAlimentacao', checked ? [...new Set([...vias, via])] : vias.filter((item) => item !== via));
  return (
    <div className="tab-stack">
      <div className="checkbox-grid">
        {['Via Oral', 'Via Enteral', 'Via Parenteral', 'Dieta Zero'].map((via) => (
          <label className="check-option" key={via}>
            <input type="checkbox" checked={vias.includes(via)} onChange={(event) => toggle(via, event.target.checked)} />
            <span>{via}</span>
          </label>
        ))}
      </div>
      <div className="field-table">
        {vias.includes('Via Enteral') ? (
          <>
            <Field label="Data de Início da Terapia Nutricional Enteral" type="date" value={a.tneDataInicio || ''} onChange={(value) => update('assistencia', 'tneDataInicio', value)} />
            <SelectField label="VET Pleno Enteral" options={yesNo} value={a.tneVetPleno || ''} onChange={(value) => update('assistencia', 'tneVetPleno', value)} />
            {a.tneVetPleno === 'Não' ? <Field label="% Adequação da Terapia Nutricional Enteral" type="number" value={a.tneAdequacaoPercentual || ''} onChange={(value) => update('assistencia', 'tneAdequacaoPercentual', value)} /> : null}
          </>
        ) : null}
        {vias.includes('Via Parenteral') ? (
          <>
            <Field label="Data de Início da Terapia Nutricional Parenteral" type="date" value={a.tnpDataInicio || ''} onChange={(value) => update('assistencia', 'tnpDataInicio', value)} />
            <SelectField label="VET Pleno Parenteral" options={yesNo} value={a.tnpVetPleno || ''} onChange={(value) => update('assistencia', 'tnpVetPleno', value)} />
            {a.tnpVetPleno === 'Não' ? <Field label="% Adequação da Terapia Nutricional Parenteral" type="number" value={a.tnpAdequacaoPercentual || ''} onChange={(value) => update('assistencia', 'tnpAdequacaoPercentual', value)} /> : null}
          </>
        ) : null}
        {vias.includes('Dieta Zero') ? (
          <>
            <Field label="Data de Início Dieta Zero" type="date" value={a.npoDataInicio || ''} onChange={(value) => update('assistencia', 'npoDataInicio', value)} />
            <ReadOnly label="Dias em dieta zero" value={`${daysSince(a.npoDataInicio)} dia(s)`} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function InfectionTab({ infections, onChange }: { infections: Infection[]; onChange: (items: Infection[]) => void }) {
  return (
    <div className="tab-stack">
      <div className="infection-table-wrap">
        <div className="infection-table" role="table" aria-label="Infecções e antibióticos">
          <div className="infection-row infection-head" role="row">
            <span>Suspeita ativa</span>
            <span>Foco</span>
            <span>Outro foco</span>
            <span>Antibiótico</span>
            <span>Início</span>
            <span>Dias previstos</span>
            <span>Término provável</span>
            <span>Melhora?</span>
            <span>Conduta</span>
            <span></span>
          </div>
          {infections.map((infection, index) => (
            <div className="infection-row" role="row" key={index}>
              <select aria-label="Suspeita de infecção ativa" value={infection.suspeitaInfeccaoAtiva || ''} onChange={(event) => updateArray(infections, onChange, index, { suspeitaInfeccaoAtiva: event.target.value })}>
                <option value="">Selecione</option>
                {yesNo.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <select aria-label="Provavel foco" value={infection.provavelFoco || ''} onChange={(event) => updateArray(infections, onChange, index, { provavelFoco: event.target.value })}>
                <option value="">Selecione</option>
                {infectionFocus.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <input aria-label="Descrever outro foco" disabled={infection.provavelFoco !== 'Outros'} value={infection.outroFoco || ''} onChange={(event) => updateArray(infections, onChange, index, { outroFoco: event.target.value })} />
              <input aria-label="Antibiótico" value={infection.nomeAntibiotico || ''} onChange={(event) => updateArray(infections, onChange, index, { nomeAntibiotico: event.target.value })} />
          <input aria-label="Início do antibiótico" inputMode="numeric" placeholder="dd/mm/aaaa" value={brazilianDateInput(infection.dataInicioAntibiotico)} onChange={(event) => updateArray(infections, onChange, index, { dataInicioAntibiotico: normalizeBrazilianDateInput(event.target.value) })} />
              <input aria-label="Dias previstos" type="number" min="1" value={infection.tempoTratamentoPrevistoDias || ''} onChange={(event) => updateArray(infections, onChange, index, { tempoTratamentoPrevistoDias: event.target.value })} />
              <input aria-label="Término provável" readOnly value={endDateLabel(infection.dataInicioAntibiotico, infection.tempoTratamentoPrevistoDias)} />
              <select aria-label="Melhora" value={infection.melhoraParametrosInfeccao || ''} onChange={(event) => updateArray(infections, onChange, index, { melhoraParametrosInfeccao: event.target.value })}>
                <option value="">Selecione</option>
                {yesNo.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <select aria-label="Conduta" value={infection.condutaSemMelhora || ''} onChange={(event) => updateArray(infections, onChange, index, { condutaSemMelhora: event.target.value })}>
                <option value="">Selecione</option>
                {antibioticConduct.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <button className="icon-action" type="button" aria-label="Excluir antibiótico" onClick={() => onChange(infections.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
      <button className="secondary-action" type="button" onClick={() => onChange([...infections, { suspeitaInfeccaoAtiva: '', provavelFoco: '', nomeAntibiotico: '' }])}><Plus size={16} /> Adicionar antibiótico</button>
    </div>
  );
}

function DevicesTab({ devices, onChange }: { devices: Device[]; onChange: (items: Device[]) => void }) {
  function remove(index: number) {
    const date = window.prompt('Informe a data de retirada/exclusão do dispositivo (dd/mm/aaaa).');
    if (!date) return;
    updateArray(devices, onChange, index, { presente: 'Não', dataRetirada: normalizeBrazilianDateInput(date), statusDispositivo: 'Retirado' });
  }

  function updateConduct(index: number, conduta: string) {
    updateArray(devices, onChange, index, {
      conduta,
      podeRetirarHoje: conduta === 'Retirar hoje' ? 'Sim' : '',
      dataUltimaReavaliacao: new Date().toISOString().slice(0, 10),
    });
  }

  return (
    <div className="tab-stack">
      <div className="round-table-wrap">
        <div className="device-table control-device-table" role="table" aria-label="Dispositivos">
          <div className="device-row table-head-row" role="row">
            <span>Tipo</span>
            <span>Outro</span>
            <span>Sítio</span>
            <span>Inserção</span>
            <span>Hora</span>
            <span>Dias</span>
            <span>Conduta</span>
            <span>Justificativa para permanência</span>
            <span></span>
          </div>
          {devices.map((device, index) => (
            <div className="device-row" role="row" key={index}>
              <select aria-label="Tipo do dispositivo" value={device.tipoDispositivo || ''} onChange={(event) => updateArray(devices, onChange, index, { tipoDispositivo: event.target.value })}>
                <option value="">Selecione</option>
                {deviceTypes.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <input aria-label="Descrição do tipo" disabled={device.tipoDispositivo !== 'Outro'} value={device.outroTipo || ''} onChange={(event) => updateArray(devices, onChange, index, { outroTipo: event.target.value })} />
              <input aria-label="Sítio" value={device.sitio || ''} onChange={(event) => updateArray(devices, onChange, index, { sitio: event.target.value })} />
              <input aria-label="Data de inserção" inputMode="numeric" placeholder="dd/mm/aaaa" value={brazilianDateInput(device.dataInsercao)} onChange={(event) => updateArray(devices, onChange, index, { dataInsercao: normalizeBrazilianDateInput(event.target.value) })} />
              <input aria-label="Hora de inserção" placeholder="hh:mm" value={device.horaInsercao || ''} onChange={(event) => updateArray(devices, onChange, index, { horaInsercao: event.target.value })} />
              <input aria-label="Dias de uso" readOnly value={`${daysSince(device.dataInsercao, device.dataRetirada)}d`} />
              <select aria-label="Conduta" value={device.conduta || ''} onChange={(event) => updateConduct(index, event.target.value)}>
                <option value="">Selecione</option>
                {deviceConductOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <select aria-label="Justificativa para permanência" value={device.justificativaPermanencia || ''} onChange={(event) => updateArray(devices, onChange, index, { justificativaPermanencia: event.target.value, indicacaoInicial: device.indicacaoInicial || event.target.value })}>
                <option value="">Selecione</option>
                {(deviceJustifications[device.tipoDispositivo] || ['Outra indicação técnica']).map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <button className="icon-action" type="button" aria-label="Excluir dispositivo" onClick={() => remove(index)}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
      <button className="secondary-action" type="button" onClick={() => onChange([...devices, { tipoDispositivo: '', presente: 'Sim', sitio: '', podeRetirarHoje: '', statusDispositivo: 'Ativo' }])}><Plus size={16} /> Adicionar dispositivo</button>
    </div>
  );
}

function LesionsTab({ lesions, onChange }: { lesions: Lesion[]; onChange: (items: Lesion[]) => void }) {
  return (
    <div className="tab-stack">
      <label className="check-option">
        <input type="checkbox" checked={lesions.length > 0} onChange={(event) => onChange(event.target.checked ? [{ localLesao: '', estadiamento: '', acompanhamento: '' }] : [])} />
        <span>Presença de Lesão</span>
      </label>
      {lesions.length ? (
        <div className="round-table-wrap">
          <div className="lesion-table" role="table" aria-label="Lesoes">
            <div className="lesion-row table-head-row" role="row">
              <span>Local</span>
              <span>Estadiamento</span>
              <span>Acompanhamento</span>
              <span></span>
            </div>
            {lesions.map((lesion, index) => (
              <div className="lesion-row" role="row" key={index}>
                <input aria-label="Local da lesão" value={lesion.localLesao || ''} onChange={(event) => updateArray(lesions, onChange, index, { localLesao: event.target.value })} />
                <input aria-label="Estadiamento" value={lesion.estadiamento || ''} onChange={(event) => updateArray(lesions, onChange, index, { estadiamento: event.target.value })} />
                <select aria-label="Acompanhamento" value={lesion.acompanhamento || ''} onChange={(event) => updateArray(lesions, onChange, index, { acompanhamento: event.target.value })}>
                  <option value="">Selecione</option>
                  {lesionFollowUp.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <button className="icon-action" type="button" aria-label="Excluir lesão" onClick={() => onChange(lesions.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {lesions.length ? <button className="secondary-action" type="button" onClick={() => onChange([...lesions, { localLesao: '', estadiamento: '', acompanhamento: '' }])}><Plus size={16} /> Adicionar lesão</button> : null}
    </div>
  );
}

function RisksTab({ state, update }: { state: RoundState; update: (group: 'riscos', field: string, value: any) => void }) {
  const risks = state.riscos;
  const riskFields = [
    ['riscoTEV', 'TEV'],
    ['riscoSangramento', 'Sangramento'],
    ['riscoNutricional', 'Nutricional'],
    ['riscoBroncoaspiracao', 'Broncoaspiração'],
    ['riscoInfeccao', 'Infecção'],
    ['riscoLPP', 'LPP'],
    ['riscoDelirium', 'Delirium'],
    ['riscoQueda', 'Queda'],
  ];
  return (
    <div className="tab-stack">
      <section className="round-subsection">
        <h3>Riscos Identificados</h3>
        <div className="checkbox-grid">
          {riskFields.map(([field, label]) => <CheckField key={field} label={label} checked={risks[field] === true || risks[field] === 'Sim'} onChange={(checked) => update('riscos', field, checked)} />)}
        </div>
        <TextareaField label="Outros riscos" value={risks.outrosRiscos || ''} onChange={(value) => update('riscos', 'outrosRiscos', value)} />
      </section>
      <section className="round-subsection">
        <h3>Profilaxia</h3>
        <div className="checkbox-grid">
          <CheckField label="TEV" checked={risks.profilaxiaTEV === true || risks.profilaxiaTEV === 'Sim'} onChange={(checked) => update('riscos', 'profilaxiaTEV', checked)} />
          <CheckField label="LAMG" checked={risks.profilaxiaLAMG === true || risks.profilaxiaLAMG === 'Sim'} onChange={(checked) => update('riscos', 'profilaxiaLAMG', checked)} />
        </div>
      </section>
    </div>
  );
}

function PreviousGoals({ goals, onChange }: { goals: Goal[]; onChange: (goals: Goal[]) => void }) {
  if (!goals.length) return <div className="empty">Sem metas pendentes das últimas 24h.</div>;
  return (
    <div className="previous-goals">
      {goals.map((goal, index) => (
        <div className="previous-goal" key={goal.idMeta || index}>
          <strong>{goal.meta}</strong>
          <span>{[formatDateForDisplay(goal.prazo), goal.responsavel].filter(Boolean).join(' | ') || 'Sem prazo/responsavel'}</span>
          <SelectField label="Status" options={goalStatuses} value={goal.status || 'Pendente'} onChange={(status) => updateArray(goals, onChange, index, { status })} />
        </div>
      ))}
    </div>
  );
}

function GoalEditor({ goals, onChange }: { goals: Goal[]; onChange: (goals: Goal[]) => void }) {
  return (
    <div className="goal-editor">
      {goals.map((goal, index) => (
        <div className="goal-row" key={goal.autoKey || index}>
          <textarea value={goal.meta} onChange={(event) => updateArray(goals, onChange, index, { meta: event.target.value })} />
          <input inputMode="numeric" placeholder="dd/mm/aaaa" value={brazilianDateInput(goal.prazo)} onChange={(event) => updateArray(goals, onChange, index, { prazo: normalizeBrazilianDateInput(event.target.value) })} />
          <input value={goal.responsavel || ''} placeholder="Responsavel" onChange={(event) => updateArray(goals, onChange, index, { responsavel: event.target.value })} />
          <select value={goal.status || 'Pendente'} onChange={(event) => updateArray(goals, onChange, index, { status: event.target.value })}>
            {goalStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className="icon-action" type="button" aria-label="Excluir meta" onClick={() => onChange(goals.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16} /></button>
        </div>
      ))}
      <button className="secondary-action" type="button" onClick={() => onChange([...goals, { meta: '', prazo: '', responsavel: '', status: 'Pendente' }])}><Plus size={16} /> Adicionar meta</button>
    </div>
  );
}

function StringList({ values, onChange, placeholder }: { values: string[]; onChange: (values: string[]) => void; placeholder: string }) {
  return (
    <div className="string-list">
      {values.map((value, index) => (
        <div className="inline-row" key={index}>
          <input value={value} placeholder={placeholder} onChange={(event) => updateArray(values, onChange, index, event.target.value)} />
          <button className="icon-action" type="button" aria-label="Excluir pendência" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><X size={16} /></button>
        </div>
      ))}
      <button className="secondary-action" type="button" onClick={() => onChange([...values, ''])}><Plus size={16} /> Adicionar pendência</button>
    </div>
  );
}

function RowHead({ title, onRemove }: { title: string; onRemove: () => void }) {
  return (
    <div className="row-head">
      <h3>{title}</h3>
      <button className="icon-action" type="button" aria-label="Excluir" onClick={onRemove}><Trash2 size={16} /></button>
    </div>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="check-option">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  if (type === 'date') {
    return (
      <label>
        <span>{label}</span>
        <input inputMode="numeric" maxLength={10} placeholder="dd/mm/aaaa" value={brazilianDateInput(value)} onChange={(event) => onChange(normalizeBrazilianDateInput(event.target.value))} />
      </label>
    );
  }

  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} readOnly />
    </label>
  );
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Selecione</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function fromPayload(payload: RoundPayload): RoundState {
  const prefill = payload.prefill || {};
  const usePreviousAssistance = !hasMeaningfulData(payload.assistencia) && hasMeaningfulData(prefill.assistencia);
  const assistencia = usePreviousAssistance ? prefill.assistencia || {} : payload.assistencia || {};
  const bundle = payload.bundle || {};
  const dispositivos = arrayWithPreviousWhenEmpty(payload.dispositivos, prefill.dispositivos) as Device[];
  const normalizedMetas = (payload.metas || []).map(normalizeGoal);
  const baseState = freshEmptyState();
  return {
    ...baseState,
    idRound: String(payload.round?.idRound || ''),
    problemaAtivoPrincipal: payload.round?.problemaAtivoPrincipal || prefill.round?.problemaAtivoPrincipal || '',
    barreirasAlta: payload.round?.barreirasAlta || prefill.round?.barreirasAlta || '',
    evolucaoPaciente: payload.round?.evolucaoPaciente || prefill.round?.evolucaoPaciente || 'Estável',
    pendencias: String(payload.round?.pendencias || '').split(',').map((item) => item.trim()).filter(Boolean),
    metasAnteriores: (payload.metasAnteriores || []).map(normalizeGoal),
    metas: normalizedMetas.length ? restoreAutoGoalKeys(normalizedMetas, bundle, dispositivos) : baseState.metas,
    bundle,
    assistencia: usePreviousAssistance ? resetDailyAssistanceFields(normalizeAssistance(assistencia)) : normalizeAssistance(assistencia),
    riscos: withPreviousWhenEmpty(payload.riscos, prefill.riscos),
    infeccoes: arrayWithPreviousWhenEmpty(payload.infeccao, prefill.infeccao, baseState.infeccoes) as Infection[],
    dispositivos: dispositivos.length ? dispositivos : baseState.dispositivos,
    lesoes: arrayWithPreviousWhenEmpty(payload.lesoes, prefill.lesoes, []) as Lesion[],
    statusRound: payload.round?.statusRound,
  };
}

function withPreviousWhenEmpty(current?: Dict, previous?: Dict): Dict {
  return hasMeaningfulData(current) ? current || {} : previous || {};
}

function arrayWithPreviousWhenEmpty<T>(current?: T[], previous?: T[], fallback: T[] = []): T[] {
  return current?.length ? current : previous?.length ? previous : fallback;
}

function hasMeaningfulData(value?: Dict): boolean {
  if (!value) return false;
  return Object.values(value).some((item) => Array.isArray(item) ? item.length > 0 : item !== undefined && item !== null && item !== '');
}

function normalizeAssistance(assistencia: Dict): Dict {
  return {
    ...assistencia,
    viasAlimentacao: Array.isArray(assistencia.viasAlimentacao)
      ? assistencia.viasAlimentacao
      : String(assistencia.viasAlimentacao || '').split(',').map((item) => item.trim()).filter(Boolean),
  };
}

function resetDailyAssistanceFields(assistencia: Dict): Dict {
  return {
    ...assistencia,
    tneVetPleno: '',
    tneAdequacaoPercentual: '',
    tnpVetPleno: '',
    tnpAdequacaoPercentual: '',
  };
}

function serializeState(state: RoundState) {
  return {
    equipesPresentes: state.equipesPresentes,
    problemaAtivoPrincipal: state.problemaAtivoPrincipal,
    barreirasAlta: state.barreirasAlta,
    evolucaoPaciente: state.evolucaoPaciente,
    pendencias: state.pendencias.filter(Boolean),
    metasAnteriores: state.metasAnteriores,
    metas: state.metas.filter((goal) => goal.meta).map((goal) => ({
      ...goal,
      conduta: goal.autoKey ? `auto:${goal.autoKey}` : goal.status,
    })),
    bundle: state.bundle,
    assistencia: state.assistencia,
    riscos: state.riscos,
    infeccoes: state.infeccoes.filter((item) => item.suspeitaInfeccaoAtiva || item.provavelFoco || item.nomeAntibiotico),
    dispositivos: state.dispositivos.filter((item) => item.tipoDispositivo || item.sitio),
    lesoes: state.lesoes.filter((item) => item.localLesao || item.estadiamento),
    statusRound: state.statusRound,
  };
}

function normalizeGoal(goal: Dict): Goal {
  const autoKey = typeof goal.conduta === 'string' && goal.conduta.startsWith('auto:') ? goal.conduta.replace('auto:', '') : undefined;
  return {
    idMeta: goal.idMeta,
    meta: goal.meta || '',
    prazo: goal.prazo || '',
    responsavel: goal.responsavel || '',
    status: goal.status || 'Pendente',
    autoKey,
  };
}

function formatGoalSummaryLine(goal: Goal) {
  if (!goal.meta) return '';
  return [goal.meta, goal.prazo || '', goal.responsavel || '', goal.status || 'Pendente'].join(' | ');
}

function summarizeActiveRisks(riscos: Dict) {
  return riskLabels(riscos).join(', ');
}

function restoreAutoGoalKeys(goals: Goal[], bundle: Dict, devices: Device[] = []) {
  const autoByText = new Map(buildAutoGoals(bundle, devices).map((goal) => [goal.meta, goal.autoKey]));
  return goals.map((goal) => goal.autoKey || !autoByText.has(goal.meta)
    ? goal
    : { ...goal, autoKey: autoByText.get(goal.meta) });
}

function deviceLabel(device: Device) {
  return String(device.tipoDispositivo === 'Outro' ? device.outroTipo || 'Outro dispositivo' : device.tipoDispositivo || '').trim();
}

function normalizeText(value?: string) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function buildAutoGoals(bundle: Dict, devices: Device[] = []): Goal[] {
  const rass = bundle.alvoRASS ? ` ${bundle.alvoRASS}` : ' definido';
  const goals: Goal[] = [];
  const add = (autoKey: string, meta: string) => goals.push({ autoKey, meta, prazo: tomorrowDateInput(), responsavel: '', status: 'Pendente' });
  if (bundle.analgesiaAdequada === 'Não') add('analgesia', 'Manter analgesia adequada nas próximas 24h com BPS menor ou igual a 5 ou Escala Analógica <3');
  if (bundle.podeReduzirSedacao === 'Não') add('sedação-nao', `Manter sedação no alvo definido RASS${rass} nas próximas 24h, com reavaliação diária da elegibilidade para redução`);
  if (bundle.podeReduzirSedacao === 'Sim') add('sedação-sim', `Reduzir a Sedação para alcançar RASS${rass}`);
  if (bundle.podeIniciarDesmame === 'Sim') add('desmame', 'Iniciar Desmame Ventilatório');
  if (bundle.indicacaoTRE === 'Sim') add('tre', 'Realizar teste de respiração espontânea');
  if (bundle.despertarDiario === 'Sim') add('despertar', 'Realizar despertar diário nas próximas 24h');
  if (bundle.podeMobilizarHoje === 'Sim') add('mobilidade', `Progredir mobilidade ${bundle.nivelMobilidade || '[nível de mobilidade atual]'} para ${bundle.progredirMobilidade || '[meta de progressão de mobilidade]'}`);
  if (bundle.realizarExtubacao === 'Sim') add('extubação', 'Realizar Extubação nas próximas 24h');
  devices.forEach((device, index) => {
    const label = deviceLabel(device);
    const conduct = normalizeText(device.conduta);
    if (!label) return;
    if (conduct === 'retirar hoje') add(`dispositivo-retirar-${index}-${label}`, `Retirar dispositivo ${label}`);
    if (conduct === 'trocar sitio') add(`dispositivo-trocar-sitio-${index}-${label}`, `Trocar sítio do dispositivo ${label}`);
  });
  return goals;
}

function mergeAutoGoals(manualGoals: Goal[], autoGoals: Goal[], deletedAutoGoalKeys: string[]) {
  const manual = manualGoals.filter((goal) => !goal.autoKey);
  const editedAuto = new Map(manualGoals.filter((goal) => goal.autoKey).map((goal) => [goal.autoKey, goal]));
  const mergedAuto = autoGoals.filter((goal) => String(goal.autoKey).startsWith('dispositivo-') || !deletedAutoGoalKeys.includes(String(goal.autoKey))).map((goal) => {
    const edited = editedAuto.get(goal.autoKey);
    return edited ? { ...goal, ...edited, autoKey: goal.autoKey } : goal;
  });
  return [...mergedAuto, ...(manual.length ? manual : [{ meta: '', prazo: '', responsavel: '', status: 'Pendente' }])];
}

function mergePendencies(manual: string[], automatic: string[]) {
  const clean = manual.filter((item) => !automatic.includes(item));
  return [...automatic, ...(clean.length ? clean : [''])];
}

function lastSaveLabel(info: any) {
  if (!info?.dataHora) return '';
  const date = new Date(info.dataHora);
  const when = Number.isNaN(date.getTime()) ? String(info.dataHora) : date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${when}${info.usuario ? ` por ${info.usuario}` : ''}`;
}

function buildPrefillSummary(payload: RoundPayload) {
  const prefill = payload.prefill || {};
  const assistencia = prefill.assistencia || {};
  const bundle = prefill.bundle || {};
  const riscos = prefill.riscos || {};
  const sentences = [
    respiratoryNarrative(assistencia),
    bundleNarrative(bundle),
    hemodynamicNarrative(assistencia),
    nutritionRenalNarrative(assistencia),
    infectionNarrative(prefill.infeccao || []),
    devicesNarrative(prefill.dispositivos || []),
    lesionsNarrative(prefill.lesoes || []),
    risksNarrative(riscos),
  ].filter((item): item is string => Boolean(item));

  return sentences.length
    ? sentences.join(' ')
    : 'Sem registros estruturados disponíveis no round anterior. Reavaliar o Bundle ABCDEF, confirmar pendências e atualizar as metas das próximas 24 horas.';
}

function respiratoryNarrative(assistencia: Dict) {
  const parts = [
    assistencia.suporteRespiratorio && supportPhrase(assistencia.suporteRespiratorio),
    assistencia.modoVentilatorioAtual && `modo ${assistencia.modoVentilatorioAtual}`,
    assistencia.viaAerea && `via aérea ${assistencia.viaAerea}`,
    assistencia.statusSuporteVentilatorio && `${supportStatusPhrase(assistencia.statusSuporteVentilatorio)} nas últimas 24 horas`,
  ].filter((item): item is string => Boolean(item));
  return parts.length ? `Paciente ${joinAsText(parts)}.` : '';
}

function bundleNarrative(bundle: Dict) {
  const positives = [
    bundle.analgesiaAdequada && `analgesia ${yesNoPhrase(bundle.analgesiaAdequada, 'adequada', 'não adequada')}`,
    bundle.podeReduzirSedacao === 'Sim' && 'possibilidade de redução da sedação',
    bundle.alvoRASS && `alvo de RASS ${bundle.alvoRASS}`,
    bundle.podeIniciarDesmame === 'Sim' && 'elegibilidade para desmame ventilatório',
    bundle.despertarDiario === 'Sim' && 'despertar diário indicado',
  ].filter((item): item is string => Boolean(item));
  const pending = [
    bundle.indicacaoTRE === 'Não' && 'teste de respiração espontânea',
    bundle.realizarExtubacao === 'Não' && 'extubação',
  ].filter((item): item is string => Boolean(item));
  const mobility = bundle.podeMobilizarHoje === 'Sim'
    ? `Mantém mobilização em andamento${bundle.nivelMobilidade ? ` em ${bundle.nivelMobilidade}` : ''}${bundle.progredirMobilidade ? `, com meta de progressão para ${bundle.progredirMobilidade}` : ''}.`
    : bundle.justificativaNaoMobilizar ? `Mobilização não indicada por ${bundle.justificativaNaoMobilizar}.` : '';
  return [
    positives.length ? `Está com ${joinAsText(positives)}.` : '',
    pending.length ? `Ainda não realiza ${joinAsText(pending)}.` : '',
    mobility,
  ].filter(Boolean).join(' ');
}

function hemodynamicNarrative(assistencia: Dict) {
  const stable = assistencia.instabilidadeUltimasHoras === 'Não' ? 'permanece estável, sem episódios de instabilidade nas últimas horas' : '';
  const unstable = assistencia.instabilidadeUltimasHoras === 'Sim' ? 'apresenta instabilidade nas últimas horas' : '';
  const vasoactive = assistencia.usoDrogaVasoativa === 'Sim' ? 'em uso de droga vasoativa' : assistencia.usoDrogaVasoativa === 'Não' ? 'sem droga vasoativa' : '';
  const dose = assistencia.aumentoDoseDrogaVasoativa === 'Sim' ? 'com aumento de dose' : '';
  const parts = [stable || unstable, vasoactive, dose].filter(Boolean);
  return parts.length ? `Na hemodinâmica, ${joinAsText(parts)}.` : '';
}

function nutritionRenalNarrative(assistencia: Dict) {
  const vias = Array.isArray(assistencia.viasAlimentacao) ? assistencia.viasAlimentacao.join(', ') : assistencia.viasAlimentacao;
  const nutrition = vias ? `recebe nutrição por ${String(vias).toLowerCase()}` : '';
  const npo = assistencia.npoDias !== undefined && assistencia.npoDias !== null ? `dieta zero há ${assistencia.npoDias} dia(s)` : '';
  const hd = assistencia.pacienteEmHD === 'Sim'
    ? `encontra-se em hemodiálise${assistencia.tipoHD ? ` ${String(assistencia.tipoHD).toLowerCase()}` : ''}`
    : assistencia.pacienteEmHD === 'Não' ? 'não está em hemodiálise' : '';
  const parts = [nutrition, npo, hd].filter(Boolean);
  return parts.length ? `${capitalize(joinAsText(parts))}.` : '';
}

function infectionNarrative(items: Dict[]) {
  const clean = items.map((item) => {
    const focus = item.provavelFoco === 'Outros' ? item.outroFoco : item.provavelFoco;
    const antibiotic = item.nomeAntibiotico ? `em uso de ${item.nomeAntibiotico}` : 'em antibioticoterapia';
    const duration = item.tempoTratamentoPrevistoDias ? `por ${item.tempoTratamentoPrevistoDias} dia(s) de tratamento` : '';
    const endDate = endDateLabel(item.dataInicioAntibiotico, item.tempoTratamentoPrevistoDias);
    const end = endDate ? `com previsão de término em ${endDate}` : '';
    const infection = item.suspeitaInfeccaoAtiva === 'Sim' && focus ? `para suspeita de infecção ${String(focus).toLowerCase()}` : '';
    const conduct = item.condutaSemMelhora ? `conduta prevista: ${String(item.condutaSemMelhora).toLowerCase()}` : '';
    const pieces = [antibiotic, duration, end, infection, conduct].filter(Boolean);
    return pieces.length ? joinAsText(pieces) : '';
  }).filter(Boolean);
  return clean.length ? `${capitalize(joinAsText(clean))}.` : '';
}

function devicesNarrative(items: Dict[]) {
  const clean = items.map((device) => {
    const label = deviceLabel(device as Device).toLowerCase();
    if (!label) return '';
    const site = device.sitio ? ` em ${device.sitio}` : '';
    const days = device.tempoDispositivoDias !== undefined && device.tempoDispositivoDias !== null ? ` há ${device.tempoDispositivoDias} dia(s)` : '';
    const conduct = normalizeText(device.conduta);
    const removal = conduct === 'retirar hoje' || device.podeRetirarHoje === 'Sim'
      ? ', com retirada prevista para hoje'
      : conduct === 'trocar sitio' ? ', com troca de sítio prevista' : ', sem programação de retirada';
    return `${label}${site}${days}${removal}`;
  }).filter(Boolean);
  return clean.length ? `Permanece com ${joinAsText(clean)}.` : '';
}

function lesionsNarrative(items: Dict[]) {
  const clean = items.map((lesion) => [
    lesion.localLesao && `lesão por pressão em ${lesion.localLesao}`,
    lesion.estadiamento && `estágio ${lesion.estadiamento}`,
    lesion.acompanhamento && `evolução ${String(lesion.acompanhamento).toLowerCase()}`,
  ].filter(Boolean).join(', ')).filter(Boolean);
  return clean.length ? `Apresenta ${joinAsText(clean)}.` : '';
}

function risksNarrative(riscos: Dict) {
  const risks = riskLabels(riscos).map((risk) => String(risk).toLowerCase());
  const prophylaxis = [
    riscos.profilaxiaTEV === 'Sim' && 'tromboembolismo venoso',
    riscos.profilaxiaLAMG === 'Sim' && 'lesão aguda de mucosa gástrica',
  ].filter((item): item is string => Boolean(item));
  if (!risks.length && !prophylaxis.length) return '';
  return `Mantém riscos assistenciais${risks.length ? ` para ${joinAsText(risks)}` : ''}${prophylaxis.length ? `, com profilaxias para ${joinAsText(prophylaxis)} prescritas` : ''}.`;
}

function supportPhrase(value: string) {
  const normalized = normalizeText(value);
  if (normalized.includes('ventilacao mecanica')) return 'em ventilação mecânica';
  if (normalized.includes('ventilacao nao invasiva')) return 'em ventilação não invasiva';
  if (normalized.includes('cateter')) return 'em cateter nasal';
  if (normalized.includes('mascara')) return 'em máscara reservatória';
  if (normalized.includes('ar ambiente')) return 'em ar ambiente';
  return `em ${String(value).toLowerCase()}`;
}

function supportStatusPhrase(value: string) {
  const normalized = normalizeText(value);
  if (normalized === 'reduziu') return 'com redução do suporte ventilatório';
  if (normalized === 'aumentou') return 'com aumento do suporte ventilatório';
  if (normalized.includes('sem alteracao')) return 'sem alteração do suporte ventilatório';
  return `com suporte ventilatório ${String(value).toLowerCase()}`;
}

function yesNoPhrase(value: string, yes: string, no: string) {
  if (value === 'Sim') return yes;
  if (value === 'Não') return no;
  return String(value).toLowerCase();
}

function capitalize(value: string) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : '';
}

function joinAsText(values: string[]) {
  if (values.length <= 1) return values[0] || '';
  return `${values.slice(0, -1).join(', ')} e ${values[values.length - 1]}`;
}

function riskLabels(riscos: Dict) {
  return [
    ['riscoTEV', 'TEV'],
    ['riscoSangramento', 'Sangramento'],
    ['riscoNutricional', 'Nutricional'],
    ['riscoBroncoaspiracao', 'Broncoaspiração'],
    ['riscoInfeccao', 'Infecção'],
    ['riscoLPP', 'LPP'],
    ['riscoDelirium', 'Delirium'],
    ['riscoQueda', 'Queda'],
  ].filter(([field]) => riscos[field] === true || riscos[field] === 'Sim').map(([, label]) => label);
}

function updateArray<T>(items: T[], onChange: (items: T[]) => void, index: number, patchValue: Partial<T> | T) {
  onChange(items.map((item, itemIndex) => {
    if (itemIndex !== index) return item;
    return typeof item === 'object' && item !== null && typeof patchValue === 'object' && patchValue !== null && !Array.isArray(patchValue)
      ? { ...item, ...patchValue }
      : patchValue as T;
  }));
}

function dateInput(value?: string) {
  const date = value ? String(value).slice(0, 10) : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

function brazilianDateInput(value?: string) {
  if (!value) return '';
  const text = String(value);
  const iso = dateInput(text);
  if (iso) {
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  }
  return text;
}

function normalizeBrazilianDateInput(value: string) {
  const text = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const clean = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
  const match = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return clean;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(value?: string) {
  return brazilianDateInput(value);
}

function parseDateValue(value?: string) {
  const iso = dateInput(value);
  if (iso) return new Date(`${iso}T00:00:00`);
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(`${year}-${month}-${day}T00:00:00`);
}

function tomorrowDateInput() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function daysSince(start?: string, end?: string) {
  if (!start) return 0;
  const a = parseDateValue(start);
  const b = parseDateValue(end) ?? new Date();
  if (!a || Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86400000));
}

function endDateLabel(start?: string, days?: string) {
  if (!start || !days) return '';
  const date = parseDateValue(start);
  const planned = Number(days);
  if (!date || Number.isNaN(date.getTime()) || Number.isNaN(planned)) return '';
  date.setDate(date.getDate() + Math.max(planned - 1, 0));
  return formatDateForDisplay(date.toISOString().slice(0, 10));
}
