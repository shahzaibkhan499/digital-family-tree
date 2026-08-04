export const appConfig = {
  name: 'Digital Family Tree',
  shortName: 'DFT',
  description:
    'A modern digital platform to discover, build, and preserve your family heritage across generations.',
  url: 'https://digitalfamilytree.com',
  ogImage: '/og-image.png',
  keywords: [
    'family tree',
    'genealogy',
    'family history',
    'ancestry',
    'heritage',
    'family lineage',
  ],
} as const;

export const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'FAQ', href: '#faq' },
] as const;

export const contactEmail = 'hello@digitalfamilytree.com';
