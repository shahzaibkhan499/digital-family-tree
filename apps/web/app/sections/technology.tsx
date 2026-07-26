'use client';

import { motion } from 'framer-motion';
import {
  Database,
  Server,
  Globe,
  Shield,
  Cpu,
  Layers,
} from 'lucide-react';
import { Card, Container, Section, SectionHeader, SectionTitle, SectionDescription, Badge } from '@digital-family-tree/ui';

const technologies = [
  {
    icon: Layers,
    name: 'Next.js & React',
    category: 'Frontend',
    description: 'Modern React framework with server-side rendering and static generation for optimal performance.',
  },
  {
    icon: Server,
    name: 'NestJS',
    category: 'Backend',
    description: 'Scalable Node.js framework powering our API with enterprise-grade architecture.',
  },
  {
    icon: Database,
    name: 'PostgreSQL & Neo4j',
    category: 'Database',
    description: 'Relational database for structured data combined with graph database for family connections.',
  },
  {
    icon: Shield,
    name: 'JWT Authentication',
    category: 'Security',
    description: 'Secure token-based authentication with role-based access control.',
  },
  {
    icon: Cpu,
    name: 'Redis',
    category: 'Caching',
    description: 'High-performance caching layer ensuring fast response times for all queries.',
  },
  {
    icon: Globe,
    name: 'Docker & CI/CD',
    category: 'DevOps',
    description: 'Containerized deployment with automated testing and continuous delivery pipelines.',
  },
];

export function TechnologySection() {
  return (
    <Section id="technology" className="bg-muted/30">
      <Container className="px-4 sm:px-6 lg:px-8">
        <SectionHeader>
          <SectionTitle>Technology Stack</SectionTitle>
          <SectionDescription>
            Built with modern, battle-tested technologies chosen for performance, scalability, and
            developer experience.
          </SectionDescription>
        </SectionHeader>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Card className="group h-full">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
                    <tech.icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{tech.name}</h3>
                    <Badge variant="secondary" className="mt-0.5 text-xs">
                      {tech.category}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {tech.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
