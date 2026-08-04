'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, TreePine, Shield, Users } from 'lucide-react';
import { Button, Container } from '@digital-family-tree/ui';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 via-background to-emerald-50/40 dark:from-green-950/30 dark:via-background dark:to-emerald-950/20" />
      <div className="absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-green-200/20 blur-3xl dark:bg-green-900/10" />
        <div className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-emerald-200/20 blur-3xl dark:bg-emerald-900/10" />
      </div>

      <Container className="relative px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-44">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-7xl"
          >
            Discover Your Family{' '}
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Heritage
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl"
          >
            Build, preserve, and explore your family history with a modern digital platform. Connect
            generations through stories, photographs, and shared memories.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Link href="/register">
              <Button size="lg" className="bg-emerald-600 px-8 text-white hover:bg-emerald-700">
                Start Your Tree
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                variant="outline"
                size="lg"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Explore Features
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-16 grid grid-cols-3 gap-8 border-t border-border/60 pt-10"
          >
            {[
              { icon: TreePine, value: '10K+', label: 'Family Trees Created' },
              { icon: Users, value: '500K+', label: 'Family Members' },
              { icon: Shield, value: '99.9%', label: 'Data Protection' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto h-5 w-5 text-green-600" />
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
