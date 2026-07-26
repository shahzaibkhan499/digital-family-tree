'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronDown,
  ChevronRight,
  MapPin,
  Calendar,
  Heart,
  Briefcase,
  Users,
  UserPlus,
  Plus,
  Camera,
  FileText,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  ExternalLink,
  Edit3,
  Star,
  Clock,
  Baby,
  Diamond,
  BookOpen,
  Plane,
  Trophy,
  Image,
  Video,
  Mic,
  Music,
} from 'lucide-react';

function formatDate(d?: string) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return null;
  }
}

function formatYear(d?: string) {
  if (!d) return null;
  try { return new Date(d).getFullYear().toString(); } catch { return null; }
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

interface TreeDetailPanelProps {
  node: any | null;
  onClose: () => void;
  onAncestors?: (nodeId: string) => void;
  onDescendants?: (nodeId: string) => void;
  onLocate?: (node: any) => void;
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

function CollapsibleSection({ title, count, defaultOpen = true, children }: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-100 bg-white dark:border-slate-700/50 dark:bg-slate-800/30 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </motion.div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</span>
          {count !== undefined && (
            <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
              {count}
            </span>
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-700/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoGridItem({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: color ? `${color}18` : '#f1f5f9' }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{value || <span className="text-slate-300 dark:text-slate-600 italic">Not recorded</span>}</div>
      </div>
    </div>
  );
}

function EventTypeIcon({ type, size = 14 }: { type: string; size?: number }) {
  const props = { size, className: 'text-inherit' };
  switch (type) {
    case 'BIRTH': return <Baby {...props} />;
    case 'DEATH': return <X {...props} />;
    case 'MARRIAGE': return <Diamond {...props} />;
    case 'EDUCATION': return <BookOpen {...props} />;
    case 'CAREER': return <Briefcase {...props} />;
    case 'MIGRATION': return <Plane {...props} />;
    case 'AWARD': return <Trophy {...props} />;
    default: return <Star {...props} />;
  }
}

const EVENT_COLORS: Record<string, string> = {
  BIRTH: '#10b981',
  DEATH: '#64748b',
  MARRIAGE: '#ec4899',
  EDUCATION: '#3b82f6',
  CAREER: '#f59e0b',
  MIGRATION: '#06b6d4',
  AWARD: '#eab308',
  CUSTOM: '#64748b',
};

export default function TreeDetailPanel({ node, onClose, onAncestors, onDescendants, onLocate }: TreeDetailPanelProps) {
  if (!node) return null;

  const fullName = node.name || node.displayName || `${node.firstName || ''} ${node.lastName || ''}`.trim() || 'Unknown';
  const displayName = node.displayName || fullName;
  const color = genderColor(node.gender);
  const genderLabel = node.gender ? node.gender.charAt(0).toUpperCase() + node.gender.slice(1).replace(/_/g, ' ') : 'Not specified';
  const age = calcAge(node.birthDate || node.dob, node.deathDate || node.dod);
  const birthFormatted = formatDate(node.birthDate || node.dob);
  const deathFormatted = formatDate(node.deathDate || node.dod);
  const isDeceased = !!node.deathDate || !!node.dod;
  const countryFlag = getCountryFlag(node);
  const relationships = node.relationships || node.relations || [];
  const timelineEvents = node.timelineEvents || node.events || [];
  const memories = node.memories || node.media || [];

  const gradientClass = genderGradient(node.gender);

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="flex h-full flex-col bg-white dark:bg-slate-900"
    >
      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Member Details</h3>
        <div className="w-7" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Header */}
        <div className="relative px-6 pt-8 pb-6 text-center">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="relative mx-auto h-24 w-24"
          >
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradientClass} p-[3px]`}>
              <div className="h-full w-full rounded-full bg-white dark:bg-slate-900" />
            </div>
            {node.avatar || node.photo ? (
              <img
                src={node.avatar || node.photo}
                alt={fullName}
                className="absolute inset-[3px] h-[calc(100%-6px)] w-[calc(100%-6px)] rounded-full object-cover"
              />
            ) : (
              <div className="absolute inset-[3px] flex h-[calc(100%-6px)] w-[calc(100%-6px)] items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${color}88, ${color})` }}
              >
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>

          {/* Name */}
          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-xl font-bold text-slate-900 dark:text-white"
          >
            {fullName}
          </motion.h2>
          {displayName !== fullName && (
            <motion.p
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-xs text-slate-400 dark:text-slate-500"
            >
              &ldquo;{displayName}&rdquo;
            </motion.p>
          )}

          {/* Badges */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3 flex flex-wrap items-center justify-center gap-1.5"
          >
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${color}18`, color }}
            >
              <span className="text-sm">{node.gender === 'male' ? '\u2642' : node.gender === 'female' ? '\u2640' : '\u2661'}</span>
              {genderLabel}
            </motion.span>
            {isDeceased ? (
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              >
                <Clock className="h-3 w-3" />
                Deceased
              </motion.span>
            ) : (
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                <Heart className="h-3 w-3" />
                Living
              </motion.span>
            )}
            {node.isVerified && (
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Verified
              </motion.span>
            )}
            {node.linkedUserId && (
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                <ExternalLink className="h-3 w-3" />
                Profile linked
              </motion.span>
            )}
          </motion.div>
        </div>

        {/* Quick Info Grid */}
        <div className="px-4 pb-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-3 gap-2"
          >
            <InfoGridItem
              icon={<Calendar className="h-3.5 w-3.5 text-emerald-500" />}
              label="Birth"
              value={birthFormatted || node.birthPlace ? (
                <span>
                  {birthFormatted && <span>{birthFormatted}</span>}
                  {birthFormatted && node.birthPlace && <span className="block text-[11px] text-slate-400">{node.birthPlace}</span>}
                  {!birthFormatted && node.birthPlace && <span>{node.birthPlace}</span>}
                </span>
              ) : null}
            />
            <InfoGridItem
              icon={<X className="h-3.5 w-3.5 text-slate-500" />}
              label="Death"
              value={deathFormatted ? (
                <span>
                  <span>{deathFormatted}</span>
                  {node.deathCause && <span className="block text-[11px] text-slate-400">{node.deathCause}</span>}
                </span>
              ) : isDeceased ? 'Recorded' : null}
            />
            <InfoGridItem
              icon={<Clock className="h-3.5 w-3.5 text-indigo-500" />}
              label="Age"
              value={age !== null ? `${age} years${isDeceased ? '' : ''}` : null}
            />
            <InfoGridItem
              icon={<MapPin className="h-3.5 w-3.5 text-rose-500" />}
              label="Country"
              value={countryFlag ? `${countryFlag} ${node.country || node.countryCode || ''}` : node.country || node.countryCode || null}
            />
            <InfoGridItem
              icon={<Briefcase className="h-3.5 w-3.5 text-amber-500" />}
              label="Occupation"
              value={node.occupation || null}
            />
            <InfoGridItem
              icon={<Users className="h-3.5 w-3.5 text-violet-500" />}
              label="Clan / Family"
              value={
                (node.familyName || node.clanName || node.subClanName) ? (
                  <div className="flex flex-wrap gap-1">
                    {node.familyName && (
                      <span className="inline-block rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {node.familyName}
                      </span>
                    )}
                    {node.clanName && (
                      <span className="inline-block rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {node.clanName}
                      </span>
                    )}
                    {node.subClanName && (
                      <span className="inline-block rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {node.subClanName}
                      </span>
                    )}
                  </div>
                ) : null
              }
            />
          </motion.div>
        </div>

        {/* Bio */}
        {node.bio && (
          <div className="px-4 pb-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700/50 dark:bg-slate-800/30">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{node.bio}</p>
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-2 px-4 pb-4">
          {/* Relationships */}
          <CollapsibleSection title="Relationships" count={relationships.length}>
            {relationships.length > 0 ? (
              <div className="space-y-2">
                {relationships.map((rel: any, i: number) => (
                  <motion.div
                    key={rel.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300">
                      {(rel.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {rel.name || rel.displayName || 'Unknown'}
                      </p>
                      <span className="inline-block rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {rel.type || rel.relationship || 'Relative'}
                      </span>
                    </div>
                    <button className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No relationships recorded</p>
            )}
            <button className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300 transition-colors">
              <UserPlus className="h-3.5 w-3.5" />
              Add Relationship
            </button>
          </CollapsibleSection>

          {/* Timeline */}
          <CollapsibleSection title="Timeline" count={timelineEvents.length} defaultOpen={false}>
            {timelineEvents.length > 0 ? (
              <div className="space-y-2">
                {timelineEvents.map((evt: any, i: number) => {
                  const etype = (evt.type || 'CUSTOM').toUpperCase();
                  const ecolor = EVENT_COLORS[etype] || '#64748b';
                  return (
                    <motion.div
                      key={evt.id || i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 rounded-lg border border-slate-100 p-2.5 dark:border-slate-700/50"
                    >
                      <div
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${ecolor}18` }}
                      >
                        <EventTypeIcon type={etype} size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{evt.title}</p>
                        {evt.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{evt.description}</p>
                        )}
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {evt.date ? formatDate(evt.date) || evt.date : ''}
                          {evt.location ? ` \u00B7 ${evt.location}` : ''}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <Clock className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-sm text-slate-400 dark:text-slate-500 italic">No timeline events yet</p>
              </div>
            )}
            <button className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Add Event
            </button>
          </CollapsibleSection>

          {/* Memories */}
          <CollapsibleSection title="Memories" count={memories.length} defaultOpen={false}>
            {memories.length > 0 ? (
              <div>
                <div className="grid grid-cols-2 gap-2">
                  {memories.slice(0, 4).map((mem: any, i: number) => (
                    <motion.div
                      key={mem.id || i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center"
                    >
                      {mem.thumbnailUrl || mem.url ? (
                        <img src={mem.thumbnailUrl || mem.url} alt={mem.title || ''} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
                          {mem.type === 'VIDEO' ? <Video className="h-5 w-5" /> :
                           mem.type === 'DOCUMENT' ? <FileText className="h-5 w-5" /> :
                           mem.type === 'STORY' ? <MessageSquare className="h-5 w-5" /> :
                           mem.type === 'RECORDING' ? <Mic className="h-5 w-5" /> :
                           <Image className="h-5 w-5" />}
                          <span className="text-[10px] truncate max-w-[60px]">{mem.title || ''}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  {memories.filter((m: any) => m.type === 'DOCUMENT').length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <FileText className="h-3 w-3" />
                      {memories.filter((m: any) => m.type === 'DOCUMENT').length} Docs
                    </span>
                  )}
                  {memories.filter((m: any) => m.type === 'STORY').length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <MessageSquare className="h-3 w-3" />
                      {memories.filter((m: any) => m.type === 'STORY').length} Stories
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <Camera className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-sm text-slate-400 dark:text-slate-500 italic">No memories yet</p>
              </div>
            )}
            <button className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300 transition-colors">
              <Camera className="h-3.5 w-3.5" />
              Add Photos
            </button>
          </CollapsibleSection>
        </div>

        {/* Bottom spacer for actions bar */}
        <div className="h-20" />
      </div>

      {/* Actions Bar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-5 gap-1.5">
          {onAncestors && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onAncestors(node.id)}
              className="flex flex-col items-center gap-0.5 rounded-lg bg-blue-50 px-2 py-1.5 text-[10px] font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Ancestors
            </motion.button>
          )}
          {onDescendants && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onDescendants(node.id)}
              className="flex flex-col items-center gap-0.5 rounded-lg bg-teal-50 px-2 py-1.5 text-[10px] font-medium text-teal-700 hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/30 transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Descendants
            </motion.button>
          )}
          {onLocate && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onLocate(node)}
              className="flex flex-col items-center gap-0.5 rounded-lg bg-emerald-50 px-2 py-1.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors"
            >
              <Crosshair className="h-3.5 w-3.5" />
              Locate
            </motion.button>
          )}
          {node.familyId && (
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href={`/dashboard/families/${node.familyId}`}
              className="flex flex-col items-center gap-0.5 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Family
            </motion.a>
          )}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex flex-col items-center gap-0.5 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
