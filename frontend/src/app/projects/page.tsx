'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, RefreshCw, ChevronDown } from 'lucide-react';
import ProjectCard from '@/components/Projects/ProjectCard';
import { fetchProjects, Project } from '@/lib/api';
import clsx from 'clsx';

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'defi', label: 'DeFi' },
  { value: 'l1', label: 'Layer 1' },
  { value: 'l2', label: 'Layer 2' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'tooling', label: 'Tooling' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'nft', label: 'NFT' },
  { value: 'ai', label: 'AI' },
  { value: 'other', label: 'Other' },
];

const sources = [
  { value: '', label: 'All Sources' },
  { value: 'github', label: 'GitHub' },
  { value: 'manual', label: 'DeFiLlama' },
];

const statuses = [
  { value: '', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'analyzed', label: 'Analyzed' },
  { value: 'archived', label: 'Archived' },
];

const scoreFilters = [
  { value: 0, label: 'Any Score' },
  { value: 5, label: '5+ Score' },
  { value: 6, label: '6+ Score' },
  { value: 7, label: '7+ Score' },
  { value: 8, label: '8+ Score' },
  { value: 9, label: '9+ Score' },
];

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [source, setSource] = useState(searchParams.get('source') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [minScore, setMinScore] = useState(Number(searchParams.get('min_score')) || 0);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = { limit: 50 };
      if (category) params.category = category;
      if (source) params.source = source;
      if (status) params.status = status;
      if (minScore > 0) params.min_score = minScore;

      const data = await fetchProjects(params);

      let filtered = data.projects;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
        );
      }

      setProjects(filtered);
      setTotalCount(data.count);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
    setLoading(false);
  }, [category, source, status, minScore, searchQuery]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (source) params.set('source', source);
    if (status) params.set('status', status);
    if (minScore > 0) params.set('min_score', minScore.toString());

    const newUrl = params.toString() ? `?${params.toString()}` : '/projects';
    router.push(newUrl, { scroll: false });
  }, [category, source, status, minScore, router]);

  const activeFiltersCount = [category, source, status, minScore > 0].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Database</h1>
          <p className="text-text-ghost text-sm font-mono mt-1">
            {totalCount} indexed
            <span className="text-border-mid mx-2">·</span>
            {projects.length} displayed
          </p>
        </div>
        <button
          onClick={loadProjects}
          disabled={loading}
          className="cyber-btn flex items-center gap-2 disabled:opacity-40"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5 text-ice', loading && 'animate-spin')} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Filters */}
      <div className="cyber-card p-4 animate-in delay-1">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-3.5 h-3.5 text-neon" />
          <span className="text-sm font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="cyber-badge bg-neon/10 text-neon border border-neon/20">
              {activeFiltersCount} active
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-ghost" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cyber-input w-full pl-9"
            />
          </div>

          {/* Category */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="cyber-select w-full"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-ghost pointer-events-none" />
          </div>

          {/* Source */}
          <div className="relative">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="cyber-select w-full"
            >
              {sources.map((src) => (
                <option key={src.value} value={src.value}>{src.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-ghost pointer-events-none" />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="cyber-select w-full"
            >
              {statuses.map((st) => (
                <option key={st.value} value={st.value}>{st.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-ghost pointer-events-none" />
          </div>

          {/* Min Score */}
          <div className="relative">
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="cyber-select w-full"
            >
              {scoreFilters.map((sf) => (
                <option key={sf.value} value={sf.value}>{sf.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-ghost pointer-events-none" />
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <button
            onClick={() => {
              setCategory('');
              setSource('');
              setStatus('');
              setMinScore(0);
              setSearchQuery('');
            }}
            className="mt-3 text-[11px] font-mono text-heat hover:text-heat-dim transition-colors"
          >
            ✕ CLEAR ALL FILTERS
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="cyber-card p-4 animate-pulse">
              <div className="h-44 bg-elevated/30 rounded" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="cyber-card p-14 text-center">
          <p className="text-text-ghost font-mono text-sm">NO MATCHING PROJECTS</p>
          <p className="text-[12px] text-text-ghost/50 mt-1.5">Adjust filters or run a new scan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-5">
        <div className="cyber-card p-4 animate-pulse">
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
