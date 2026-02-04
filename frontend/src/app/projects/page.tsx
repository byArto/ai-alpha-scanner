'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, Radar } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Radar className="w-6 h-6 text-cyber-cyan" />
          Projects Scanner
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {total} projects discovered
        </p>
      </div>

      {/* Filters */}
      <div className="cyber-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex items-center gap-2 bg-cyber-bg-tertiary rounded-lg px-3 py-2 border border-cyber-border flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="bg-transparent text-sm font-mono outline-none w-full text-white placeholder-gray-600"
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-cyber-bg-tertiary border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-white outline-none cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Source filter */}
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="bg-cyber-bg-tertiary border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-white outline-none cursor-pointer"
          >
            {sources.map(s => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>

          {/* Min score */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">MIN SCORE:</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-24 accent-cyber-green"
            />
            <span className="text-sm font-mono text-cyber-green w-8">{minScore}</span>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="cyber-card p-4 animate-pulse">
              <div className="h-40 bg-cyber-bg-tertiary rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="cyber-card p-12 text-center">
          <Radar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 font-mono">NO PROJECTS FOUND</p>
          <p className="text-sm text-gray-600 mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="cyber-card p-4 animate-pulse">
          <div className="h-12 bg-cyber-bg-tertiary rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="cyber-card p-4 animate-pulse">
              <div className="h-40 bg-cyber-bg-tertiary rounded" />
            </div>
          ))}
        </div>
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}
