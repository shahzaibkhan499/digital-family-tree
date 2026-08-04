'use client';

import { motion } from 'framer-motion';
import { Zap, Lock, Globe, Clock } from 'lucide-react';
import {
  Container,
  Section,
  SectionHeader,
  SectionTitle,
  SectionDescription,
} from '@digital-family-tree/ui';

const reasons = [
  {
    icon: Zap,
    title: 'Built for Speed',
    description:
      'Powered by Next.js and NestJS, your tree loads instantly even with thousands of members. Every interaction feels immediate, every page loads in milliseconds.',
    gradient: 'from-green-500/10 to-emerald-500/5',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description:
      'AES-256 encryption at rest, TLS 1.3 in transit. Your family data is protected with the same standards used by financial institutions. We never share or sell your information.',
    gradient: 'from-emerald-500/10 to-teal-500/5',
  },
  {
    icon: Globe,
    title: 'Global & Accessible',
    description:
      'Connect with family across the world. Multi-language support, timezone-aware features, and fully responsive design ensure everyone stays in sync, anywhere.',
    gradient: 'from-teal-500/10 to-cyan-500/5',
  },
  {
    icon: Clock,
    title: 'Built to Last',
    description:
      'Redundant infrastructure with automated backups means your heritage is safe for generations. We are committed to long-term digital preservation, not short-term trends.',
    gradient: 'from-violet-500/10 to-purple-500/5',
  },
];

export function WhyChooseUsSection() {
  return (
    <Section>
      <Container className="px-4 sm:px-6 lg:px-8">
        <SectionHeader>
          <SectionTitle>Why Choose Us</SectionTitle>
          <SectionDescription>
            We are building more than software — we are creating a lasting digital home for your
            family&apos;s story.
          </SectionDescription>
        </SectionHeader>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, i) => {
            const Icon = reason.icon;
            return (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 text-center transition-all hover:shadow-md"
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${reason.gradient}`} />
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950">
                    <Icon className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{reason.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {reason.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
