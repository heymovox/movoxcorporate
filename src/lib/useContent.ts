/**
 * Public content reads.
 *
 * The database is the single source of truth for marketing content: if there
 * are no published works or posts, the site renders its empty state rather
 * than falling back to bundled placeholder data. Publish real content through
 * the admin to fill these pages.
 */
import { useEffect, useState } from 'react';
import type { CaseStudy } from '../data/portfolio';
import type { Insight } from '../data/insights';

const BASE = import.meta.env.VITE_API_URL ?? 'https://api.heymovox.com';

async function fetchPublic<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.ok) return null;
    return data.items as T;
  } catch {
    return null;
  }
}

async function fetchOne<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.ok) return null;
    return data.item as T;
  } catch {
    return null;
  }
}

interface ContentState<T> {
  items: T[];
  loading: boolean;
}

/** Published case studies. Empty until content is added in the admin. */
export function useWorks(): ContentState<CaseStudy> {
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPublic<CaseStudy[]>('/api/content/works').then(remote => {
      if (cancelled) return;
      setItems(remote ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading };
}

/** A single case study by slug. */
export function useWork(slug: string | undefined): { item: CaseStudy | null; loading: boolean } {
  const [item, setItem] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchOne<CaseStudy>(`/api/content/works/${slug}`)
      .then(remote => {
        if (cancelled) return;
        setItem(remote);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { item, loading };
}

/** Published blog posts. Empty until content is added in the admin. */
export function useBlogs(): ContentState<Insight> {
  const [items, setItems] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPublic<Insight[]>('/api/content/blogs').then(remote => {
      if (cancelled) return;
      setItems(remote ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading };
}

/** A single blog post by slug. */
export function useBlog(slug: string | undefined): { item: Insight | null; loading: boolean } {
  const [item, setItem] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchOne<Insight>(`/api/content/blogs/${slug}`)
      .then(remote => {
        if (cancelled) return;
        setItem(remote);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { item, loading };
}