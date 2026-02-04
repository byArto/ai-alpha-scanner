'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="text-cyber-green text-glow-green">&#9670;</span>
            Command Center
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Early-stage crypto project intelligence
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-cyber-green pulse-glow" />
          <span className="text-gray-400 font-mono">LIVE</span>
        </div>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/projects?min_score=8" className="cyber-card p-4 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-green/10 border border-cyber-green/20">
              <Zap className="w-5 h-5 text-cyber-green" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white group-hover:text-cyber-green transition-colors">
                High Alpha Projects
              </h3>
              <p className="text-xs text-gray-500">Score 8+</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-cyber-green transition-colors" />
          </div>
        </Link>

        <Link href="/projects?status=new" className="cyber-card p-4 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20">
              <TrendingUp className="w-5 h-5 text-cyber-cyan" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white group-hover:text-cyber-cyan transition-colors">
                Needs Analysis
              </h3>
              <p className="text-xs text-gray-500">Pending AI review</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-cyber-cyan transition-colors" />
          </div>
        </Link>

        <Link href="/projects?category=defi" className="cyber-card p-4 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-purple/10 border border-cyber-purple/20">
              <AlertTriangle className="w-5 h-5 text-cyber-purple" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white group-hover:text-cyber-purple transition-colors">
                DeFi Projects
              </h3>
              <p className="text-xs text-gray-500">High-risk, high-reward</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-cyber-purple transition-colors" />
          </div>
        </Link>
      </div>

      {/* Top Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-cyber-cyan">&#9657;</span>
            Top Alpha Signals
          </h2>
          <Link
            href="/projects"
            className="text-sm text-cyber-cyan hover:text-cyber-green transition-colors flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="cyber-card p-4 animate-pulse">
                <div className="h-32 bg-cyber-bg-tertiary rounded" />
              </div>
            ))}
          </div>
        ) : topProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="cyber-card p-8 text-center">
            <p className="text-gray-500 font-mono">NO HIGH-SCORE PROJECTS YET</p>
            <p className="text-sm text-gray-600 mt-2">Run a scan to discover projects</p>
          </div>
        )}
      </div>
    </div>
  );
}
