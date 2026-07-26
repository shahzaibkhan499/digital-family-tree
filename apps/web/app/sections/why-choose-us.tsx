'use client';

import { motion } from 'framer-motion';
import { Zap, Lock, Globe, Clock } from 'lucide-react';
import { Container, Section, SectionHeader, SectionTitle, SectionDescription } from '@digital-family-tree/ui';

const reasons = [
  {
    icon: Zap,
    title: 'Built for Speed',
    description:
      'Our modern architecture ensures your family tree loads instantly, even with thousands of members and media files.',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description:
      'Bank-level encryption protects your most precious memories. Your data is stored securely and never shared without your consent.',
  },
  {
    icon: Globe,
    title: 'Global Platform',
    description:
      'Connect with family members across the world. Multi-language support and timezone-aware features keep everyone in sync.',
  },
  {
    icon: Clock,
    title: 'Built to Last',
    description:
      'We are committed to preserving your heritage for generations. Our platform is designed for long-term digital preservation.',
  },
];

export function WhyChooseUsSection() {
  return (
    <Section>
      <Container className="px-4 sm:px-6 lg:px-8">
        <SectionHeader>
          <SectionTitle>Why Choose Us</SectionTitle>
          <SectionDescription>
            We are building more than software. We are creating a lasting digital home for your
            family&apos;s story.
          </SectionDescription>
        </SectionHeader>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950">
                <reason.icon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{reason.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {reason.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 rounded-2xl border border-border/60 bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center dark:from-green-950/30 dark:to-emerald-950/20 sm:p-12"
        >
          <h3 className="mb-3 text-2xl font-bold">Our Mission</h3>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Every family has a story worth preserving. We believe that understanding where we come
            from helps us know where we are going. Our mission is to provide the tools that make it
            easy for every family to capture, preserve, and share their unique heritage.
          </p>
        </motion.div>
      </Container>
    </Section>
  );
}
