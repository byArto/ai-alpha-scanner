'use client';

import { useEffect, useState } from 'react';
import { Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { getSchedulerStatus, triggerCollection } from '@/lib/api';

export default function Header() {
  const [isOnline, setIsOnline] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

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
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
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
    <header className="h-14 border-b border-cyber-border bg-cyber-bg-secondary/80 backdrop-blur-sm flex items-center justify-between px-6">
      {/* Left: Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-cyber-green" />
          ) : (
            <WifiOff className="w-4 h-4 text-cyber-red" />
          )}
          <span className={`text-xs font-mono ${isOnline ? 'text-cyber-green' : 'text-cyber-red'}`}>
            {isOnline ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        <div className="h-4 w-px bg-cyber-border" />

        <div className="flex items-center gap-2 text-gray-500">
          <Activity className="w-4 h-4" />
          <span className="text-xs font-mono">{currentTime} UTC</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRefresh}
          disabled={isCollecting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-bg-tertiary border border-cyber-border hover:border-cyber-cyan transition-all text-sm disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-cyber-cyan ${isCollecting ? 'animate-spin' : ''}`} />
          <span className="font-mono text-xs">
            {isCollecting ? 'SCANNING...' : 'SCAN NOW'}
          </span>
        </button>
      </div>
    </header>
  );
}
