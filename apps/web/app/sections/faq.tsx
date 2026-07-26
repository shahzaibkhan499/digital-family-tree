'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Container, Section, SectionHeader, SectionTitle, SectionDescription } from '@digital-family-tree/ui';
import { cn } from '@digital-family-tree/ui';

const faqs = [
  {
    question: 'What is Digital Family Tree?',
    answer:
      'Digital Family Tree is a modern platform that helps you discover, build, and preserve your family heritage. We provide intuitive tools to create interactive family trees, upload photos and documents, and connect with relatives across the world.',
  },
  {
    question: 'Is my family data secure?',
    answer:
      'Absolutely. We use bank-level encryption for all data at rest and in transit. Your family information is stored on secure, redundant servers, and you have full control over who can access each part of your family tree. We never sell or share your personal data with third parties.',
  },
  {
    question: 'Can I invite my family members to collaborate?',
    answer:
      'Yes. You can invite any family member via email to view or contribute to your family tree. They can add their own branches, upload media, and share stories. You control the permission level for each invited member.',
  },
  {
    question: 'Is there a free plan available?',
    answer:
      'Yes. We offer a generous free tier that allows you to create a family tree with up to 100 members, upload basic media, and share with up to 5 collaborators. Premium plans unlock unlimited members, advanced features, and priority support.',
  },
  {
    question: 'Can I import data from other genealogy tools?',
    answer:
      'We support importing from GEDCOM files, which is the standard format used by most genealogy software. We are also building direct integrations with popular platforms to make migration seamless.',
  },
  {
    question: 'When will the platform be available?',
    answer:
      'We are currently in early development. Our foundation and design system are built, and we are working on core features. Sign up for our newsletter to be notified when we launch our beta program.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border-b border-border/60">
      <button
        className="flex w-full items-center justify-between py-5 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-base font-medium">{question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          open ? 'pb-5' : 'h-0',
        )}
      >
        <p className="text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export function FAQSection() {
  return (
    <Section id="faq" className="bg-muted/30">
      <Container className="px-4 sm:px-6 lg:px-8">
        <SectionHeader>
          <SectionTitle>Frequently Asked Questions</SectionTitle>
          <SectionDescription>
            Find answers to common questions about Digital Family Tree.
          </SectionDescription>
        </SectionHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          {faqs.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}
