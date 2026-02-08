'use client';

import { useEffect, useState } from 'react';
import { Github, Database, ExternalLink, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { fetchStats, Stats } from '@/lib/api';

interface SourceInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'limited' | 'inactive';
  statusText: string;
  docsUrl: string;
  features: string[];
}

const sources: SourceInfo[] = [
  {
    id: 'github',
    name: 'GitHub API',
    description: 'Official GitHub REST API for discovering new crypto/web3 repositories. Searches for blockchain, DeFi, L2, and related projects.',
    icon: <Github className="w-5 h-5" />,
    status: 'active',
    statusText: 'Active — 5000 requests/hour',
    docsUrl: 'https://docs.github.com/en/rest',
    features: ['New repository discovery', 'Commit activity tracking', 'Contributor analysis', 'README & description parsing', 'Social links extraction'],
  },
  {
    id: 'defillama',
    name: 'DeFiLlama API',
    description: 'Free public API for DeFi protocol data. Tracks TVL, chains, and early-stage protocols with low market presence.',
    icon: <span className="text-xl">🦙</span>,
    status: 'active',
    statusText: 'Active — No rate limits',
    docsUrl: 'https://defillama.com/docs/api',
    features: ['Early DeFi protocol detection', 'TVL tracking', 'Multi-chain coverage', 'Funding round data', 'Protocol categorization'],
  },
  {
    id: 'galxe',
    name: 'Galxe',
    description: 'Quest and campaign platform. Currently limited due to API authentication requirements.',
    icon: <span className="text-xl">🎯</span>,
    status: 'limited',
    statusText: 'Limited — Requires auth',
    docsUrl: 'https://galxe.com',
    features: ['Campaign discovery', 'Quest tracking', 'Community metrics'],
  },
  {
    id: 'layer3',
    name: 'Layer3',
    description: 'Quest platform for crypto education and rewards. Limited due to dynamic content loading.',
    icon: <span className="text-xl">🔷</span>,
    status: 'limited',
    statusText: 'Limited — Dynamic content',
    docsUrl: 'https://layer3.xyz',
    features: ['Quest discovery', 'XP rewards tracking', 'Project categorization'],
  },
  {
    id: 'zealy',
    name: 'Zealy (Crew3)',
    description: 'Community engagement platform. Currently inactive due to API restrictions.',
    icon: <span className="text-xl">⚡</span>,
    status: 'inactive',
    statusText: 'Inactive — API restricted',
    docsUrl: 'https://zealy.io',
    features: ['Community discovery', 'Quest tracking', 'Leaderboards'],
  },
];

const statusStyles = {
  active: {
    badge: 'bg-neon/10 text-neon border-neon/20',
    icon: 'bg-neon/10 border-neon/20 text-neon',
  },
  limited: {
    badge: 'bg-solar/10 text-solar border-solar/20',
    icon: 'bg-solar/10 border-solar/20 text-solar',
  },
  inactive: {
    badge: 'bg-elevated text-text-ghost border-border-dim',
    icon: 'bg-elevated border-border-dim text-text-ghost',
  },
};

export default function SourcesPage() {
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

  const getSourceCount = (sourceId: string): number => {
    if (!stats) return 0;
    if (sourceId === 'defillama') return stats.by_source?.manual || 0;
    return stats.by_source?.[sourceId] || 0;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="animate-in">
        <h1 className="text-2xl font-bold tracking-tight">Data Sources</h1>
        <p className="text-text-ghost text-sm font-mono mt-1">
          Overview of all data collection sources and their status
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in delay-1">
        {[
          { label: 'Active', value: 2, icon: CheckCircle, accent: 'text-neon', bg: 'bg-neon/10 border-neon/20' },
          { label: 'Limited', value: 2, icon: Clock, accent: 'text-solar', bg: 'bg-solar/10 border-solar/20' },
          { label: 'Inactive', value: 1, icon: XCircle, accent: 'text-text-ghost', bg: 'bg-elevated border-border-dim' },
          { label: 'Total Projects', value: loading ? null : (stats?.total || 0), icon: Database, accent: 'text-ice', bg: 'bg-ice/10 border-ice/20' },
        ].map((item) => (
          <div key={item.label} className="cyber-card p-4">
            <div className="flex items-center gap-3">
              <div className={clsx('p-2 rounded-md border', item.bg)}>
                <item.icon className={clsx('w-4 h-4', item.accent)} />
              </div>
              <div>
                <p className={clsx('text-2xl font-bold font-mono', item.accent)}>
                  {item.value ?? '…'}
                </p>
                <p className="text-[11px] text-text-ghost">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sources List */}
      <div className="space-y-3">
        {sources.map((source, i) => {
          const st = statusStyles[source.status];
          return (
            <div key={source.id} className={clsx('cyber-card p-5 animate-in', `delay-${i + 2}`)}>
              <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                {/* Left: Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={clsx('p-2 rounded-md border', st.icon)}>
                      {source.icon}
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold">{source.name}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={clsx('cyber-badge border', st.badge)}>
                          {source.status}
                        </span>
                        <span className="text-[11px] text-text-ghost font-mono">{source.statusText}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-text-secondary text-[13px] leading-relaxed mb-3">
                    {source.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {source.features.map((feature) => (
                      <span key={feature} className="text-[11px] px-2 py-0.5 bg-deep rounded border border-border-dim text-text-ghost">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Stats & Docs */}
                <div className="flex flex-col items-end gap-3 lg:min-w-[120px]">
                  <div className="text-right">
                    <p className="text-2xl font-bold font-mono text-text-primary">
                      {loading ? '…' : getSourceCount(source.id)}
                    </p>
                    <p className="text-[10px] font-mono text-text-ghost">COLLECTED</p>
                  </div>

                  <a
                    href={source.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cyber-btn flex items-center gap-1.5"
                  >
                    <span>DOCS</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Planned Sources */}
      <div className="cyber-card p-5 border-dashed animate-in delay-7">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-ice" />
          <h3 className="text-sm font-semibold tracking-wide">Planned Sources</h3>
        </div>
        <p className="text-text-ghost text-[13px] mb-3">
          Data sources planned for future integration:
        </p>
        <div className="flex flex-wrap gap-2">
          {['CoinGecko API', 'Dune Analytics', 'Nansen', 'Artemis', 'Token Terminal', 'L2Beat'].map((name) => (
            <span key={name} className="text-[11px] px-2.5 py-1 rounded border border-dashed border-border-dim text-text-ghost bg-deep">
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
