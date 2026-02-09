'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, Play, Square, RefreshCw, Zap, Activity, AlertTriangle } from 'lucide-react';
import { getSchedulerStatus, startScheduler, stopScheduler, runSchedulerNow, triggerCollection } from '@/lib/api';
import clsx from 'clsx';

interface JobInfo {
  id: string;
  name: string;
  next_run: string | null;
  trigger: string;
}

interface SchedulerStatus {
  running: boolean;
  jobs: JobInfo[];
}

interface CollectionResult {
  status: string;
  message?: string;
  collected?: number;
}

const jobLabels: Record<string, { label: string; accent: string; icon: React.ElementType }> = {
  github_collection: { label: 'GitHub Collection', accent: 'text-ice', icon: Activity },
  defillama_collection: { label: 'DeFiLlama Collection', accent: 'text-phantom', icon: Activity },
  daily_summary: { label: 'Daily Summary', accent: 'text-solar', icon: Activity },
};

export default function SchedulerPage() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ type: string; data: CollectionResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const data = await getSchedulerStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load scheduler status:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    setError(null);
    try {
      if (action === 'start') {
        await startScheduler();
      } else if (action === 'stop') {
        await stopScheduler();
      } else if (action === 'run-now') {
        const data = await runSchedulerNow();
        setLastResult({ type: 'run-now', data });
      } else if (action.startsWith('collect-')) {
        const source = action.replace('collect-', '') as 'github' | 'defillama' | 'all';
        const data = await triggerCollection(source);
        setLastResult({ type: source, data });
      }
      await loadStatus();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || 'Unknown error';
      setError(`${action} failed: ${errorMsg}`);
      console.error(`Action ${action} failed:`, err);
    }
    setActionLoading(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task Scheduler</h1>
          <p className="text-text-ghost text-sm font-mono mt-1">
            Automated data collection &amp; analysis pipeline
          </p>
        </div>
        <button
          onClick={loadStatus}
          disabled={loading}
          className="cyber-btn flex items-center gap-2 disabled:opacity-40"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5 text-ice', loading && 'animate-spin')} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="cyber-card p-4 border-heat/30 bg-heat/5 animate-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-heat" />
            <p className="text-sm text-heat font-mono">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-text-ghost hover:text-text-secondary"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Status card */}
      <div className="cyber-card p-5 animate-in delay-1">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-2.5 h-2.5 rounded-full',
              status?.running ? 'bg-neon pulse-glow' : 'bg-heat'
            )} />
            <div>
              <h2 className="text-sm font-semibold">
                Scheduler {status?.running ? 'Running' : 'Stopped'}
              </h2>
              <p className="text-[11px] font-mono text-text-ghost mt-0.5">
                {status?.jobs.length ?? 0} registered jobs
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {!status?.running ? (
              <button
                onClick={() => handleAction('start')}
                disabled={actionLoading === 'start'}
                className="cyber-btn flex items-center gap-2 disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 text-neon" />
                <span>START</span>
              </button>
            ) : (
              <button
                onClick={() => handleAction('stop')}
                disabled={actionLoading === 'stop'}
                className="cyber-btn flex items-center gap-2 disabled:opacity-40"
              >
                <Square className="w-3.5 h-3.5 text-heat" />
                <span>STOP</span>
              </button>
            )}
            <button
              onClick={() => handleAction('run-now')}
              disabled={!!actionLoading}
              className="cyber-btn flex items-center gap-2 disabled:opacity-40"
            >
              <Zap className={clsx('w-3.5 h-3.5 text-solar', actionLoading === 'run-now' && 'animate-pulse')} />
              <span>RUN ALL</span>
            </button>
          </div>
        </div>

        {/* Jobs list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-elevated/20 rounded animate-pulse" />
            ))}
          </div>
        ) : status?.jobs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-border-mid mx-auto mb-2" />
            <p className="text-text-ghost font-mono text-[11px] tracking-wider">NO JOBS REGISTERED</p>
            <p className="text-[11px] text-text-ghost/50 mt-1">Start the scheduler to register jobs</p>
          </div>
        ) : (
          <div className="space-y-2">
            {status?.jobs.map((job) => {
              const meta = jobLabels[job.id] || { label: job.name, accent: 'text-text-ghost', icon: Clock };
              const Icon = meta.icon;
              return (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-md bg-deep border border-border-dim">
                  <div className="flex items-center gap-3">
                    <Icon className={clsx('w-4 h-4', meta.accent)} />
                    <div>
                      <p className="text-sm font-medium">{meta.label}</p>
                      <p className="text-[10px] font-mono text-text-ghost mt-0.5">{job.trigger}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-text-ghost/60">NEXT RUN</p>
                    <p className="text-[11px] font-mono text-text-secondary">
                      {job.next_run
                        ? new Date(job.next_run).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual triggers */}
      <div className="cyber-card p-5 animate-in delay-2">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-solar" />
          <h2 className="text-sm font-semibold tracking-wide">Manual Collection</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { id: 'collect-github', label: 'GitHub', desc: 'Scan trending repos', accent: 'text-ice' },
            { id: 'collect-defillama', label: 'DeFiLlama', desc: 'Fetch DeFi protocols', accent: 'text-phantom' },
            { id: 'collect-all', label: 'All Sources', desc: 'Run full collection', accent: 'text-neon' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleAction(item.id)}
              disabled={!!actionLoading}
              className={clsx(
                'cyber-card p-4 text-left group transition-all duration-200',
                'hover:border-border-mid disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Activity className={clsx('w-3.5 h-3.5', item.accent,
                  actionLoading === item.id && 'animate-pulse'
                )} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <p className="text-[11px] text-text-ghost font-mono">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Last result */}
      {lastResult && (
        <div className={clsx(
          'cyber-card p-4 animate-in',
          lastResult.data.status === 'ok' || lastResult.data.status === 'success'
            ? 'border-neon/20'
            : 'border-heat/20'
        )}>
          <div className="flex items-center gap-2 mb-2">
            {lastResult.data.status === 'ok' || lastResult.data.status === 'success' ? (
              <Activity className="w-3.5 h-3.5 text-neon" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-heat" />
            )}
            <span className="text-[11px] font-mono text-text-ghost tracking-wider">LAST RESULT</span>
          </div>
          <p className="text-sm text-text-secondary font-mono">
            {lastResult.data.message || JSON.stringify(lastResult.data)}
          </p>
          {lastResult.data.collected !== undefined && (
            <p className="text-[11px] font-mono text-neon mt-1">
              +{lastResult.data.collected} projects collected
            </p>
          )}
        </div>
      )}
    </div>
  );
}
