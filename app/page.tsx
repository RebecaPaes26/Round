import { Activity, AlertTriangle, BarChart3, ClipboardCheck, Clock, Gauge, Stethoscope } from 'lucide-react';
import { dateParamToIso, toBrazilianDate } from '../src/lib/dates';
import { getDashboard, type Dashboard } from '../src/lib/api';

const fallbackDashboard: Dashboard = {
  totalPacientesAtivos: 0,
  pacienteDiaElegivel: 0,
  indicadores: {},
  gruposAlertas: [],
  participacaoEquipe: [],
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type Indicator = {
  titulo?: string;
  numerador?: number;
  denominador?: number;
  resultado?: number;
  unidade?: string;
  tendencia?: Array<Record<string, any>>;
  tempoTotalUnidadeMinutos?: number;
};

const deviceTypes = ['AVP', 'PVC', 'SNE', 'CVC', 'SVD', 'SNG', 'Dreno', 'PAI', 'CDL', 'TOT', 'TQT'];
const carePosts = ['PA 30', 'PA 36', 'PA 41', 'PA 42', 'PA 44'];

export default async function Home({ searchParams }: PageProps) {
  const params = normalizeParams(searchParams ? await searchParams : {});
  const query = {
    inicio: dateParamToIso(params.inicio),
    fim: dateParamToIso(params.fim),
    posto: params.posto || '',
  };

  let dashboard = fallbackDashboard;
  let apiError = '';

  try {
    dashboard = await getDashboard(query);
  } catch (error) {
    apiError = error instanceof Error ? error.message : 'API indisponível';
  }

  const indicadores = dashboard.indicadores || {};
  const primaryIndicators = [
    { key: 'alertasAbertos', icon: <AlertTriangle />, indicator: indicadores.alertasAbertos },
    { key: 'taxaRound', icon: <Gauge />, indicator: indicadores.taxaRound },
    { key: 'metasConcluidas', icon: <ClipboardCheck />, indicator: indicadores.metasConcluidas },
    { key: 'profilaxiaTEV', icon: <Activity />, indicator: indicadores.profilaxiaTEV },
    { key: 'tempoRound', icon: <Clock />, indicator: indicadores.tempoRound },
    { key: 'tempoMedioUnidade', icon: <BarChart3 />, indicator: indicadores.tempoMedioUnidade },
    { key: 'tempoMedioVM', icon: <Stethoscope />, indicator: indicadores.tempoMedioVM },
    { key: 'tempoMedioPCV', icon: <Stethoscope />, indicator: indicadores.tempoMedioPCV },
  ].filter((item) => item.indicator);
  const dispositivos = indicadores.dispositivos || {};

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Indicadores do Round Multidisciplinar</h1>
        </div>
        <span className={apiError ? 'status warn' : 'status ok'}>{apiError ? 'API offline' : 'API online'}</span>
      </header>

      {apiError ? <div className="banner">{apiError}</div> : null}

      <form className="filters dashboard-filters" action="/" method="get">
        <label>
          <span>Posto assistencial</span>
          <select name="posto" defaultValue={params.posto || ''}>
            <option value="">Todos os postos</option>
            {carePosts.map((post) => <option key={post} value={post}>{post}</option>)}
          </select>
        </label>
        <label>
          <span>Início</span>
          <input name="inicio" type="date" defaultValue={dateParamToIso(params.inicio || dashboard.periodo?.inicio)} />
        </label>
        <label>
          <span>Fim</span>
          <input name="fim" type="date" defaultValue={dateParamToIso(params.fim || dashboard.periodo?.fim)} />
        </label>
        <button className="primary" type="submit">Aplicar</button>
      </form>
      <section className="chart-grid">
        {primaryIndicators.map((item) => (
          <ChartCard key={item.key} indicator={item.indicator as Indicator} icon={item.icon} />
        ))}
      </section>

      <section className="panel clean-panel">
        <div className="panel-head">
          <h2>Utilização de dispositivos</h2>
          <span>{toBrazilianDate(dashboard.periodo?.inicio)} a {toBrazilianDate(dashboard.periodo?.fim)}</span>
        </div>
        <div className="device-chart-grid">
          {deviceTypes.map((type) => (
            <DeviceChart key={type} type={type} indicator={dispositivos[type] || { titulo: type, resultado: 0, numerador: 0, denominador: 0, tendencia: [] }} />
          ))}
        </div>
      </section>
    </main>
  );
}

