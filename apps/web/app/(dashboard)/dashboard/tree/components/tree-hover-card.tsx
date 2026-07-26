'use client';

import React from 'react';
import { motion } from 'framer-motion';

function genderColor(g?: string) {
  const v = (g || '').toLowerCase();
  if (v === 'male') return '#3b82f6';
  if (v === 'female') return '#ec4899';
  if (v === 'other') return '#8b5cf6';
  return '#94a3b8';
}

function genderGradient(g?: string) {
  const v = (g || '').toLowerCase();
  if (v === 'male') return 'from-blue-400 to-blue-600';
  if (v === 'female') return 'from-pink-400 to-pink-600';
  if (v === 'other') return 'from-purple-400 to-purple-600';
  return 'from-slate-400 to-slate-600';
}

function formatDateShort(d?: string) {
  if (!d) return '';
  try { return new Date(d).getFullYear().toString(); } catch { return ''; }
}

function calcAge(dob?: string, dod?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const end = dod ? new Date(dod) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
  return age;
}

const FLAG_EMOJI: Record<string, string> = {
  us: '\uD83C\uDDFA\uD83C\uDDF8',
  uk: '\uD83C\uDDEC\uD83C\uDDE7',
  ca: '\uD83C\uDDE8\uD83C\uDDE6',
  au: '\uD83C\uDDE6\uD83C\uDDFA',
  de: '\uD83C\uDDE9\uD83C\uDDEA',
  fr: '\uD83C\uDDEB\uD83C\uDDF7',
  it: '\uD83C\uDDEE\uD83C\uDDF9',
  es: '\uD83C\uDDEA\uD83C\uDDF8',
  ie: '\uD83C\uDDEE\uD83C\uDDEA',
  in: '\uD83C\uDDEE\uD83C\uDDF3',
  pk: '\uD83C\uDDF5\uD83C\uDDF0',
};

function getCountryFlag(node: any): string | null {
  const code = (node.countryCode || node.country || '').toLowerCase().slice(0, 2);
  return FLAG_EMOJI[code] || null;
}

interface TreeHoverCardProps {
  node: any;
  x: number;
  y: number;
  containerWidth?: number;
}

export default function TreeHoverCard({ node, x, y, containerWidth = 1200 }: TreeHoverCardProps) {
  if (!node) return null;

  const fullName = node.name || node.displayName || `${node.firstName || ''} ${node.lastName || ''}`.trim() || 'Unknown';
  const displayName = node.displayName || fullName;
  const color = genderColor(node.gender);
  const gradient = genderGradient(node.gender);
  const age = calcAge(node.birthDate || node.dob, node.deathDate || node.dod);
  const birthYear = formatDateShort(node.birthDate || node.dob);
  const deathYear = formatDateShort(node.deathDate || node.dod);
  const isDeceased = !!node.deathDate || !!node.dod;
  const countryFlag = getCountryFlag(node);
  const clanLabel = node.familyName || node.clanName || node.clan?.name || null;

  const cardW = 320;
  const left = x + cardW > containerWidth ? x - cardW - 10 : x + 10;

  // Build relationship summary
  const relationshipParts: string[] = [];
  if (node.spouseName || node.spouse) {
    relationshipParts.push(`Spouse of ${node.spouseName || node.spouse}`);
  }
  if (node.parentNames && node.parentNames.length > 0) {
    relationshipParts.push(`Child of ${node.parentNames[0]}${node.parentNames.length > 1 ? ` +${node.parentNames.length - 1}` : ''}`);
  }
  if (node.childNames && node.childNames.length > 0) {
    relationshipParts.push(`Mother/Father of ${node.childNames[0]}${node.childNames.length > 1 ? ` +${node.childNames.length - 1}` : ''}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="pointer-events-none absolute z-50"
      style={{ left: Math.max(0, left), top: Math.max(0, y - 10) }}
    >
      <div className="relative w-[320px] rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        {/* Arrow pointer */}
        <div
          className="absolute -left-1.5 top-6 h-3 w-3 rotate-45 border-l border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
          style={{ left: x <= left ? 'auto' : -6, right: x <= left ? -6 : 'auto' }}
        />

        <div className="p-4">
          {/* Avatar + Name row */}
          <div className="flex items-start gap-3">
            {/* Avatar with gradient ring */}
            <div className={`relative h-12 w-12 shrink-0 rounded-full bg-gradient-to-br ${gradient} p-[2px]`}>
              <div className="h-full w-full rounded-full bg-white dark:bg-slate-900" />
              {node.avatar || node.profilePhoto ? (
                <img
                  src={node.avatar || node.profilePhoto}
                  alt={fullName}
                  className="absolute inset-[2px] h-[calc(100%-4px)] w-[calc(100%-4px)] rounded-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-[2px] flex h-[calc(100%-4px)] w-[calc(100%-4px)] items-center justify-center rounded-full text-base font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${color}88, ${color})` }}
                >
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{fullName}</p>
              {displayName !== fullName && (
                <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">&ldquo;{displayName}&rdquo;</p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {/* Living/Deceased badge */}
                {isDeceased ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Deceased
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Living
                  </span>
                )}
                {node.isVerified && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Date info */}
          <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {(birthYear || deathYear) && (
              <span>
                {birthYear || '?'} {'\u2013'} {deathYear || (isDeceased ? '?' : 'Present')}
              </span>
            )}
            {age !== null && (
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {isDeceased ? `Died at ${age}` : `Age ${age}`}
              </span>
            )}
          </div>

          {/* Quick relationship summary */}
          {relationshipParts.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {relationshipParts.map((part, i) => (
                <p key={i} className="text-[11px] text-slate-500 dark:text-slate-400">
                  {part}
                </p>
              ))}
            </div>
          )}

          {/* Bottom row: badges */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {/* Clan/Family badge */}
            {clanLabel && (
              <span className="inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                {clanLabel.length > 12 ? clanLabel.slice(0, 11) + '\u2026' : clanLabel}
              </span>
            )}
            {/* Country flag */}
            {countryFlag && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {countryFlag} {node.country || node.countryCode || ''}
              </span>
            )}
            {/* Occupation */}
            {node.occupation && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {node.occupation.length > 14 ? node.occupation.slice(0, 13) + '\u2026' : node.occupation}
              </span>
            )}
          </div>

          {/* Relationship label */}
          {node.relationship && (
            <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {node.relationship}
              </span>
            </div>
          )}
        </div>

        {/* "Click for details" hint */}
        <div className="border-t border-slate-100 px-4 py-2 text-center dark:border-slate-800">
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            Click for details {'\u2192'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
