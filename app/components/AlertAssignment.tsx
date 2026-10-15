'use client';

import { Save } from 'lucide-react';
import { useState } from 'react';
import { updateAlert } from '../../src/lib/api';

export function AlertAssignment({ alert }: { alert: Record<string, any> }) {
  const [responsavel, setResponsavel] = useState(alert.responsavel || '');
  const [prazo, setPrazo] = useState(toInputDate(alert.prazo));
  const [status, setStatus] = useState(alert.status || 'Ativo');
  const [saved, setSaved] = useState(false);

  async function save() {
    await updateAlert(alert.idAlerta, { responsavel, prazo, status });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="alert-assignment" onClick={(event) => event.preventDefault()}>
      <input aria-label="Responsável pelo alerta" placeholder="Responsável" value={responsavel} onChange={(event) => setResponsavel(event.target.value)} />
      <input aria-label="Prazo do alerta" type="date" value={prazo} onChange={(event) => setPrazo(event.target.value)} />
      <select aria-label="Status do alerta" value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="Ativo">Ativo</option>
        <option value="Em tratativa">Em tratativa</option>
        <option value="Resolvido">Resolvido</option>
      </select>
      <button className="icon-action" type="button" aria-label="Salvar alerta" onClick={save}><Save size={15} /></button>
      {saved ? <span>Salvo</span> : null}
    </div>
  );
}

function toInputDate(value?: string) {
  if (!value) return '';
  return String(value).slice(0, 10);
}
