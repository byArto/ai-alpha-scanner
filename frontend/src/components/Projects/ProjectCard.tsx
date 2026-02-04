import Link from 'next/link';
import { ExternalLink, Github, Twitter, Globe, Star, GitCommit } from 'lucide-react';
import clsx from 'clsx';
import { Project } from '@/lib/api';

interface ProjectCardProps {
  project: Project;
  index?: number;
}

const categoryStyles: Record<string, { badge: string; dot: string }> = {
  defi: { badge: 'bg-phantom/10 text-phantom border-phantom/20', dot: 'bg-phantom' },
  l1: { badge: 'bg-ice/10 text-ice border-ice/20', dot: 'bg-ice' },
  l2: { badge: 'bg-neon/10 text-neon border-neon/20', dot: 'bg-neon' },
  infrastructure: { badge: 'bg-solar/10 text-solar border-solar/20', dot: 'bg-solar' },
  tooling: { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
  gaming: { badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20', dot: 'bg-pink-400' },
  nft: { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400' },
  ai: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  other: { badge: 'bg-elevated text-text-ghost border-border-dim', dot: 'bg-text-ghost' },
};

function getScoreVisuals(score: number) {
  if (score >= 8) return { color: 'text-neon', bar: 'bg-neon', glow: 'text-glow-neon', ring: 'border-neon/30' };
  if (score >= 6) return { color: 'text-ice', bar: 'bg-ice', glow: 'text-glow-ice', ring: 'border-ice/30' };
  if (score >= 4) return { color: 'text-solar', bar: 'bg-solar', glow: '', ring: 'border-solar/30' };
  return { color: 'text-text-ghost', bar: 'bg-text-ghost', glow: '', ring: 'border-border-dim' };
}

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const sv = getScoreVisuals(project.score);
  const cat = categoryStyles[project.category || 'other'] || categoryStyles.other;

  return (
    <Link href={`/projects/${project.slug}`}>
      <div className={clsx(
        'cyber-card p-4 h-full cursor-pointer scanline animate-in',
        `delay-${Math.min(index + 1, 8)}`
      )}>
        {/* Top row: name + score */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px] text-text-primary truncate leading-tight glitch-hover">
              {project.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              {project.category && (
                <span className={clsx('cyber-badge border', cat.badge)}>
                  <span className={clsx('inline-block w-1 h-1 rounded-full mr-1', cat.dot)} />
                  {project.category}
                </span>
              )}
              <span className="cyber-badge bg-elevated/60 text-text-ghost border border-border-dim">
                {project.source}
              </span>
            </div>
          </div>

          {/* Score circle */}
          <div className={clsx(
            'w-14 h-14 rounded-md border flex flex-col items-center justify-center flex-shrink-0',
            'bg-void/60',
            sv.ring
          )}>
            <span className={clsx('text-xl font-bold font-mono leading-none', sv.color, sv.glow)}>
              {project.score.toFixed(1)}
            </span>
            <span className="text-[8px] font-mono text-text-ghost mt-0.5 tracking-wider">
              SCORE
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] text-text-secondary mb-3 line-clamp-2 leading-relaxed">
          {project.description || 'No description available'}
        </p>

        {/* Score Bar */}
        <div className="score-bar mb-3">
          <div
            className={clsx('score-bar-fill', sv.bar)}
            style={{ width: `${project.score * 10}%` }}
          />
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-3 text-[11px] text-text-ghost font-mono mb-3">
          {project.github_stars !== null && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-solar/50" />
              <span>{project.github_stars}</span>
            </div>
          )}
          {project.github_commits_30d !== null && (
            <div className="flex items-center gap-1">
              <GitCommit className="w-3 h-3 text-neon/50" />
              <span>{project.github_commits_30d}<span className="text-text-ghost/50">/30d</span></span>
            </div>
          )}
          {project.confidence !== null && (
            <div className="ml-auto text-[10px]">
              <span className="text-text-ghost/50">CONF </span>
              <span className="text-text-secondary">{(project.confidence * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>

        {/* Bottom links */}
        <div className="cyber-divider mb-2.5" />
        <div className="flex items-center gap-1.5">
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded border border-transparent hover:border-border-mid hover:bg-elevated/50 transition-all duration-200"
            >
              <Github className="w-3.5 h-3.5 text-text-ghost hover:text-text-primary transition-colors" />
            </a>
          )}
          {project.twitter_url && (
            <a
              href={project.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded border border-transparent hover:border-border-mid hover:bg-elevated/50 transition-all duration-200"
            >
              <Twitter className="w-3.5 h-3.5 text-text-ghost hover:text-ice transition-colors" />
            </a>
          )}
          {project.website_url && (
            <a
              href={project.website_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded border border-transparent hover:border-border-mid hover:bg-elevated/50 transition-all duration-200"
            >
              <Globe className="w-3.5 h-3.5 text-text-ghost hover:text-neon transition-colors" />
            </a>
          )}
          <div className="ml-auto">
            <ExternalLink className="w-3.5 h-3.5 text-border-mid" />
          </div>
        </div>
      </div>
    </Link>
  );
}
