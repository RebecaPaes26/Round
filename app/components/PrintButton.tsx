'use client';

import { Printer } from 'lucide-react';

export function PrintButton({ label = 'Imprimir' }: { label?: string }) {
  return (
    <button className="secondary-action print-action" type="button" onClick={() => window.print()}>
      <Printer size={16} /> {label}
    </button>
  );
}
