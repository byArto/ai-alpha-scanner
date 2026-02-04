'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Zap, TrendingUp, AlertTriangle, Scan } from 'lucide-react';
import Link from 'next/link';
import StatsCards from '@/components/Dashboard/StatsCards';
import ProjectCard from '@/components/Projects/ProjectCard';
import { fetchProjects, Project } from '@/lib/api';

export default function Dashboard() {
  const [topProjects, setTopProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchProjects({ min_score: 7, limit: 6 });
        setTopProjects(data.projects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
      setLoading(false);
    };
    loadProjects();
  }, []);

  return (
    <div className="space-y-7">
      {/* Hero header */}
      <div className="animate-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-neon pulse-glow" />
              <span className="text-[10px] font-mono text-text-ghost tracking-[0.2em] uppercase">
                Live Intelligence Feed
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              Command Center
            </h1>
            <p className="text-text-secondary text-sm mt-1.5 max-w-md">
              Real-time discovery and analysis of early-stage crypto projects across multiple data sources.
            </p>
          </div>

          {/* Decorative pixel grid */}
          <div className="hidden lg:flex items-center gap-2 text-text-ghost">
            <div className="grid grid-cols-6 gap-[2px] opacity-30">
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className="w-[6px] h-[6px] bg-neon/40 rounded-[1px]"
                  style={{ opacity: Math.random() * 0.8 + 0.2 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link href="/projects?min_score=8" className="cyber-card p-4 group animate-in delay-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-neon/[0.08] border border-neon/15">
              <Zap className="w-4 h-4 text-neon" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-primary group-hover:text-neon transition-colors duration-200">
                High Alpha
              </h3>
              <p className="text-[11px] text-text-ghost font-mono">Score 8+ signals</p>
            </div>
            <ArrowRight className="w-4 h-4 text-border-mid group-hover:text-neon transition-all duration-200 group-hover:translate-x-0.5" />
          </div>
        </Link>

        <Link href="/projects?status=new" className="cyber-card p-4 group animate-in delay-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-ice/[0.08] border border-ice/15">
              <TrendingUp className="w-4 h-4 text-ice" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-primary group-hover:text-ice transition-colors duration-200">
                Needs Analysis
              </h3>
              <p className="text-[11px] text-text-ghost font-mono">Pending AI review</p>
            </div>
            <ArrowRight className="w-4 h-4 text-border-mid group-hover:text-ice transition-all duration-200 group-hover:translate-x-0.5" />
          </div>
        </Link>

        <Link href="/projects?category=defi" className="cyber-card p-4 group animate-in delay-7">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-phantom/[0.08] border border-phantom/15">
              <AlertTriangle className="w-4 h-4 text-phantom" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-primary group-hover:text-phantom transition-colors duration-200">
                DeFi Alpha
              </h3>
              <p className="text-[11px] text-text-ghost font-mono">High-risk, high-reward</p>
            </div>
            <ArrowRight className="w-4 h-4 text-border-mid group-hover:text-phantom transition-all duration-200 group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>

      {/* Top Projects */}
      <div className="animate-in delay-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Scan className="w-4 h-4 text-ice" />
            <h2 className="text-base font-semibold tracking-tight">
              Top Alpha Signals
            </h2>
            <span className="cyber-badge bg-elevated text-text-ghost border border-border-dim">
              {topProjects.length} found
            </span>
          </div>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-[12px] font-mono text-text-ghost hover:text-ice transition-colors duration-200"
          >
            VIEW ALL
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="cyber-card p-4 animate-pulse">
                <div className="h-36 bg-elevated/30 rounded" />
              </div>
            ))}
          </div>
        ) : topProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topProjects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        ) : (
          <div className="cyber-card p-10 text-center">
            <Scan className="w-8 h-8 text-border-mid mx-auto mb-3" />
            <p className="text-text-ghost font-mono text-sm">NO HIGH-SCORE SIGNALS DETECTED</p>
            <p className="text-[12px] text-text-ghost/60 mt-1.5">
              Run a scan to begin collecting project data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
