'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Github, Twitter, Globe, Star, GitCommit,
  Users, Calendar, ExternalLink, Shield, AlertTriangle, Scan
} from 'lucide-react';
import clsx from 'clsx';
import { fetchProject, ProjectDetail } from '@/lib/api';

function getScoreVisuals(score: number) {
  if (score >= 8) return { color: 'text-neon', glow: 'text-glow-neon', bg: 'bg-neon', ring: 'border-neon/30' };
  if (score >= 6) return { color: 'text-ice', glow: 'text-glow-ice', bg: 'bg-ice', ring: 'border-ice/30' };
  if (score >= 4) return { color: 'text-solar', glow: '', bg: 'bg-solar', ring: 'border-solar/30' };
  return { color: 'text-text-ghost', glow: '', bg: 'bg-text-ghost', ring: 'border-border-dim' };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProject(slug);
        setProject(data);
      } catch (error) {
        console.error('Failed to load project:', error);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-5">
        {[1, 2].map(i => (
          <div key={i} className="cyber-card p-6 animate-pulse">
            <div className="h-40 bg-elevated/30 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="cyber-card p-14 text-center">
        <Scan className="w-10 h-10 text-border-mid mx-auto mb-3" />
        <p className="text-text-ghost font-mono text-sm">PROJECT NOT FOUND</p>
        <Link href="/projects" className="text-ice text-sm mt-3 inline-block hover:underline">
          Back to Projects
        </Link>
      </div>
    );
  }

  const sv = getScoreVisuals(project.score);

  return (
    <div className="space-y-5">
      {/* Back nav */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-text-ghost hover:text-ice transition-colors duration-200 text-sm animate-in"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="font-mono text-[11px] tracking-wider">PROJECTS</span>
      </Link>

      {/* Main header card */}
      <div className="cyber-card p-6 animate-in delay-1">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2 glitch-hover">
              {project.name}
            </h1>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {project.category && (
                <span className="cyber-badge bg-phantom/10 text-phantom border border-phantom/20">
                  {project.category}
                </span>
              )}
              <span className="cyber-badge bg-elevated text-text-ghost border border-border-dim">
                {project.source}
              </span>
              <span className={clsx(
                'cyber-badge border',
                project.status === 'analyzed'
                  ? 'bg-neon/10 text-neon border-neon/20'
                  : 'bg-solar/10 text-solar border-solar/20'
              )}>
                {project.status}
              </span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">
              {project.description || 'No description available'}
            </p>
          </div>

          {/* Score display */}
          <div className={clsx(
            'flex-shrink-0 w-24 h-24 rounded-lg border flex flex-col items-center justify-center',
            'bg-void/80',
            sv.ring
          )}>
            <span className={clsx('text-4xl font-bold font-mono leading-none', sv.color, sv.glow)}>
              {project.score.toFixed(1)}
            </span>
            <div className="text-[9px] font-mono text-text-ghost mt-1 tracking-wider">SCORE / 10</div>
            <div className="text-[9px] font-mono text-text-ghost/60 mt-0.5">
              CONF {(project.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* External links */}
        <div className="cyber-divider my-5" />
        <div className="flex items-center gap-2 flex-wrap">
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="cyber-btn flex items-center gap-2"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GITHUB</span>
              <ExternalLink className="w-3 h-3 text-text-ghost" />
            </a>
          )}
          {project.twitter_url && (
            <a
              href={project.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="cyber-btn flex items-center gap-2"
            >
              <Twitter className="w-3.5 h-3.5" />
              <span>{project.twitter_handle || 'TWITTER'}</span>
              <ExternalLink className="w-3 h-3 text-text-ghost" />
            </a>
          )}
          {project.website_url && (
            <a
              href={project.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="cyber-btn flex items-center gap-2"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>WEBSITE</span>
              <ExternalLink className="w-3 h-3 text-text-ghost" />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GitHub Metrics */}
        <div className="cyber-card p-5 animate-in delay-2">
          <div className="flex items-center gap-2 mb-4">
            <Github className="w-4 h-4 text-ice" />
            <h2 className="text-sm font-semibold tracking-wide">GitHub Metrics</h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'STARS', value: project.github_stars, icon: Star, accent: 'text-solar' },
              { label: 'FORKS', value: project.github_forks, icon: GitCommit, accent: 'text-ice' },
              { label: 'COMMITS/30D', value: project.github_commits_30d, icon: GitCommit, accent: 'text-neon' },
              { label: 'CONTRIBUTORS', value: project.github_contributors, icon: Users, accent: 'text-phantom' },
            ].map((metric) => (
              <div key={metric.label} className="bg-deep rounded-md p-3 border border-border-dim">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <metric.icon className={clsx('w-3 h-3', metric.accent)} />
                  <span className="text-[9px] font-mono text-text-ghost tracking-wider">
                    {metric.label}
                  </span>
                </div>
                <p className="text-xl font-bold font-mono text-text-primary">
                  {metric.value ?? '\u2014'}
                </p>
              </div>
            ))}
          </div>

          {(project.github_language || project.github_created_at) && (
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              {project.github_language && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-text-ghost tracking-wider">LANG:</span>
                  <span className="cyber-badge bg-ice/10 text-ice border border-ice/20">
                    {project.github_language}
                  </span>
                </div>
              )}
              {project.github_created_at && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-ghost">
                  <Calendar className="w-3 h-3" />
                  <span>Created {new Date(project.github_created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Analysis */}
        <div className="cyber-card p-5 animate-in delay-3">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-neon" />
            <h2 className="text-sm font-semibold tracking-wide">AI Analysis</h2>
          </div>

          {project.summary ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-[10px] font-mono text-text-ghost tracking-wider mb-1.5">SUMMARY</h3>
                <p className="text-text-secondary text-[13px] leading-relaxed">{project.summary}</p>
              </div>
              {project.why_early && (
                <div>
                  <h3 className="text-[10px] font-mono text-text-ghost tracking-wider mb-1.5">EARLY SIGNALS</h3>
                  <p className="text-text-secondary text-[13px] leading-relaxed whitespace-pre-line">{project.why_early}</p>
                </div>
              )}
              {project.red_flags && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3 h-3 text-heat" />
                    <h3 className="text-[10px] font-mono text-heat tracking-wider">RED FLAGS</h3>
                  </div>
                  <p className="text-text-secondary text-[13px] leading-relaxed whitespace-pre-line">{project.red_flags}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-8 h-8 rounded-md border border-border-dim bg-elevated/30 flex items-center justify-center mx-auto mb-3">
                <Scan className="w-4 h-4 text-border-mid" />
              </div>
              <p className="text-text-ghost font-mono text-[11px] tracking-wider">AWAITING ANALYSIS</p>
              <p className="text-[11px] text-text-ghost/50 mt-1">
                Generate a prompt via the API to analyze this project
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="text-[10px] text-text-ghost/50 font-mono flex items-center gap-4 animate-in delay-4">
        {project.discovered_at && (
          <span>Discovered: {new Date(project.discovered_at).toLocaleString()}</span>
        )}
        {project.analyzed_at && (
          <span>Analyzed: {new Date(project.analyzed_at).toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}
