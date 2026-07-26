'use client';

import { TreePine } from 'lucide-react';
import {
  Footer,
  FooterContent,
  FooterGrid,
  FooterSection as FooterCol,
  FooterSectionTitle,
  FooterLinkList,
  FooterLink,
  FooterBottom,
  FooterBottomContent,
  FooterCopyright,
  FooterMadeWith,
} from '@digital-family-tree/ui';
import { contactEmail } from '@digital-family-tree/config';

export function FooterSection() {
  return (
    <Footer>
      <FooterContent>
        <FooterGrid>
          <FooterCol>
            <div className="flex items-center gap-2">
              <TreePine className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Digital Family Tree</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Building the modern platform for discovering, preserving, and sharing family heritage
              across generations.
            </p>
          </FooterCol>

          <FooterCol>
            <FooterSectionTitle>Product</FooterSectionTitle>
            <FooterLinkList>
              <li><FooterLink href="#features">Features</FooterLink></li>
              <li><FooterLink href="#how-it-works">How It Works</FooterLink></li>
              <li><FooterLink href="#technology">Technology</FooterLink></li>
              <li><FooterLink href="#roadmap">Roadmap</FooterLink></li>
              <li><FooterLink href="#faq">FAQ</FooterLink></li>
            </FooterLinkList>
          </FooterCol>

          <FooterCol>
            <FooterSectionTitle>Company</FooterSectionTitle>
            <FooterLinkList>
              <li><FooterLink href="/#about">About Us</FooterLink></li>
              <li><FooterLink href="/">Blog</FooterLink></li>
              <li><FooterLink href="/">Careers</FooterLink></li>
              <li><FooterLink href="/">Press Kit</FooterLink></li>
            </FooterLinkList>
          </FooterCol>

          <FooterCol>
            <FooterSectionTitle>Support</FooterSectionTitle>
            <FooterLinkList>
              <li><FooterLink href="/login">Help Center</FooterLink></li>
              <li><FooterLink href={`mailto:${contactEmail}`}>Contact Us</FooterLink></li>
              <li><FooterLink href="/">Privacy Policy</FooterLink></li>
              <li><FooterLink href="/">Terms of Service</FooterLink></li>
              <li><FooterLink href={`mailto:${contactEmail}`}>{contactEmail}</FooterLink></li>
            </FooterLinkList>
          </FooterCol>
        </FooterGrid>
      </FooterContent>

      <FooterBottom>
        <FooterBottomContent>
          <FooterCopyright />
          <FooterMadeWith />
        </FooterBottomContent>
      </FooterBottom>
    </Footer>
  );
}
