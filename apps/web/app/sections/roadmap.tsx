'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Clock } from 'lucide-react';
import { Container, Section, SectionHeader, SectionTitle, SectionDescription } from '@digital-family-tree/ui';
import { cn } from '@digital-family-tree/ui';

type PhaseStatus = 'completed' | 'in-progress' | 'upcoming';

const phases = [
  {
    phase: 'Phase 1',
    title: 'Foundation',
    status: 'in-progress' as PhaseStatus,
    items: [
      'Project architecture setup',
      'Design system & components',
      'Landing page & marketing site',
      'Core API scaffolding',
      'Database schema design',
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Core Features',
    status: 'upcoming' as PhaseStatus,
    items: [
      'User authentication & profiles',
      'Family tree builder',
      'Member management',
      'Basic media uploads',
      'Invitation system',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Enhancement',
    status: 'upcoming' as PhaseStatus,
    items: [
      'Interactive tree visualization',
      'Story & timeline features',
      'Advanced media gallery',
      'Search & discovery engine',
      'Mobile responsive optimization',
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Scale',
    status: 'upcoming' as PhaseStatus,
    items: [
      'AI-powered connections',
      'Multi-language support',
      'Export & archival tools',
      'Public tree sharing',
      'Premium features',
    ],
  },
];

function StatusIcon({ status }: { status: PhaseStatus }) {
  if (status === 'completed') {
    return <Check className="h-5 w-5 text-green-600" />;
  }
  if (status === 'in-progress') {
    return <Clock className="h-5 w-5 text-amber-500" />;
  }
  return <Circle className="h-5 w-5 text-muted-foreground/40" />;
}

export function RoadmapSection() {
  return (
    <Section id="roadmap">
      <Container className="px-4 sm:px-6 lg:px-8">
        <SectionHeader>
          <SectionTitle>Product Roadmap</SectionTitle>
          <SectionDescription>
            Our journey to build the ultimate family heritage platform. Here is where we are headed.
          </SectionDescription>
        </SectionHeader>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((phase, index) => (
            <motion.div
              key={phase.phase}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={cn(
                'rounded-2xl border p-6',
                phase.status === 'in-progress'
                  ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                  : 'border-border/60 bg-card/50',
              )}
            >
              <div className="mb-4 flex items-center gap-2">
                <StatusIcon status={phase.status} />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {phase.phase}
                </span>
              </div>
              <h3 className="mb-1 text-xl font-bold">{phase.title}</h3>
              <p
                className={cn(
                  'mb-4 text-xs font-medium capitalize',
                  phase.status === 'completed' && 'text-green-600',
                  phase.status === 'in-progress' && 'text-amber-500',
                  phase.status === 'upcoming' && 'text-muted-foreground',
                )}
              >
                {phase.status.replace('-', ' ')}
              </p>
              <ul className="space-y-2">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
