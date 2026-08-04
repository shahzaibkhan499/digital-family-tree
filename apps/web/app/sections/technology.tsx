'use client';

import { motion } from 'framer-motion';
import { Zap, Lock, Globe, Clock, Heart, Image } from 'lucide-react';
import {
  Container,
  Section,
  SectionHeader,
  SectionTitle,
  SectionDescription,
} from '@digital-family-tree/ui';

const benefits = [
  {
    icon: Zap,
    title: 'Blazing Fast Performance',
    description:
      'Built on Next.js and NestJS, your family tree loads instantly even with thousands of members and media files. Every interaction feels immediate.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Lock,
    title: 'Bank-Grade Security',
    description:
      'End-to-end encryption protects every photo, document, and personal detail. Your family history is yours alone — we never share or sell your data.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Globe,
    title: 'Built for Generations',
    description:
      'Your data is stored on redundant infrastructure with automated backups. Designed for long-term digital preservation so your heritage outlives us all.',
    gradient: 'from-teal-500 to-cyan-500',
  },
  {
    icon: Heart,
    title: 'Family-Centric Design',
    description:
      'Every feature is built around real family workflows — collaborative editing, granular permissions, and intuitive interfaces that anyone can use.',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: Image,
    title: 'Rich Media Preservation',
    description:
      'Upload photos, scanned documents, audio recordings, and video messages. Our media vault keeps everything organized, searchable, and safely stored.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Clock,
    title: 'Timeline & Anniversary Reminders',
    description:
      'Never miss a milestone. Automatic birthday and anniversary reminders, event calendars, and timeline views keep your family connected across time zones.',
    gradient: 'from-violet-500 to-purple-500',
  },
];

export function TechnologySection() {
  return (
    <Section id="benefits">
      <Container className="px-4 sm:px-6 lg:px-8">
        <SectionHeader>
          <SectionTitle>Built for the Future of Heritage</SectionTitle>
          <SectionDescription>
            Every aspect of the platform is designed with one mission: preserving your family story
            securely across generations.
          </SectionDescription>
        </SectionHeader>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 transition-all hover:shadow-md"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 transition-opacity group-hover:opacity-5 dark:group-hover:opacity-10`}
                />
                <div
                  className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${benefit.gradient} p-3 text-white shadow-sm`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
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
