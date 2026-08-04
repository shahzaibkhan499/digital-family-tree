'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import {
  Container,
  Section,
  SectionHeader,
  SectionTitle,
  SectionDescription,
} from '@digital-family-tree/ui';

const testimonials = [
  {
    quote:
      'Digital Family Tree has transformed how we preserve our family history. The clan system lets us organize our extended family in ways traditional genealogy software never could.',
    author: 'Maria Gonzalez',
    role: 'Family Historian',
  },
  {
    quote:
      'The interactive timeline with 33 event types captures every important moment in our family story. From weddings to migrations, nothing gets missed.',
    author: 'James Chen',
    role: 'Genealogy Enthusiast',
  },
  {
    quote:
      'Privacy controls are exceptional. I can share our main tree with the whole family while keeping sensitive documents visible only to trusted members.',
    author: 'Sarah Mitchell',
    role: 'Family Tree Admin',
  },
];

export function RoadmapSection() {
  return (
    <Section id="testimonials" className="bg-muted/30">
      <Container className="px-4 sm:px-6 lg:px-8">
        <SectionHeader>
          <SectionTitle>Trusted by Families Worldwide</SectionTitle>
          <SectionDescription>
            Join thousands of families already preserving their heritage on our platform.
          </SectionDescription>
        </SectionHeader>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative rounded-2xl border border-border/60 bg-card/50 p-6"
            >
              <Quote className="mb-4 h-8 w-8 text-green-600/40" />
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="border-t border-border/60 pt-4">
                <p className="text-sm font-semibold">{t.author}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
