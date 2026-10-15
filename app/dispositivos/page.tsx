import { CalendarPlus, Filter, Link2, MonitorDot, UsersRound } from 'lucide-react';
import { getDeviceControl } from '../../src/lib/api';
import { dateParamToIso, toBrazilianDate } from '../../src/lib/dates';

const carePosts = ['PA 30', 'PA 36', 'PA 41', 'PA 42', 'PA 44'];

export default async function DevicesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const query = {
    posto: params.posto || '',
    inicio: dateParamToIso(params.inicio),
    fim: dateParamToIso(params.fim),
  };
  let control: Record<string, any> = { dispositivos: [], pacientes: [], resumo: {} };
  let apiError = '';

  try {
    control = await getDeviceControl(query);
  } catch (error) {
    apiError = error instanceof Error ? error.message : 'API indisponivel';
  }

  const devices = control.dispositivos || [];
  const patients = groupDevicesByPatient(control.pacientes || [], devices);
  const resumo = control.resumo || {};

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Monitoramento diario</p>
          <h1>Controle de dispositivos</h1>
        </div>
        <span className={apiError ? 'status warn' : 'status ok'}>{apiError ? 'API offline' : 'API online'}</span>
      </header>

      {apiError ? <div className="banner">{apiError}</div> : null}

      <form className="filters device-control-filters">
        <label>
          <span>Posto assistencial</span>
          <select name="posto" defaultValue={params.posto || ''}>
            <option value="">Todos os postos</option>
            {carePosts.map((post) => <option key={post} value={post}>{post}</option>)}
          </select>
        </label>
        <label><span>Inicio</span><input name="inicio" type="date" defaultValue={dateParamToIso(params.inicio || control.periodo?.inicio)} /></label>
        <label><span>Fim</span><input name="fim" type="date" defaultValue={dateParamToIso(params.fim || control.periodo?.fim)} /></label>
        <button className="primary-action" type="submit"><Filter size={16} /> Filtrar</button>
      </form>

      <section className="device-summary-grid">
        <DeviceKpi icon={<MonitorDot />} label="Total de dispositivos" value={resumo.total ?? devices.length} />
        <DeviceKpi icon={<CalendarPlus />} label="Insercoes no dia" value={resumo.insercoesNoDia ?? 0} />
        <DeviceKpi icon={<UsersRound />} label="Pacientes com dispositivo no dia" value={resumo.pacientesComDispositivoNoDia ?? patients.filter((patient) => patient.devices.length).length} />
        <DeviceKpi icon={<Link2 />} label="Relacao paciente/dispositivo" value={formatRatio(resumo.relacaoPacienteDispositivo)} />
      </section>

      <section className="panel device-table-panel">
        <div className="panel-head">
          <div>
            <h2>Relacao paciente/dispositivo</h2>
            <span>Visualizacao por paciente, dispositivo, data de insercao e justificativa de permanencia.</span>
          </div>
          <span>{patients.length} paciente(s)</span>
        </div>
        {patients.length ? (
          <div className="patient-device-table">
            <div className="patient-device-row patient-device-head-row">
              <span>Paciente</span>
              <span>Qtd.</span>
              <span>Dispositivos</span>
            </div>
            {patients.map((patient) => <PatientDevices key={patient.idPaciente} patient={patient} />)}
          </div>
        ) : <div className="empty">Nenhum paciente encontrado para o filtro selecionado.</div>}
      </section>
    </main>
  );
}

function DeviceKpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <article className="kpi device-control-kpi"><div className="kpi-icon">{icon}</div><span>{label}</span><strong>{value}</strong></article>;
}

function PatientDevices({ patient }: { patient: PatientDeviceGroup }) {
  return (
    <article className="patient-device-row">
      <div className="patient-device-identification">
        <strong>{patient.leito || '--'} - {patient.nomePaciente}</strong>
        <span>{patient.unidade}</span>
      </div>
      <div className={patient.devices.length ? 'patient-device-count active' : 'patient-device-count'}>
        <strong>{patient.devices.length}</strong>
        <span>dispositivo(s)</span>
      </div>
      <div className="patient-device-relation">
        {patient.devices.length ? (
          <div className="patient-device-inner-table">
            <div className="patient-device-inner-head">
              <span>Dispositivo</span>
              <span>Sitio</span>
              <span>Insercao</span>
              <span>Justificativa de permanencia</span>
              <span>Conduta</span>
            </div>
            {patient.devices.map((device) => (
              <div className="patient-device-inner-row" key={device.idDispositivo}>
                <strong>{device.tipoDispositivo || 'Dispositivo'}</strong>
                <span>{device.sitio || '-'}</span>
                <span>{toBrazilianDate(device.dataInsercao) || '-'}</span>
                <span>{device.justificativaPermanencia || 'Sem registro'}</span>
                <span>{device.conduta || 'Sem registro'}</span>
              </div>
            ))}
          </div>
        ) : <div className="empty compact-empty">Sem dispositivos registrados no periodo.</div>}
      </div>
    </article>
  );
}

type PatientDeviceGroup = {
  idPaciente: string;
  nomePaciente: string;
  leito: string;
  unidade: string;
  devices: Array<Record<string, any>>;
};

function groupDevicesByPatient(patients: Array<Record<string, any>>, devices: Array<Record<string, any>>): PatientDeviceGroup[] {
  const grouped = new Map<string, PatientDeviceGroup>();
  for (const patient of patients) {
    grouped.set(patient.idPaciente, {
      idPaciente: patient.idPaciente,
      nomePaciente: patient.nomePaciente || patient.idPaciente,
      leito: patient.leito || '',
      unidade: patient.postoAssistencial || patient.unidade || '',
      devices: [],
    });
  }
  for (const device of devices) {
    const patient = device.patient || {};
    const idPaciente = device.idPaciente || patient.idPaciente || 'sem-paciente';
    const item = grouped.get(idPaciente) || {
      idPaciente,
      nomePaciente: patient.nomePaciente || idPaciente,
      leito: patient.leito || '',
      unidade: patient.unidade || '',
      devices: [] as Array<Record<string, any>>,
    };
    item.devices.push(device);
    grouped.set(idPaciente, item);
  }
  return [...grouped.values()].sort((a, b) => String(a.leito).localeCompare(String(b.leito), 'pt-BR', { numeric: true }));
}

function formatRatio(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00';
}
