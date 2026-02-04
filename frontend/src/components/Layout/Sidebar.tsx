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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-cyber-bg-secondary border-r border-cyber-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-cyber-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-cyber-bg-tertiary border border-cyber-green/30 flex items-center justify-center group-hover:glow-green transition-all">
            <Zap className="w-5 h-5 text-cyber-green" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-cyber-green text-glow-green">
              AI Alpha
            </h1>
            <p className="text-xs text-cyber-border font-mono">SCANNER v0.1</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium',
                'hover:bg-cyber-bg-tertiary group scanline',
                isActive
                  ? 'bg-cyber-bg-tertiary border border-cyber-green/30 text-cyber-green'
                  : 'text-gray-400 hover:text-white border border-transparent'
              )}
            >
              <item.icon className={clsx(
                'w-5 h-5 transition-colors',
                isActive ? 'text-cyber-green' : 'text-gray-500 group-hover:text-cyber-cyan'
              )} />
              <span>{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyber-green pulse-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-cyber-border">
        <a
          href="https://github.com/byArto/ai-alpha-scanner"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-cyber-cyan transition-colors"
        >
          <Github className="w-4 h-4" />
          <span className="font-mono text-xs">byArto/ai-alpha-scanner</span>
        </a>
      </div>
    </aside>
  );
}
