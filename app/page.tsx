import { getBootstrap, type Bootstrap } from '../src/lib/api';
import { RoundApp } from './round-app';

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

  return <RoundApp data={data} apiError={apiError} />;
}
