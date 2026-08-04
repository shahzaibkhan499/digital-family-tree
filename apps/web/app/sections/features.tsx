'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  CalendarDays,
  FolderLock,
  Shield,
  Users,
  Search,
  ChevronDown,
} from 'lucide-react';
import {
  Container,
  Section,
  SectionHeader,
  SectionTitle,
  SectionDescription,
} from '@digital-family-tree/ui';

const features = [
  {
    icon: GitBranch,
    title: 'Interactive Family Tree',
    subtitle: 'Visualize your lineage',
    description:
      'Build and explore your family tree with an interactive SVG canvas. Add members, connect relationships across generations, and watch your heritage unfold organically.',
    details: [
      'Drag-and-drop member placement',
      'Auto-layout for large trees',
      'Multiple relationship types',
      'Export to GEDCOM format',
    ],
  },
  {
    icon: CalendarDays,
    title: 'Rich Timeline Events',
    subtitle: '33 event types & counting',
    description:
      'Capture every milestone with purpose-built event types — from births, marriages, and graduations to cultural ceremonies, migrations, and heirloom handovers.',
    details: [
      '33 specialized event types',
      'Date ranges and approximate dates',
      'Media attachments per event',
      'Calendar, agenda & anniversary views',
    ],
  },
  {
    icon: FolderLock,
    title: 'Document Vault',
    subtitle: 'Secure family archive',
    description:
      'Upload and organize birth certificates, property deeds, letters, and historical records. Each document is encrypted and versioned for permanent preservation.',
    details: [
      'Encrypted storage at rest',
      'Document versioning',
      'Smart OCR search',
      'Multi-format support',
    ],
  },
  {
    icon: Shield,
    title: 'Granular Privacy Controls',
    subtitle: 'You decide who sees what',
    description:
      'Control access at the branch, member, and event level. Share selectively with family, clan members, or keep certain records private forever.',
    details: [
      'Per-branch visibility settings',
      'Invite-only collaboration',
      'Public tree opt-in',
      'Audit log of all access',
    ],
  },
  {
    icon: Users,
    title: 'Clan & Community System',
    subtitle: 'Connect beyond the tree',
    description:
      'Organize extended family into Clans and SubClans. Build community directories, share histories, and collaborate on collective heritage projects.',
    details: [
      'Clan → SubClan hierarchy',
      'Community directories',
      'Shared clan histories',
      'Role-based administration',
    ],
  },
  {
    icon: Search,
    title: 'Smart Discovery Engine',
    subtitle: 'Find hidden connections',
    description:
      'Our matching algorithms find potential relatives, suggest connections between trees, and help you discover branches of your family you never knew existed.',
    details: [
      'Automated duplicate detection',
      'Cross-family matching',
      'Merge preview & approval',
      'Relationship suggestions',
    ],
  },
];

export function FeaturesSection() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <Section id="features">
      <Container className="px-4 sm:px-6 lg:px-8">
        <SectionHeader>
          <SectionTitle>Everything You Need</SectionTitle>
          <SectionDescription>
            Powerful tools designed to help you document, explore, and share your family history
            across generations.
          </SectionDescription>
        </SectionHeader>

        <div className="mx-auto grid max-w-5xl gap-4">
          {features.map((feature, i) => {
            const isOpen = expanded === i;
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="group flex w-full items-start gap-5 rounded-2xl border border-border/60 bg-card/50 p-5 text-left transition-all hover:border-green-200 hover:shadow-sm hover:shadow-green-100/50 dark:hover:border-green-800 dark:hover:shadow-green-950/20 sm:p-6"
                  aria-expanded={isOpen}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:group-hover:bg-green-900/60">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">{feature.subtitle}</p>
                      </div>
                      <ChevronDown
                        className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    <p
                      className={`mt-3 text-sm leading-relaxed text-muted-foreground ${isOpen ? '' : 'line-clamp-2'}`}
                    >
                      {feature.description}
                    </p>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2 overflow-hidden"
                        >
                          {feature.details.map((d) => (
                            <li
                              key={d}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                              {d}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
