/**
 * Route-level SEO: title and description keys (from translations) or static text.
 * Used by PageSEO to set document.title and meta description per route.
 */
const defaultTitle = 'UniPilot — Your Smart Academic Companion';
const defaultDescription = 'Smart student dashboard, AI coach, planner, grades, and study tools. For students and universities.';

export const routeSEO = {
  '/': {
    title: defaultTitle,
    titleKey: null,
    description: defaultDescription,
    descriptionKey: null,
  },
  '/privacy': {
    title: 'Privacy Policy — UniPilot',
    titleKey: null,
    description: 'UniPilot privacy policy. How we collect, use, and protect your data.',
    descriptionKey: null,
  },
  '/terms': {
    title: 'Terms of Service — UniPilot',
    titleKey: null,
    description: 'UniPilot terms of service and usage conditions.',
    descriptionKey: null,
  },
  '/pricing': {
    title: 'Pricing — UniPilot for Universities',
    titleKey: null,
    description: 'UniPilot pricing for universities and institutions. Smart academic companion license.',
    descriptionKey: null,
  },
  '/dashboard': {
    titleKey: 'nav.dashboard',
    description: 'Smart academic dashboard — overview, tasks, and AI advisor. UniPilot.',
    descriptionKey: null,
  },
  '/courses': {
    titleKey: 'nav.courses',
    descriptionKey: 'courses.subtitle',
  },
  '/academic-history': {
    titleKey: 'nav.academicHistory',
    description: 'Academic history and performance across semesters. UniPilot.',
    descriptionKey: null,
  },
  '/planner': {
    titleKey: 'nav.planner',
    descriptionKey: 'planner.subtitle',
  },
  '/ai-coach': {
    titleKey: 'nav.aiConsultant',
    description: 'AI Professor — study advice and academic guidance. UniPilot.',
    descriptionKey: null,
  },
  '/analytics': {
    titleKey: 'nav.analytics',
    descriptionKey: 'analytics.subtitle',
  },
  '/study-tools': {
    titleKey: 'nav.studyTools',
    descriptionKey: 'studyTools.subtitle',
  },
  '/notes': {
    titleKey: 'nav.notes',
    description: 'Notes and materials — UniPilot',
    descriptionKey: null,
  },
  '/subject-tree': {
    titleKey: 'nav.subjectTree',
    description: 'Subject tree and structure — UniPilot',
    descriptionKey: null,
  },
  '/voice-to-text': {
    titleKey: 'nav.voiceToText',
    descriptionKey: 'voiceToText.subtitle',
  },
  '/translate-video': {
    titleKey: 'nav.translateVideo',
    descriptionKey: 'toolTranslateVideoDesc',
  },
  '/read-texts': {
    titleKey: 'nav.readTexts',
    descriptionKey: 'voiceToText.subtitle',
  },
  '/infographics': {
    titleKey: 'nav.infographics',
    descriptionKey: 'infographics.subtitle',
  },
  '/theses': {
    titleKey: 'nav.theses',
    descriptionKey: 'theses.subtitle',
  },
  '/settings': {
    title: 'Settings — UniPilot',
    titleKey: null,
    description: 'Profile and app settings — UniPilot',
    descriptionKey: null,
  },
  '/admin': {
    titleKey: 'nav.admin',
    description: 'Admin panel — UniPilot',
    descriptionKey: null,
  },
  '/admin/notifications': {
    titleKey: 'nav.adminNotifications',
    description: 'Admin notifications — UniPilot',
    descriptionKey: null,
  },
  '/admin-notifications': {
    titleKey: 'nav.adminNotifications',
    description: 'Admin notifications — UniPilot',
    descriptionKey: null,
  },
};

/** Get SEO for path; supports pathname prefixes (e.g. /courses/123 -> /courses) */
export function getSEOForPath(pathname, t) {
  const path = pathname.replace(/\/$/, '') || '/';
  let config = routeSEO[path];
  if (!config) {
    if (path.startsWith('/courses/')) config = routeSEO['/courses'];
    else config = routeSEO['/'] || {};
  }
  const rawTitle = config.titleKey && t ? t(config.titleKey) : (config.title || defaultTitle);
  const title = config.titleKey && t ? `${rawTitle} — UniPilot` : rawTitle;
  const description = config.descriptionKey && t ? t(config.descriptionKey) : (config.description || defaultDescription);
  return { title: title || defaultTitle, description };
}

export { defaultTitle, defaultDescription };
