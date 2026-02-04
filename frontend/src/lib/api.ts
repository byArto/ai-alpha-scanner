import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  source: string;
  score: number;
  confidence: number;
  status: string;
  github_url: string | null;
  github_stars: number | null;
  github_commits_30d: number | null;
  twitter_url: string | null;
  website_url: string | null;
  discovered_at: string | null;
  why_early: string | null;
  summary: string | null;
}

export interface Stats {
  total: number;
  by_status: Record<string, number>;
  by_source: Record<string, number>;
  by_category: Record<string, number>;
}

// API functions
export const fetchProjects = async (params?: {
  status?: string;
  category?: string;
  source?: string;
  min_score?: number;
  limit?: number;
  offset?: number;
}): Promise<{ count: number; projects: Project[] }> => {
  const { data } = await api.get('/api/projects', { params });
  return data;
};

export interface ProjectDetail extends Project {
  github_org: string | null;
  github_forks: number | null;
  github_contributors: number | null;
  github_language: string | null;
  github_created_at: string | null;
  twitter_handle: string | null;
  discord_url: string | null;
  analyzed_at: string | null;
  red_flags: string | null;
}

export const fetchProject = async (slug: string): Promise<ProjectDetail> => {
  const { data } = await api.get(`/api/projects/${slug}`);
  return data;
};

export const fetchStats = async (): Promise<Stats> => {
  const { data } = await api.get('/api/stats');
  return data;
};

export const triggerCollection = async (source: 'github' | 'defillama' | 'all') => {
  const { data } = await api.post(`/api/collect/${source}`);
  return data;
};

export const getSchedulerStatus = async () => {
  const { data } = await api.get('/api/scheduler/status');
  return data;
};
