'use client';

import { motion } from 'framer-motion';
import {
  TreePine,
  Users,
  Upload,
  Shield,
  Search,
  Share2,
} from 'lucide-react';
import { Card, Container, Section, SectionHeader, SectionTitle, SectionDescription } from '@digital-family-tree/ui';

const features = [
  {
    icon: TreePine,
    title: 'Interactive Tree Builder',
    description:
      'Create and visualize your family tree with an intuitive drag-and-drop interface. Add members, relationships, and generations effortlessly.',
  },
  {
    icon: Users,
    title: 'Collaborative Editing',
    description:
      'Invite family members to contribute to your tree. Everyone can add their own branches, stories, and memories in real time.',
  },
  {
    icon: Upload,
    title: 'Media Preservation',
    description:
      'Upload photos, documents, and recordings to preserve family artifacts. Our platform ensures they are safely stored for generations.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description:
      'Your family data is encrypted and secure. Control exactly who can see each branch of your tree with granular privacy settings.',
  },
  {
    icon: Search,
    title: 'Smart Discovery',
    description:
      'Our intelligent search helps you find connections, discover relatives, and uncover branches of your family you never knew existed.',
  },
  {
    icon: Share2,
    title: 'Easy Sharing',
    description:
      'Share your family tree with relatives through secure links. Export your tree in multiple formats for printing or archival.',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function FeaturesSection() {
  return (
    <Section id="features">
      <Container className="px-4 sm:px-6 lg:px-8">
        <SectionHeader>
          <SectionTitle>Everything You Need</SectionTitle>
          <SectionDescription>
            Powerful tools designed to help you document, explore, and share your family history with
            the people who matter most.
          </SectionDescription>
        </SectionHeader>

        <motion.div
          variants={container}
          initial="whileInView"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={item}>
              <Card className="group h-full transition-all hover:shadow-md hover:shadow-green-100 dark:hover:shadow-green-950/20">
                <div className="mb-4 inline-flex rounded-xl bg-green-50 p-3 text-green-600 transition-colors group-hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:group-hover:bg-green-900">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}
