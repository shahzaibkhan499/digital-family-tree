'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, GitBranch, Camera, Sparkles, ChevronDown } from 'lucide-react';
import {
  Container,
  Section,
  SectionHeader,
  SectionTitle,
  SectionDescription,
} from '@digital-family-tree/ui';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Your Account',
    summary: 'Sign up in seconds and begin your journey.',
    details:
      'Register with your email and set a secure password. Your personal dashboard awaits — a private space to build and manage your family heritage.',
  },
  {
    icon: GitBranch,
    title: 'Build Your Tree',
    summary: 'Start with yourself and expand outward.',
    details:
      'Add parents, grandparents, and trace your lineage across generations. The interactive tree auto-layouts as your family grows, making complex relationships clear.',
  },
  {
    icon: Camera,
    title: 'Add Media & Documents',
    summary: 'Upload photos, records, and stories.',
    details:
      'Attach photographs, scanned documents, audio recordings, and video messages to any family member or event. Each file is encrypted and preserved in your Document Vault.',
  },
  {
    icon: Sparkles,
    title: 'Discover & Connect',
    summary: 'Let our platform find hidden links.',
    details:
      'Smart algorithms detect potential relatives, suggest connections between trees, and help you discover branches of your family you never knew existed. Merge duplicates with one click.',
  },
];

export function HowItWorksSection() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <Section id="how-it-works" className="bg-muted/30">
      <Container className="px-4 sm:px-6 lg:px-8">
        <SectionHeader>
          <SectionTitle>How It Works</SectionTitle>
          <SectionDescription>
            Four simple steps to preserving your family heritage for future generations.
          </SectionDescription>
        </SectionHeader>

        <div className="mx-auto grid max-w-4xl gap-4">
          {steps.map((step, i) => {
            const isOpen = expanded === i;
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="group flex w-full items-start gap-5 rounded-2xl border border-border/60 bg-card/50 p-5 text-left transition-all hover:border-green-200 hover:shadow-sm dark:hover:border-green-800 sm:p-6"
                  aria-expanded={isOpen}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:group-hover:bg-green-900/60">
                    <span className="text-xs font-bold opacity-50">0{i + 1}</span>
                    <Icon className="ml-1 h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">{step.summary}</p>
                      </div>
                      <ChevronDown
                        className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 text-sm leading-relaxed text-muted-foreground overflow-hidden"
                        >
                          {step.details}
                        </motion.p>
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
