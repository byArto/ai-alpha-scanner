'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Terminal, Clock } from 'lucide-react';
import { getSchedulerStatus, triggerCollection } from '@/lib/api';

export default function Header() {
  const [isOnline, setIsOnline] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await getSchedulerStatus();
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }).toUpperCase());
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const handleRefresh = async () => {
    setIsCollecting(true);
    try {
      await triggerCollection('all');
    } catch (error) {
      console.error('Collection failed:', error);
    }
    setIsCollecting(false);
  };

  return (
    <header className="h-12 border-b border-border-dim bg-abyss/90 backdrop-blur-md flex items-center justify-between px-5 relative z-10">
      {/* Left: breadcrumb + status */}
      <div className="flex items-center gap-5">
        {/* Terminal indicator */}
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-text-ghost" />
          <span className="text-[11px] font-mono text-text-ghost">
            alpha-scanner
          </span>
          <span className="text-text-ghost/40 text-[11px]">/</span>
          <span className="text-[11px] font-mono text-text-secondary typing-cursor pr-1">
            live
          </span>
        </div>

        <div className="h-3 w-px bg-border-dim" />

        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-neon" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-heat" />
          )}
          <span className={`text-[10px] font-mono tracking-wider ${isOnline ? 'text-neon' : 'text-heat'}`}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Right: time + actions */}
      <div className="flex items-center gap-4">
        {/* Date/Time */}
        <div className="flex items-center gap-2 text-text-ghost">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono tabular-nums">
            {currentDate}
          </span>
          <span className="text-neon/60 text-[11px] font-mono tabular-nums">
            {currentTime}
          </span>
        </div>

        <div className="h-3 w-px bg-border-dim" />

        {/* Scan button */}
        <button
          onClick={handleRefresh}
          disabled={isCollecting}
          className="cyber-btn flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-ice ${isCollecting ? 'animate-spin' : ''}`} />
          <span>{isCollecting ? 'SCANNING' : 'SCAN NOW'}</span>
        </button>
      </div>
    </header>
  );
}
