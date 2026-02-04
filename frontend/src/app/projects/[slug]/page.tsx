'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Github, Twitter, Globe, Star, GitCommit,
  Users, Calendar, ExternalLink, Shield
} from 'lucide-react';
import clsx from 'clsx';
import { fetchProject, ProjectDetail } from '@/lib/api';

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
      <div className="space-y-6">
        <div className="cyber-card p-6 animate-pulse">
          <div className="h-48 bg-cyber-bg-tertiary rounded" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="cyber-card p-12 text-center">
        <p className="text-gray-500 font-mono">PROJECT NOT FOUND</p>
        <Link href="/projects" className="text-cyber-cyan text-sm mt-4 inline-block">
          Back to Projects
        </Link>
      </div>
    );
  }

  const scoreColor = project.score >= 8
    ? 'text-cyber-green'
    : project.score >= 6
      ? 'text-cyber-cyan'
      : project.score >= 4
        ? 'text-cyber-yellow'
        : 'text-gray-500';

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-cyber-cyan transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-mono">BACK TO PROJECTS</span>
      </Link>

      {/* Header */}
      <div className="cyber-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            <div className="flex items-center gap-3 mb-4">
              {project.category && (
                <span className="cyber-badge bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30">
                  {project.category}
                </span>
              )}
              <span className="cyber-badge bg-cyber-bg-tertiary text-gray-400 border border-cyber-border">
                {project.source}
              </span>
              <span className={clsx(
                'cyber-badge border',
                project.status === 'analyzed'
                  ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
                  : 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30'
              )}>
                {project.status}
              </span>
            </div>
            <p className="text-gray-400 max-w-2xl">
              {project.description || 'No description available'}
            </p>
          </div>

          <div className="text-right">
            <div className={clsx('text-5xl font-bold font-mono', scoreColor)}>
              {project.score.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500 font-mono mt-1">
              SCORE / 10
            </div>
            <div className="text-xs text-gray-600 font-mono mt-1">
              conf: {(project.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-cyber-border">
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-bg-tertiary border border-cyber-border hover:border-cyber-green transition-all text-sm"
            >
              <Github className="w-4 h-4" />
              <span className="font-mono">GitHub</span>
              <ExternalLink className="w-3 h-3 text-gray-600" />
            </a>
          )}
          {project.twitter_url && (
            <a
              href={project.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-bg-tertiary border border-cyber-border hover:border-cyber-cyan transition-all text-sm"
            >
              <Twitter className="w-4 h-4" />
              <span className="font-mono">{project.twitter_handle || 'Twitter'}</span>
              <ExternalLink className="w-3 h-3 text-gray-600" />
            </a>
          )}
          {project.website_url && (
            <a
              href={project.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-bg-tertiary border border-cyber-border hover:border-cyber-purple transition-all text-sm"
            >
              <Globe className="w-4 h-4" />
              <span className="font-mono">Website</span>
              <ExternalLink className="w-3 h-3 text-gray-600" />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GitHub Metrics */}
        <div className="cyber-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Github className="w-5 h-5 text-cyber-cyan" />
            GitHub Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Stars', value: project.github_stars, icon: Star },
              { label: 'Forks', value: project.github_forks, icon: GitCommit },
              { label: 'Commits (30d)', value: project.github_commits_30d, icon: GitCommit },
              { label: 'Contributors', value: project.github_contributors, icon: Users },
            ].map((metric) => (
              <div key={metric.label} className="bg-cyber-bg-tertiary rounded-lg p-3 border border-cyber-border">
                <div className="flex items-center gap-2 mb-1">
                  <metric.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">{metric.label}</span>
                </div>
                <p className="text-xl font-bold font-mono text-white">
                  {metric.value ?? '—'}
                </p>
              </div>
            ))}
          </div>
          {project.github_language && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">Language:</span>
              <span className="cyber-badge bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">
                {project.github_language}
              </span>
            </div>
          )}
          {project.github_created_at && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>Created: {new Date(project.github_created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Analysis */}
        <div className="cyber-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyber-green" />
            AI Analysis
          </h2>
          {project.summary ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-500 mb-1">Summary</h3>
                <p className="text-gray-300 text-sm">{project.summary}</p>
              </div>
              {project.why_early && (
                <div>
                  <h3 className="text-sm text-gray-500 mb-1">Why Early</h3>
                  <p className="text-gray-300 text-sm whitespace-pre-line">{project.why_early}</p>
                </div>
              )}
              {project.red_flags && (
                <div>
                  <h3 className="text-sm text-cyber-red mb-1">Red Flags</h3>
                  <p className="text-gray-300 text-sm whitespace-pre-line">{project.red_flags}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 font-mono text-sm">NOT YET ANALYZED</p>
              <p className="text-xs text-gray-600 mt-2">
                Use the API to generate analysis prompts
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Discovered info */}
      <div className="text-xs text-gray-600 font-mono flex items-center gap-4">
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
