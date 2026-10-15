'use client';

import { LockKeyhole } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError('Senha invalida. Tente novamente.');
        return;
      }

      window.location.href = next.startsWith('/') ? next : '/';
    } catch {
      setError('Nao foi possivel autenticar agora.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label>
        <span>Senha de acesso</span>
        <input
          autoComplete="current-password"
          autoFocus
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Digite a senha"
          type="password"
          value={password}
        />
      </label>
      {error ? <p>{error}</p> : null}
      <button className="primary-action" disabled={loading || !password} type="submit">
        <LockKeyhole size={16} /> {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
