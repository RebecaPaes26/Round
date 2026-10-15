'use client';

import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  History,
  LayoutDashboard,
  MonitorDot,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoutButton } from './LogoutButton';

const menuItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Round', href: '/round', icon: ClipboardList },
  { label: 'Histórico', href: '/historico', icon: History },
  { label: 'Controle de Dispositivos', href: '/dispositivos', icon: MonitorDot },
  { label: 'Relatório diário', href: '/relatorio-diario', icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname.startsWith('/login')) {
    return <>{children}</>;
  }

  useEffect(() => {
    const stored = window.localStorage.getItem('round-sidebar-collapsed');
    setCollapsed(stored === 'true');
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem('round-sidebar-collapsed', String(next));
      return next;
    });
  }

  return (
    <div className={`shell ${collapsed ? 'shell-collapsed' : ''}`}>
      <aside className="sidebar" aria-label="Menu principal">
        <div className="brand">
          <Image src="/logo-ronaldo-gazolla-crop.png" alt="Hospital Municipal Ronaldo Gazolla" width={390} height={131} priority />
        </div>

        <button
          className="sidebar-toggle"
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Encolher barra lateral'}
          title={collapsed ? 'Expandir barra lateral' : 'Encolher barra lateral'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <nav className="main-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                className={active ? 'active' : ''}
                href={item.href}
                title={item.label}
                aria-label={collapsed ? item.label : undefined}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <LogoutButton />
      </aside>

      <section className="content">{children}</section>
    </div>
  );
}
