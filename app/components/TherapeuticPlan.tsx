'use client';

import { Copy } from 'lucide-react';
import type { Patient } from '../../src/lib/api';
import { toBrazilianDate } from '../../src/lib/dates';

export function TherapeuticPlan({ patients }: { patients: Patient[] }) {
  async function copyEvolution(patient: Patient) {
    await navigator.clipboard.writeText(buildEvolution(patient));
  }

  return (
    <div className="patients">
      {patients.map((patient) => {
        const evolution = buildEvolution(patient);
        return (
          <article className="panel plan-card" key={patient.idPaciente}>
            <div className="panel-head">
              <h2>{patient.leito} - {patient.nomePaciente}</h2>
              <button className="secondary-action" type="button" onClick={() => copyEvolution(patient)}>
                <Copy size={17} />
                Copiar evolução
              </button>
            </div>
            <pre className="evolution-text">{evolution}</pre>
          </article>
        );
      })}
    </div>
  );
}

export function buildEvolution(patient: Patient) {
  const previousPendingGoals = splitLines(patient.metasPendentesAnterioresResumo).map(parseGoalLine);
  const nextGoals = splitLines(patient.metasProximas24hResumo || patient.metasResumo).map(parseGoalLine)
    .filter((goal) => ['Pendente', 'Em andamento', 'Atrasado', ''].includes(goal.status));
  const pending = splitLines(patient.pendenciasResumo);
  const risks = patient.riscosAtivos || 'Sem riscos identificados';
  const problem = patient.problemaAtivoPrincipal || patient.evolucaoPaciente || patient.motivoInternacao || 'Não registrado';

  return [
    `Paciente: ${patient.nomePaciente || 'Não registrado'}`,
    `Leito: ${patient.leito || 'Não registrado'}`,
    `Data de Nascimento: ${toBrazilianDate(patient.dataNascimento) || 'Não registrada'}`,
    `Previsão de alta: ${toBrazilianDate(patient.previsaoAlta) || 'Não registrada'}`,
    `Diagnóstico atual: ${patient.diagnosticoAtual || 'Não registrado'}`,
    `Problema Ativo: ${problem}`,
    `Riscos Identificados: ${risks}`,
    '',
    'Metas:',
    ' I. Metas pendentes do dia anterior:',
    ...(previousPendingGoals.length ? previousPendingGoals.map(formatGoalForPlan) : [' - Sem metas pendentes do dia anterior.']),
    '',
    ' II. Metas para as próximas 24 horas:',
    ...(nextGoals.length ? nextGoals.map(formatGoalForPlan) : [' - Sem metas registradas para as próximas 24 horas.']),
    '',
    'Pendências:',
    ...(pending.length ? pending.map((item) => ` - ${item}`) : [' - Sem pendências registradas.']),
  ].join('\n');
}

function parseGoalLine(line: string) {
  const parts = line.split('|').map((item) => item.trim()).filter(Boolean);
  return {
    meta: parts[0] || line,
    prazo: formatDatesInText(parts[1] || ''),
    responsavel: parts[2] || '',
    status: parts[3] || '',
  };
}

function formatGoalForPlan(goal: { meta: string; prazo?: string; status?: string }) {
  return ` - ${goal.meta}${goal.prazo ? ` (Prazo: ${goal.prazo})` : ' (Prazo: não registrado)'}`;
}

function splitLines(value?: string) {
  return String(value || '').split(/\n+/).map((item) => item.trim()).filter(Boolean);
}

function formatDatesInText(value?: string) {
  return String(value || '').replace(/\d{4}-\d{2}-\d{2}/g, (date) => toBrazilianDate(date));
}
