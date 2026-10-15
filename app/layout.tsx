import type { Metadata } from 'next';
import { AppShell } from './components/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Round Multidisciplinar UTI',
  description: 'Sistema de round multidisciplinar em UTI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
