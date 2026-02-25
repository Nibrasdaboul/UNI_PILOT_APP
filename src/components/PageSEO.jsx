import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { getSEOForPath } from '@/lib/routeSEO';

const APP_NAME = 'UniPilot';

/**
 * Updates document title, meta description, and canonical link on route change.
 * Place once inside Router + LanguageProvider (e.g. in App.jsx).
 */
export function PageSEO() {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const { title, description } = getSEOForPath(pathname, t);

  useEffect(() => {
    document.title = title || APP_NAME;
  }, [title]);

  useEffect(() => {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description || '');
  }, [description]);

  useEffect(() => {
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : (import.meta.env.VITE_APP_URL || import.meta.env.VITE_BACKEND_URL || '');
    const canonicalUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}${pathname || '/'}` : '';

    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);
  }, [pathname]);

  return null;
}
