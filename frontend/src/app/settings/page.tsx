'use client';

import { useState } from 'react';
import { Save, RefreshCw, Database, Bell, Trash2, Download } from 'lucide-react';
import clsx from 'clsx';

interface Settings {
  apiUrl: string;
  autoRefresh: boolean;
  refreshInterval: number;
  minScoreAlert: number;
  compactView: boolean;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={clsx(
        'w-11 h-6 rounded-full transition-all relative flex-shrink-0',
        checked ? 'bg-neon' : 'bg-deep border border-border-dim'
      )}
    >
      <div className={clsx(
        'w-4 h-4 rounded-full bg-white absolute top-1 transition-all',
        checked ? 'left-6' : 'left-1'
      )} />
    </button>
  );
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('alpha-scanner-settings');
        if (stored) return JSON.parse(stored);
      } catch { /* ignore */ }
    }
    return {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      autoRefresh: true,
      refreshInterval: 30,
      minScoreAlert: 8,
      compactView: false,
    };
  });

  const handleSave = () => {
    localStorage.setItem('alpha-scanner-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(`${settings.apiUrl}/api/projects?limit=1000`);
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alpha-scanner-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-text-ghost text-sm font-mono mt-1">
            Configure your AI Alpha Scanner preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          className={clsx(
            'cyber-btn flex items-center gap-2 transition-all',
            saved && 'border-neon/40 text-neon'
          )}
        >
          {saved ? (
            <><RefreshCw className="w-3.5 h-3.5" /><span>SAVED</span></>
          ) : (
            <><Save className="w-3.5 h-3.5 text-ice" /><span>SAVE</span></>
          )}
        </button>
      </div>

      {/* API Configuration */}
      <div className="cyber-card p-5 animate-in delay-1">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-ice" />
          <h2 className="text-sm font-semibold tracking-wide">API Configuration</h2>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-text-ghost tracking-wider mb-1.5">
            BACKEND URL
          </label>
          <input
            type="text"
            value={settings.apiUrl}
            onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
            className="cyber-input w-full font-mono"
          />
          <p className="text-[11px] text-text-ghost/60 mt-1.5">
            URL of the backend API server
          </p>
        </div>
      </div>

      {/* Display Settings */}
      <div className="cyber-card p-5 animate-in delay-2">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-neon" />
          <h2 className="text-sm font-semibold tracking-wide">Display</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-refresh Dashboard</p>
              <p className="text-[11px] text-text-ghost mt-0.5">Automatically reload data periodically</p>
            </div>
            <Toggle
              checked={settings.autoRefresh}
              onChange={() => setSettings({ ...settings, autoRefresh: !settings.autoRefresh })}
            />
          </div>

          {settings.autoRefresh && (
            <>
              <div className="cyber-divider" />
              <div>
                <label className="block text-[11px] font-mono text-text-ghost tracking-wider mb-1.5">
                  REFRESH INTERVAL
                </label>
                <div className="relative">
                  <select
                    value={settings.refreshInterval}
                    onChange={(e) => setSettings({ ...settings, refreshInterval: Number(e.target.value) })}
                    className="cyber-select w-full"
                  >
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={300}>5 minutes</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="cyber-divider" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Compact View</p>
              <p className="text-[11px] text-text-ghost mt-0.5">Show more projects in less space</p>
            </div>
            <Toggle
              checked={settings.compactView}
              onChange={() => setSettings({ ...settings, compactView: !settings.compactView })}
            />
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="cyber-card p-5 animate-in delay-3">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-solar" />
          <h2 className="text-sm font-semibold tracking-wide">Alerts</h2>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-text-ghost tracking-wider mb-1.5">
            MIN SCORE FOR ALERTS
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="5"
              max="10"
              step="0.5"
              value={settings.minScoreAlert}
              onChange={(e) => setSettings({ ...settings, minScoreAlert: Number(e.target.value) })}
              className="cyber-range flex-1"
            />
            <span className="font-mono text-solar w-10 text-right text-sm font-bold">
              {settings.minScoreAlert}+
            </span>
          </div>
          <p className="text-[11px] text-text-ghost/60 mt-1.5">
            Get notified when projects with this score or higher are discovered
          </p>
        </div>
      </div>

      {/* Data Management */}
      <div className="cyber-card p-5 animate-in delay-4">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-phantom" />
          <h2 className="text-sm font-semibold tracking-wide">Data Management</h2>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="cyber-btn flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-ice" />
            <span>EXPORT ALL PROJECTS (JSON)</span>
          </button>

          <div className="pt-3 border-t border-border-dim">
            <p className="text-[10px] font-mono text-text-ghost/60 tracking-wider mb-2">DANGER ZONE</p>
            <button
              className="cyber-btn flex items-center gap-2 border-heat/30 hover:border-heat text-heat"
              onClick={() => {
                if (confirm('Reset all local settings?')) {
                  localStorage.removeItem('alpha-scanner-settings');
                  window.location.reload();
                }
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>RESET ALL SETTINGS</span>
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="cyber-card p-5 animate-in delay-5">
        <h2 className="text-sm font-semibold tracking-wide mb-3">About</h2>
        <div className="space-y-1.5 text-[13px] font-mono">
          <p><span className="text-text-ghost">VERSION:</span> <span className="text-text-secondary">0.1.0</span></p>
          <p><span className="text-text-ghost">AUTHOR:</span> <span className="text-text-secondary">@byArto</span></p>
          <p>
            <span className="text-text-ghost">REPO:</span>{' '}
            <a
              href="https://github.com/byArto/ai-alpha-scanner"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ice hover:underline"
            >
              github.com/byArto/ai-alpha-scanner
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
