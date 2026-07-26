'use client';

import { motion } from 'framer-motion';
import { UserPlus, GitBranch, Camera, Sparkles } from 'lucide-react';
import { Container, Section, SectionHeader, SectionTitle, SectionDescription } from '@digital-family-tree/ui';

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create Your Account',
    description:
      'Sign up in seconds with your email or social account. Your family journey begins with a single step.',
  },
  {
    icon: GitBranch,
    step: '02',
    title: 'Build Your Tree',
    description:
      'Start with yourself and expand outward. Add parents, grandparents, and trace your roots across generations.',
  },
  {
    icon: Camera,
    step: '03',
    title: 'Add Memories',
    description:
      'Upload photographs, record stories, and attach documents to bring your family history to life.',
  },
  {
    icon: Sparkles,
    step: '04',
    title: 'Discover Connections',
    description:
      'Let our platform find hidden links and help you connect with relatives you never knew about.',
  },
];

export function HowItWorksSection() {
  return (
    <Section id="how-it-works" className="bg-muted/30">
      <Container className="px-4 sm:px-6 lg:px-8">
        <SectionHeader>
          <SectionTitle>How It Works</SectionTitle>
          <SectionDescription>
            Four simple steps to preserving your family heritage for future generations.
          </SectionDescription>
        </SectionHeader>

        <div className="relative">
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-border lg:block" />

          <div className="grid gap-12 lg:gap-0">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`relative grid items-center gap-8 lg:grid-cols-2 ${
                  index % 2 === 1 ? 'lg:text-right' : ''
                }`}
              >
                <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                    Step {step.step}
                  </span>
                  <h3 className="mb-3 text-2xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                <div
                  className={`flex justify-center ${
                    index % 2 === 1 ? 'lg:order-1' : ''
                  }`}
                >
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-border/60 bg-background shadow-sm">
                    <step.icon className="h-10 w-10 text-green-600" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
