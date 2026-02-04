'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, Radar, Scan } from 'lucide-react';
import ProjectCard from '@/components/Projects/ProjectCard';
import { fetchProjects, Project } from '@/lib/api';

const categories = ['all', 'defi', 'l1', 'l2', 'infrastructure', 'tooling', 'gaming', 'nft', 'ai', 'other'];
const sources = ['all', 'github', 'defillama', 'galxe', 'layer3', 'zealy'];

function ProjectsContent() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [source, setSource] = useState(searchParams.get('source') || 'all');
  const [minScore, setMinScore] = useState(Number(searchParams.get('min_score')) || 0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { limit: 50 };
        if (category !== 'all') params.category = category;
        if (source !== 'all') params.source = source;
        if (minScore > 0) params.min_score = minScore;

        const data = await fetchProjects(params);
        setProjects(data.projects);
        setTotal(data.count);
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
      setLoading(false);
    };
    loadProjects();
  }, [category, source, minScore]);

  const filtered = search
    ? projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="animate-in">
        <div className="flex items-center gap-2.5 mb-1">
          <Radar className="w-5 h-5 text-ice" />
          <h1 className="text-2xl font-bold tracking-tight">Projects Scanner</h1>
        </div>
        <p className="text-text-ghost text-sm font-mono">
          {total} projects indexed <span className="text-border-mid">|</span> {filtered.length} displayed
        </p>
      </div>

      {/* Filters bar */}
      <div className="cyber-card p-3.5 animate-in delay-1">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-text-ghost flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description..."
              className="cyber-input w-full border-0 bg-transparent p-0 text-sm"
            />
          </div>

          <div className="h-5 w-px bg-border-dim hidden md:block" />

          {/* Category */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-text-ghost" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="cyber-select"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Source */}
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="cyber-select"
          >
            {sources.map(s => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>

          {/* Score range */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-ghost font-mono tracking-wider">SCORE</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm font-mono text-neon w-7 text-right tabular-nums">
              {minScore}
            </span>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="cyber-card p-4 animate-pulse">
              <div className="h-44 bg-elevated/30 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      ) : (
        <div className="cyber-card p-14 text-center">
          <Scan className="w-10 h-10 text-border-mid mx-auto mb-3" />
          <p className="text-text-ghost font-mono text-sm">NO MATCHING PROJECTS</p>
          <p className="text-[12px] text-text-ghost/50 mt-1.5">Adjust filters or run a new scan</p>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-5">
        <div className="cyber-card p-3.5 animate-pulse">
          <div className="h-10 bg-elevated/30 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="cyber-card p-4 animate-pulse">
              <div className="h-44 bg-elevated/30 rounded" />
            </div>
          ))}
        </div>
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}
