import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
}

const DEFAULT_TITLE = 'LOUIS (LOUISE) - Learning Operation Unified Interactive System';
const DEFAULT_DESCRIPTION = 'LOUIS (Louise) LMS di louise.my.id adalah platform pembelajaran digital modern untuk guru dan siswa. Kelola kelas, tugas, absensi, leaderboard, dan komunikasi pembelajaran dalam satu dashboard.';
const DEFAULT_KEYWORDS = 'LOUIS LMS, Louise LMS, louis lms, louise lms, louise.my.id, Learning Management System Indonesia, Sistem Pembelajaran Digital, Platform Pendidikan Modern, Manajemen Kelas Online, Absensi Digital, Tugas Online';

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  ogTitle,
  ogDescription,
  ogImage,
  canonical,
}: SEOProps = {}) {
  const location = useLocation();

  useEffect(() => {
    // Update document title
    const fullTitle = title 
      ? `${title} | ${DEFAULT_TITLE}`
      : DEFAULT_TITLE;
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Update description
    updateMetaTag('description', description);
    updateMetaTag('og:description', ogDescription || description, true);
    updateMetaTag('twitter:description', ogDescription || description, true);

    // Update title
    updateMetaTag('og:title', ogTitle || fullTitle, true);
    updateMetaTag('twitter:title', ogTitle || fullTitle, true);

    // Update keywords
    updateMetaTag('keywords', keywords);

    // Update OG image
    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
      updateMetaTag('twitter:image', ogImage, true);
    }

    // Update canonical URL
    const canonicalUrl = canonical || `${window.location.origin}${location.pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    
    canonicalLink.setAttribute('href', canonicalUrl);

    // Update OG URL
    updateMetaTag('og:url', canonicalUrl, true);
    updateMetaTag('twitter:url', canonicalUrl, true);

    // Cleanup function (optional, but good practice)
    return () => {
      // Reset to default on unmount if needed
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, canonical, location.pathname]);
}

