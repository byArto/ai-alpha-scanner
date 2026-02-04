'use client';

import { useEffect, useState } from 'react';
import { Database, Radar, TrendingUp, Clock } from 'lucide-react';
import clsx from 'clsx';
import { fetchStats, Stats } from '@/lib/api';

const cardDefs = [
  {
    title: 'Total Projects',
    key: 'total' as const,
    icon: Database,
    color: 'text-cyber-green',
    iconBg: 'bg-cyber-green/10 border-cyber-green/20',
  },
  {
    title: 'New (Unanalyzed)',
    key: 'new' as const,
    icon: Radar,
    color: 'text-cyber-cyan',
    iconBg: 'bg-cyber-cyan/10 border-cyber-cyan/20',
  },
  {
    title: 'Analyzed',
    key: 'analyzed' as const,
    icon: TrendingUp,
    color: 'text-cyber-purple',
    iconBg: 'bg-cyber-purple/10 border-cyber-purple/20',
  },
  {
    title: 'From GitHub',
    key: 'github' as const,
    icon: Clock,
    color: 'text-cyber-yellow',
    iconBg: 'bg-cyber-yellow/10 border-cyber-yellow/20',
  },
];

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="cyber-card p-4 animate-pulse">
            <div className="h-16 bg-cyber-bg-tertiary rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cardDefs.map((card) => (
        <div key={card.title} className="cyber-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{card.title}</p>
              <p className={clsx('text-3xl font-bold font-mono', card.color)}>
                {getValue(card.key).toLocaleString()}
              </p>
            </div>
            <div className={clsx('p-2 rounded-lg border', card.iconBg)}>
              <card.icon className={clsx('w-5 h-5', card.color)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
