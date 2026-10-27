import { useEffect } from 'react';

const SITE_NAME = 'MovoX — Digital Growth';
const SITE_URL = 'https://heymovox.com';

interface SeoOptions {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
}

export function useSEO({ title, description, path, type = 'website' }: SeoOptions) {
  useEffect(() => {
    const fullTitle = path === '/' ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    setMeta('description', description);
    setMetaProperty('og:title', fullTitle);
    setMetaProperty('og:description', description);
    setMetaProperty('og:url', `${SITE_URL}${path}`);
    setMetaProperty('og:type', type);
    setMetaProperty('twitter:card', 'summary_large_image');
    setMetaProperty('twitter:title', fullTitle);
    setMetaProperty('twitter:description', description);

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `${SITE_URL}${path}`;
  }, [title, description, path, type]);
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.content = content;
}
