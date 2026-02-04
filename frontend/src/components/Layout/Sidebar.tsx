'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Radar,
  Database,
  Settings,
  Activity,
  Github,
  Zap
} from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: Radar },
  { name: 'Sources', href: '/sources', icon: Database },
  { name: 'Scheduler', href: '/scheduler', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-abyss border-r border-border-dim flex flex-col z-50">
      {/* Ambient gradient bleed at top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-neon/[0.03] to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="relative p-6 pb-5">
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="relative w-10 h-10 rounded-md bg-deep border border-neon/20 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-neon/50 group-hover:glow-neon">
            <Zap className="w-5 h-5 text-neon relative z-10" />
            <div className="absolute inset-0 bg-neon/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-neon text-glow-neon leading-none">
              AI ALPHA
            </h1>
            <p className="text-[10px] text-text-ghost font-mono tracking-[0.15em] mt-0.5">
              SCANNER v0.1.0
            </p>
          </div>
        </Link>
        <div className="cyber-divider mt-5" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="text-[9px] text-text-ghost font-mono tracking-[0.2em] uppercase px-3 mb-2">
          Navigation
        </p>
        {navigation.map((item, i) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative',
                isActive
                  ? 'bg-neon/[0.07] text-neon'
                  : 'text-text-secondary hover:text-text-primary hover:bg-elevated/50'
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-neon rounded-r-full glow-neon" />
              )}

              <item.icon className={clsx(
                'w-[18px] h-[18px] transition-all duration-200',
                isActive
                  ? 'text-neon'
                  : 'text-text-ghost group-hover:text-ice'
              )} />

              <span className="text-sm font-medium tracking-wide">{item.name}</span>

              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neon pulse-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* System status */}
      <div className="px-3 pb-2">
        <div className="cyber-divider mb-3" />
        <div className="px-3 pb-1">
          <p className="text-[9px] text-text-ghost font-mono tracking-[0.2em] uppercase mb-2">
            System
          </p>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-neon pulse-glow" />
            <span className="text-[11px] font-mono text-text-ghost">
              Backend connected
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border-dim">
        <a
          href="https://github.com/byArto/ai-alpha-scanner"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 text-text-ghost hover:text-ice transition-colors duration-200 rounded-md hover:bg-elevated/30"
        >
          <Github className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px]">byArto/ai-alpha-scanner</span>
        </a>
      </div>
    </aside>
  );
}
