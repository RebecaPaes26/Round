import Image from 'next/image';
import { Suspense } from 'react';
import { LoginForm } from '../components/LoginForm';

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">
          <Image src="/logo-ronaldo-gazolla-crop.png" alt="Hospital Municipal Ronaldo Gazolla" width={390} height={131} priority />
        </div>
        <div className="login-copy">
          <p className="eyebrow">Acesso seguro</p>
          <h1>Round Multidisciplinar UTI</h1>
          <span>Entre para acessar o painel assistencial.</span>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
