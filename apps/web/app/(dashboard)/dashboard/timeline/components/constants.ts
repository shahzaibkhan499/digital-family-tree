'use client';

export type EventType =
  | 'BIRTH' | 'DEATH' | 'MARRIAGE' | 'ENGAGEMENT' | 'DIVORCE'
  | 'GRADUATION' | 'EDUCATION' | 'JOB' | 'PROMOTION' | 'CAREER'
  | 'BUSINESS' | 'MIGRATION' | 'HOUSE_PURCHASE' | 'AWARD'
  | 'MILITARY_SERVICE' | 'MILITARY_ACHIEVEMENT' | 'RELIGIOUS_EVENT'
  | 'HAJJ' | 'UMRAH' | 'TRAVEL' | 'ACCIDENT'
  | 'MEDICAL' | 'RETIREMENT' | 'DOCUMENT_ADDED' | 'MEMORY_ADDED'
  | 'ANNIVERSARY' | 'BIRTHDAY' | 'FAMILY_REUNION'
  | 'CLAN_GATHERING' | 'COMMUNITY_EVENT'
  | 'ACHIEVEMENT' | 'CUSTOM_EVENT';

export const EVENT_TYPE_CONFIG: Record<string, { icon: string; label: string; color: string; gradient: string; category: string }> = {
  BIRTH:              { icon: 'ðŸ‘¶', label: 'Birth',              color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400',   gradient: 'from-pink-500 to-rose-600',   category: 'Life' },
  DEATH:              { icon: 'ðŸ•Šï¸', label: 'Death',              color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', gradient: 'from-slate-500 to-slate-700', category: 'Life' },
  MARRIAGE:           { icon: 'ðŸ’’', label: 'Marriage',           color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',     gradient: 'from-red-500 to-rose-500',    category: 'Life' },
  ENGAGEMENT:         { icon: 'ðŸ’', label: 'Engagement',         color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',  gradient: 'from-rose-400 to-pink-500',   category: 'Life' },
  DIVORCE:            { icon: 'ðŸ“‹', label: 'Divorce',            color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',   gradient: 'from-gray-500 to-gray-600',   category: 'Life' },
  GRADUATION:         { icon: 'ðŸŽ“', label: 'Graduation',         color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',   gradient: 'from-blue-500 to-indigo-600', category: 'Education' },
  EDUCATION:          { icon: 'ðŸ“š', label: 'Education',          color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400', gradient: 'from-indigo-500 to-blue-600', category: 'Education' },
  JOB:                { icon: 'ðŸ’¼', label: 'Job',                color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-600', category: 'Career' },
  PROMOTION:          { icon: 'ðŸš€', label: 'Promotion',          color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',  gradient: 'from-amber-500 to-orange-500', category: 'Career' },
  CAREER:             { icon: 'ðŸ“ˆ', label: 'Career',             color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',   gradient: 'from-teal-500 to-emerald-600', category: 'Career' },
  BUSINESS:           { icon: 'ðŸ¢', label: 'Business',           color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400', gradient: 'from-violet-500 to-purple-600', category: 'Career' },
  MIGRATION:          { icon: 'âœˆï¸', label: 'Migration',          color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',   gradient: 'from-cyan-500 to-blue-500',  category: 'Location' },
  HOUSE_PURCHASE:     { icon: 'ðŸ ', label: 'House Purchase',     color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400', gradient: 'from-orange-500 to-amber-500', category: 'Life' },
  AWARD:              { icon: 'ðŸ†', label: 'Award',              color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400', gradient: 'from-yellow-500 to-amber-500', category: 'Achievement' },
  MILITARY_SERVICE:   { icon: 'ðŸŽ–ï¸', label: 'Military Service',   color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',  gradient: 'from-green-600 to-emerald-600', category: 'Service' },
  RELIGIOUS_EVENT:    { icon: 'ðŸ•Œ', label: 'Religious Event',    color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400', gradient: 'from-purple-500 to-indigo-500', category: 'Cultural' },
  TRAVEL:             { icon: 'ðŸŒ', label: 'Travel',             color: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400',       gradient: 'from-sky-500 to-cyan-500',   category: 'Location' },
  ACCIDENT:           { icon: 'âš ï¸', label: 'Accident',           color: 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',       gradient: 'from-red-400 to-red-600',    category: 'Health' },
  MEDICAL:            { icon: 'ðŸ¥', label: 'Medical',            color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',   gradient: 'from-teal-400 to-cyan-500',  category: 'Health' },
  RETIREMENT:         { icon: 'ðŸ–ï¸', label: 'Retirement',         color: 'bg-lime-50 text-lime-600 dark:bg-lime-900/20 dark:text-lime-400',   gradient: 'from-lime-500 to-green-500', category: 'Career' },
  DOCUMENT_ADDED:     { icon: 'ðŸ“„', label: 'Document Added',     color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', gradient: 'from-slate-400 to-slate-600', category: 'Document' },
  MEMORY_ADDED:       { icon: 'ðŸ“¸', label: 'Memory Added',       color: 'bg-pink-50 text-pink-500 dark:bg-pink-900/20 dark:text-pink-400',   gradient: 'from-pink-400 to-rose-400',  category: 'Memory' },
  ANNIVERSARY:        { icon: 'ðŸ’', label: 'Anniversary',        color: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-900/20 dark:text-fuchsia-400', gradient: 'from-fuchsia-500 to-pink-500', category: 'Life' },
  BIRTHDAY:           { icon: 'ðŸŽ‚', label: 'Birthday',           color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',  gradient: 'from-amber-400 to-orange-400', category: 'Life' },
  FAMILY_REUNION:     { icon: 'ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦', label: 'Family Reunion',     color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', gradient: 'from-emerald-500 to-green-500', category: 'Social' },
  CLAN_GATHERING:     { icon: 'ðŸ”ï¸', label: 'Clan Gathering',     color: 'bg-stone-50 text-stone-600 dark:bg-stone-900/20 dark:text-stone-400', gradient: 'from-stone-500 to-stone-700', category: 'Cultural' },
  COMMUNITY_EVENT:    { icon: 'ðŸ˜ï¸', label: 'Community Event',    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400', gradient: 'from-indigo-500 to-indigo-700', category: 'Social' },
  ACHIEVEMENT:        { icon: 'ðŸ…', label: 'Achievement',        color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400', gradient: 'from-yellow-500 to-yellow-600', category: 'Achievement' },
  HAJJ:               { icon: 'ðŸ•‹', label: 'Hajj',               color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', gradient: 'from-emerald-600 to-teal-600', category: 'Cultural' },
  UMRAH:              { icon: 'ðŸ•Œ', label: 'Umrah',              color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400', gradient: 'from-teal-500 to-emerald-500', category: 'Cultural' },
  MILITARY_ACHIEVEMENT: { icon: 'ðŸŽ–ï¸', label: 'Military Achievement', color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400', gradient: 'from-green-500 to-green-700', category: 'Service' },
  CUSTOM_EVENT:       { icon: 'âœ¨', label: 'Custom Event',       color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', gradient: 'from-slate-400 to-slate-600', category: 'Other' },
};

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: 'Draft',     color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  PUBLISHED: { label: 'Published', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  COMPLETED: { label: 'Completed', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  CANCELLED: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  ARCHIVED:  { label: 'Archived',  color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500' },
  PINNED:    { label: 'Pinned',    color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

export const VISIBILITY_OPTIONS = [
  { value: 'ONLY_ME',   label: 'Only Me',   icon: 'ðŸ”’', description: 'Visible only to you' },
  { value: 'FAMILY',    label: 'Family',     icon: 'ðŸ‘¨â€ðŸ‘©â€ðŸ‘§', description: 'Visible to family members' },
  { value: 'SUB_CLAN',  label: 'Sub Clan',   icon: 'ðŸ˜ï¸', description: 'Visible to sub-clan members' },
  { value: 'CLAN',      label: 'Clan',       icon: 'ðŸŒ', description: 'Visible to all clan members' },
  { value: 'COMMUNITY', label: 'Community',  icon: 'ðŸŒ', description: 'Visible to community' },
  { value: 'PUBLIC',    label: 'Public',     icon: 'ðŸ“¢', description: 'Visible to everyone' },
];

export const EVENT_CATEGORIES = [
  { id: 'all', label: 'All Events' },
  { id: 'Life', label: 'Life Events' },
  { id: 'Education', label: 'Education' },
  { id: 'Career', label: 'Career' },
  { id: 'Location', label: 'Location' },
  { id: 'Health', label: 'Health' },
  { id: 'Service', label: 'Service' },
  { id: 'Achievement', label: 'Achievement' },
  { id: 'Cultural', label: 'Cultural' },
  { id: 'Document', label: 'Documents' },
  { id: 'Memory', label: 'Memories' },
  { id: 'Social', label: 'Social' },
  { id: 'Other', label: 'Other' },
];

export const BIRTH_DELIVERY_TYPES = ['Normal', 'C-Section', 'Assisted', 'Water Birth', 'Home Birth', 'Other'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function getEventConfig(type: string) {
  return EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.CUSTOM_EVENT;
}

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.PUBLISHED;
}

export function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

export function formatRelative(d: string) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

export function calcCountdown(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Today';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 1) return 'Tomorrow';
  if (days <= 30) return `${days} days`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

export function getEventStatus(dateStr: string, eventStatus: string) {
  if (eventStatus === 'CANCELLED') return 'cancelled';
  if (eventStatus === 'COMPLETED') return 'completed';
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  if (d < todayStart.getTime()) return 'past';
  if (d < todayStart.getTime() + 86400000) return 'today';
  return 'upcoming';
}
