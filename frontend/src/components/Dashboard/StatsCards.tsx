'use client';

import { useEffect, useState, useRef } from 'react';
import { Database, Radar, TrendingUp, GitBranch } from 'lucide-react';
import clsx from 'clsx';
import { fetchStats, Stats } from '@/lib/api';

const cardDefs = [
  {
    title: 'TOTAL PROJECTS',
    key: 'total' as const,
    icon: Database,
    accentClass: 'text-neon',
    borderClass: 'border-neon/20',
    bgClass: 'bg-neon/[0.06]',
    glowClass: 'glow-neon',
    barClass: 'bg-neon',
  },
  {
    title: 'PENDING ANALYSIS',
    key: 'new' as const,
    icon: Radar,
    accentClass: 'text-ice',
    borderClass: 'border-ice/20',
    bgClass: 'bg-ice/[0.06]',
    glowClass: 'glow-ice',
    barClass: 'bg-ice',
  },
  {
    title: 'ANALYZED',
    key: 'analyzed' as const,
    icon: TrendingUp,
    accentClass: 'text-phantom',
    borderClass: 'border-phantom/20',
    bgClass: 'bg-phantom/[0.06]',
    glowClass: '',
    barClass: 'bg-phantom',
  },
  {
    title: 'GITHUB SOURCE',
    key: 'github' as const,
    icon: GitBranch,
    accentClass: 'text-solar',
    borderClass: 'border-solar/20',
    bgClass: 'bg-solar/[0.06]',
    glowClass: '',
    barClass: 'bg-solar',
  },
];

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      ref.current = current;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

export default function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
      setLoading(false);
    };
    loadStats();
  }, []);

  const getValue = (key: string): number => {
    if (!stats) return 0;
    if (key === 'total') return stats.total;
    if (key === 'new') return stats.by_status?.new || 0;
    if (key === 'analyzed') return stats.by_status?.analyzed || 0;
    if (key === 'github') return stats.by_source?.github || 0;
    return 0;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="cyber-card p-4 animate-pulse">
            <div className="h-[72px] bg-elevated/50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const total = stats?.total || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {cardDefs.map((card, i) => {
        const val = getValue(card.key);
        const pct = card.key === 'total' ? 100 : Math.round((val / total) * 100);
        return (
          <div
            key={card.title}
            className={clsx(
              'cyber-card p-4 animate-in',
              `delay-${i + 1}`
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono tracking-[0.12em] text-text-ghost">
                {card.title}
              </span>
              <div className={clsx('p-1.5 rounded border', card.borderClass, card.bgClass)}>
                <card.icon className={clsx('w-3.5 h-3.5', card.accentClass)} />
              </div>
            </div>

            <div className={clsx('text-3xl font-bold font-mono tracking-tight mb-2', card.accentClass)}>
              <AnimatedNumber value={val} />
            </div>

            {/* Mini bar */}
            <div className="h-[2px] bg-border-dim rounded-full overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all duration-1000', card.barClass)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-text-ghost mt-1.5">
              {pct}% of total
            </div>
          </div>
        );
      })}
    </div>
  );
}
