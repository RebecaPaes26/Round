'use client';

import { LogOut } from 'lucide-react';

export function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <button className="logout-button" type="button" onClick={handleLogout} title="Sair do sistema">
      <LogOut size={18} />
      <span>Sair</span>
    </button>
  );
}