function ChartCard({ indicator, icon }: { indicator: Indicator; icon: React.ReactNode }) {
  const result = indicator.resultado ?? 0;
  const max = indicator.unidade === '%' ? 100 : Math.max(1, result, ...((indicator.tendencia || []).map((item) => Number(item.resultado || 0))));
  const percent = Math.min(100, Math.round((result / max) * 100));

  return (
    <article className="chart-card">
      <div className="chart-head">
        <span>{icon}</span>
        <h2>{indicator.titulo}</h2>
      </div>
      <div className="chart-value">{result}{indicator.unidade || '%'}</div>
      <div className="chart-bar" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
      <Sparkline trend={indicator.tendencia || []} unit={indicator.unidade || '%'} />
      <div className="chart-foot">
        <span>{indicator.numerador ?? 0}</span>
        <small>de</small>
        <span>{indicator.denominador ?? 0}</span>
        {indicator.tempoTotalUnidadeMinutos !== undefined ? <small>Total: {indicator.tempoTotalUnidadeMinutos} min</small> : null}
      </div>
    </article>
  );
}

function DeviceChart({ type, indicator }: { type: string; indicator: Indicator }) {
  const result = indicator.resultado ?? 0;
  return (
    <article className="device-chart">
      <div>
        <strong>{type}</strong>
        <span>{result}%</span>
      </div>
      <div className="chart-bar small" aria-hidden="true"><span style={{ width: `${Math.min(100, result)}%` }} /></div>
      <MiniSeries trend={indicator.tendencia || []} />
    </article>
  );
}

function Sparkline({ trend, unit }: { trend: Array<Record<string, any>>; unit: string }) {
  const visible = trend;
  const width = 320;
  const height = 86;
  const pad = 10;
  const max = unit === '%' ? 100 : Math.max(1, ...visible.map((item) => Number(item.resultado || 0)));
  const points = linePoints(visible, width, height, pad, max);
  const area = points ? `${pad},${height - pad} ${points} ${width - pad},${height - pad}` : '';

  return (
    <div className="series-block">
      <span>Série histórica</span>
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Série histórica do período selecionado">
        <path className="line-chart-grid" d={`M ${pad} ${height - pad} H ${width - pad}`} />
        {area ? <polygon className="line-chart-area" points={area} /> : null}
        {points ? <polyline className="line-chart-line" points={points} /> : null}
        {visible.map((item, index) => {
          const point = linePoint(index, visible.length, Number(item.resultado || 0), width, height, pad, max);
          return <circle key={`${item.data}-${index}`} cx={point.x} cy={point.y} r="3"><title>{`${toBrazilianDate(item.data)}: ${item.resultado}${unit}`}</title></circle>;
        })}
      </svg>
      <div className="series-axis">
        <small>{visible[0]?.data ? toBrazilianDate(visible[0].data).slice(0, 5) : ''}</small>
        <small>{visible.at(-1)?.data ? toBrazilianDate(visible.at(-1)?.data).slice(0, 5) : ''}</small>
      </div>
    </div>
  );
}

function MiniSeries({ trend }: { trend: Array<Record<string, any>> }) {
  const width = 120;
  const height = 34;
  const pad = 3;
  const points = linePoints(trend, width, height, pad, 100);
  return (
    <svg className="mini-series-line" viewBox={`0 0 ${width} ${height}`} aria-label="Série histórica do dispositivo">
      {points ? <polyline points={points} /> : null}
    </svg>
  );
}

function linePoints(items: Array<Record<string, any>>, width: number, height: number, pad: number, max: number) {
  if (!items.length) return '';
  return items.map((item, index) => {
    const point = linePoint(index, items.length, Number(item.resultado || 0), width, height, pad, max);
    return `${point.x},${point.y}`;
  }).join(' ');
}

function linePoint(index: number, total: number, value: number, width: number, height: number, pad: number, max: number) {
  const x = total <= 1 ? width / 2 : pad + (index * ((width - pad * 2) / (total - 1)));
  const y = height - pad - (Math.min(max, Math.max(0, value)) / max) * (height - pad * 2);
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}

function normalizeParams(searchParams?: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(Object.entries(searchParams || {}).map(([key, value]) => [key, Array.isArray(value) ? value[0] || '' : value || ''])) as Record<string, string>;
}
