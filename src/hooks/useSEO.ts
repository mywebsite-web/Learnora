import { useEffect } from 'react';

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  canonicalPath?: string;
  type?: string;
}

const DEFAULT_TITLE = 'Learnora - Turn what you have into what you know';
const DEFAULT_DESCRIPTION = 'Turn what you have into what you know. Learnora is an AI personal lecturer and study workspace that transforms your notes, slides, and educational materials into an interactive learning experience.';
const DEFAULT_IMAGE = '/pwa-512x512.png';

export function useSEO({
  title,
  description,
  keywords,
  image = DEFAULT_IMAGE,
  canonicalPath = '',
  type = 'website'
}: SEOConfig = {}) {
  useEffect(() => {
    // 1. Title
    const formattedTitle = title 
      ? (title.includes('Learnora') ? title : `${title} – Learnora`)
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // 2. Helper to set or create meta tag
    const setMetaTag = (attribute: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attribute, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const effectiveDesc = description || DEFAULT_DESCRIPTION;

    // Standard meta
    setMetaTag('name', 'description', effectiveDesc);
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // OpenGraph
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', effectiveDesc);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:image', image);

    // Twitter
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', effectiveDesc);
    setMetaTag('name', 'twitter:image', image);

    // Canonical link
    if (typeof window !== 'undefined') {
      let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      const baseOrigin = window.location.origin;
      const cleanPath = canonicalPath 
        ? (canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`)
        : (window.location.pathname + window.location.search);
      canonicalEl.setAttribute('href', `${baseOrigin}${cleanPath}`);
    }
  }, [title, description, keywords, image, canonicalPath, type]);
}
