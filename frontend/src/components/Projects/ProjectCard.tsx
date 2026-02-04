import Link from 'next/link';
import { ExternalLink, Github, Twitter, Globe, Star, GitCommit } from 'lucide-react';
import clsx from 'clsx';
import { Project } from '@/lib/api';

interface ProjectCardProps {
  project: Project;
}

const categoryColors: Record<string, string> = {
  defi: 'bg-cyber-purple/20 text-cyber-purple border-cyber-purple/30',
  l1: 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/30',
  l2: 'bg-cyber-green/20 text-cyber-green border-cyber-green/30',
  infrastructure: 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30',
  tooling: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  gaming: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  nft: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ai: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const sourceIcons: Record<string, string> = {
  github: '⌨️',
  manual: '📊',
  galxe: '🎯',
  layer3: '🔷',
  zealy: '⚡',
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const scoreColor = project.score >= 8
    ? 'text-cyber-green'
    : project.score >= 6
      ? 'text-cyber-cyan'
      : project.score >= 4
        ? 'text-cyber-yellow'
        : 'text-gray-500';

  const scoreBarColor = project.score >= 8
    ? 'bg-cyber-green'
    : project.score >= 6
      ? 'bg-cyber-cyan'
      : project.score >= 4
        ? 'bg-cyber-yellow'
        : 'bg-gray-500';

  return (
    <Link href={`/projects/${project.slug}`}>
      <div className="cyber-card p-4 h-full scanline cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{sourceIcons[project.source] || '📦'}</span>
              <h3 className="font-semibold text-white truncate">{project.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              {project.category && (
                <span className={clsx(
                  'cyber-badge border',
                  categoryColors[project.category] || categoryColors.other
                )}>
                  {project.category}
                </span>
              )}
              <span className="cyber-badge bg-cyber-bg-tertiary text-gray-400 border border-cyber-border">
                {project.source}
              </span>
            </div>
          </div>

          {/* Score */}
          <div className="text-right ml-3">
            <div className={clsx('text-2xl font-bold font-mono', scoreColor)}>
              {project.score.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 font-mono">SCORE</div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
          {project.description || 'No description available'}
        </p>

        {/* Score Bar */}
        <div className="score-bar mb-3">
          <div
            className={clsx('score-bar-fill', scoreBarColor)}
            style={{ width: `${project.score * 10}%` }}
          />
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-4 text-xs text-gray-500 font-mono mb-3">
          {project.github_stars !== null && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>{project.github_stars}</span>
            </div>
          )}
          {project.github_commits_30d !== null && (
            <div className="flex items-center gap-1">
              <GitCommit className="w-3 h-3" />
              <span>{project.github_commits_30d}/30d</span>
            </div>
          )}
          {project.confidence !== null && (
            <div className="flex items-center gap-1 text-gray-600">
              <span>conf: {(project.confidence * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="flex items-center gap-2 pt-2 border-t border-cyber-border">
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded bg-cyber-bg-tertiary hover:bg-cyber-border transition-colors"
            >
              <Github className="w-4 h-4 text-gray-400 hover:text-white" />
            </a>
          )}
          {project.twitter_url && (
            <a
              href={project.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded bg-cyber-bg-tertiary hover:bg-cyber-border transition-colors"
            >
              <Twitter className="w-4 h-4 text-gray-400 hover:text-cyber-cyan" />
            </a>
          )}
          {project.website_url && (
            <a
              href={project.website_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded bg-cyber-bg-tertiary hover:bg-cyber-border transition-colors"
            >
              <Globe className="w-4 h-4 text-gray-400 hover:text-cyber-green" />
            </a>
          )}
          <div className="ml-auto">
            <ExternalLink className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </div>
    </Link>
  );
}
