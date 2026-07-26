'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Link2, Globe, Languages, FileText,
  Image as ImageIcon, Film, Music, Plus, X, GripVertical,
  Check, ChevronDown, Upload, Shield, Lock, Users, Building2,
  Globe2, Megaphone, Eye, EyeOff, Trash2, BadgeCheck, Star,
  Pin, Tag, Search, Send, ArrowRight, AlertCircle, File,
  ClipboardList, Bell, Mail, Smartphone, CalendarClock,
  ChevronRight, ExternalLink, FolderOpen, PenLine,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import {
  getEventConfig, EVENT_CATEGORIES, VISIBILITY_OPTIONS,
  STATUS_CONFIG, formatDate, formatTime,
} from './constants';

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500';

const selectCls =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white appearance-none';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  span?: number;
}

function FormField({ label, required, error, description, children, className = '', span }: FormFieldProps) {
  const spanClass = span === 2 ? 'sm:col-span-2' : span === 3 ? 'sm:col-span-3' : '';
  return (
    <div className={`${spanClass} ${className}`}>
      <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {description && (
        <p className="mb-1.5 text-[11px] text-slate-400 dark:text-slate-500">{description}</p>
      )}
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-[11px] text-rose-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      {children}
    </div>
  );
}

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Karachi',
  'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
];

const LANGUAGES = [
  { code: 'en', label: 'English' }, { code: 'ar', label: 'Arabic' },
  { code: 'ur', label: 'Urdu' }, { code: 'hi', label: 'Hindi' },
  { code: 'fr', label: 'French' }, { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' }, { code: 'tr', label: 'Turkish' },
  { code: 'fa', label: 'Persian' }, { code: 'ps', label: 'Pashto' },
];

const DOC_TYPES = [
  'Birth Certificate', 'Death Certificate', 'Marriage Certificate',
  'National ID', 'Passport', 'Property Deed', 'Academic Diploma',
  'Military Record', 'Court Document', 'Other',
];

const MEDIA_TYPES = [
  { value: 'IMAGE', label: 'Image', icon: ImageIcon },
  { value: 'VIDEO', label: 'Video', icon: Film },
  { value: 'AUDIO', label: 'Audio', icon: Music },
];

// â”€â”€â”€ GENERAL SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface GeneralSectionProps {
  data: Record<string, any>;
  onUpdate: (patch: Record<string, any>) => void;
  errors: Record<string, string>;
}

export function GeneralSection({ data, onUpdate, errors }: GeneralSectionProps) {
  const config = getEventConfig(data.eventType);

  return (
    <SectionCard
      title="General Information"
      subtitle={`Basic details for this ${config.label.toLowerCase()} event`}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField span={2} label="Event Type" description="Event type is set when you select it">
          <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${config.color}`}>
            <span className="text-base">{config.icon}</span>
            {config.label}
          </div>
        </FormField>

        <FormField span={2} label="Title" required error={errors.title}>
          <input
            value={data.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={`e.g., ${config.label} of [Name]`}
            className={inputCls}
          />
        </FormField>

        <FormField span={2} label="Subtitle" description="Optional subtitle shown below the title">
          <input
            value={data.subtitle || ''}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
            placeholder="A short subtitle..."
            className={inputCls}
          />
        </FormField>

        <FormField span={2} label="Description">
          <textarea
            value={data.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={4}
            placeholder="Describe this event in detail..."
            className={`${inputCls} resize-none`}
          />
        </FormField>

        <FormField label="Category" required error={errors.category}>
          <select
            value={data.category || ''}
            onChange={(e) => onUpdate({ category: e.target.value })}
            className={selectCls}
          >
            <option value="">Select category</option>
            {EVENT_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </FormField>

        <div />

        <FormField label="Date" required error={errors.date}>
          <input
            type="date"
            value={data.date || ''}
            onChange={(e) => onUpdate({ date: e.target.value })}
            className={inputCls}
          />
        </FormField>

        <FormField label="End Date" description="For multi-day events">
          <input
            type="date"
            value={data.endDate || ''}
            onChange={(e) => onUpdate({ endDate: e.target.value })}
            className={inputCls}
          />
        </FormField>

        <FormField label="Time">
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={data.time || ''}
              onChange={(e) => onUpdate({ time: e.target.value })}
              disabled={data.isAllDay}
              className={`${inputCls} ${data.isAllDay ? 'opacity-50' : ''}`}
            />
          </div>
        </FormField>

        <FormField label="All Day Event">
          <button
            type="button"
            onClick={() => onUpdate({ isAllDay: !data.isAllDay })}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              data.isAllDay
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <div className={`h-4 w-7 rounded-full p-0.5 transition-colors ${data.isAllDay ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`h-3 w-3 rounded-full bg-white transition-transform ${data.isAllDay ? 'translate-x-3' : ''}`} />
            </div>
            All Day
          </button>
        </FormField>

        <FormField label="Timezone">
          <select
            value={data.timezone || 'UTC'}
            onChange={(e) => onUpdate({ timezone: e.target.value })}
            className={selectCls}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Language">
          <select
            value={data.language || 'en'}
            onChange={(e) => onUpdate({ language: e.target.value })}
            className={selectCls}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Country">
          <input
            value={data.country || ''}
            onChange={(e) => onUpdate({ country: e.target.value })}
            placeholder="e.g., Pakistan"
            className={inputCls}
          />
        </FormField>

        <FormField label="Location">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={data.location || ''}
              onChange={(e) => onUpdate({ location: e.target.value })}
              placeholder="City, Country"
              className={`${inputCls} pl-9`}
            />
          </div>
        </FormField>

        <FormField label="Venue">
          <input
            value={data.venue || ''}
            onChange={(e) => onUpdate({ venue: e.target.value })}
            placeholder="Venue name"
            className={inputCls}
          />
        </FormField>

        <FormField label="Map Link">
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={data.mapLink || ''}
              onChange={(e) => onUpdate({ mapLink: e.target.value })}
              placeholder="https://maps.google.com/..."
              className={`${inputCls} pl-9`}
            />
          </div>
        </FormField>

        <FormField label="Coordinates" description="lat,lng">
          <input
            value={data.coordinates || ''}
            onChange={(e) => onUpdate({ coordinates: e.target.value })}
            placeholder="40.7128, -74.0060"
            className={inputCls}
          />
        </FormField>
      </div>
    </SectionCard>
  );
}

// â”€â”€â”€ PEOPLE SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface PeopleSectionProps {
  data: Record<string, any>;
  onUpdate: (patch: Record<string, any>) => void;
  errors: Record<string, string>;
}

export function PeopleSection({ data, onUpdate, errors }: PeopleSectionProps) {
  const [families, setFamilies] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    setLoadingFamilies(true);
    api.families.list()
      .then((res: any) => setFamilies(Array.isArray(res) ? res : []))
      .catch(() => {})
      .finally(() => setLoadingFamilies(false));
  }, []);

  useEffect(() => {
    if (data.familyId) {
      setLoadingMembers(true);
      api.members.list(data.familyId)
        .then((res: any) => setMembers(Array.isArray(res) ? res : res?.members || []))
        .catch(() => {})
        .finally(() => setLoadingMembers(false));
    } else {
      setMembers([]);
    }
  }, [data.familyId]);

  const toggleParticipant = (memberId: string) => {
    const current = data.participantIds || [];
    if (current.includes(memberId)) {
      onUpdate({ participantIds: current.filter((id: string) => id !== memberId) });
    } else {
      onUpdate({ participantIds: [...current, memberId] });
    }
  };

  return (
    <SectionCard title="People & Participants" subtitle="Link families, members, and participants to this event">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Family" error={errors.familyId}>
          <div className="relative">
            {loadingFamilies && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            )}
            <select
              value={data.familyId || ''}
              onChange={(e) => onUpdate({ familyId: e.target.value, participantIds: [] })}
              className={selectCls}
            >
              <option value="">Select family</option>
              {families.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </FormField>

        <FormField label="Primary Member">
          <select
            value={data.memberId || ''}
            onChange={(e) => onUpdate({ memberId: e.target.value })}
            disabled={!data.familyId || loadingMembers}
            className={`${selectCls} ${!data.familyId ? 'opacity-50' : ''}`}
          >
            <option value="">Select primary member</option>
            {members.map((m: any) => (
              <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
            ))}
          </select>
        </FormField>

        <FormField span={2} label="Participants" description="Select family members involved in this event">
          {!data.familyId ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800">
              <Users className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a family first to see members</p>
            </div>
          ) : loadingMembers ? (
            <div className="flex items-center justify-center p-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">No members found in this family</p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              <div className="space-y-1">
                {members.map((m: any) => {
                  const isSelected = (data.participantIds || []).includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-900/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleParticipant(m.id)}
                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {(m.firstName || '?')[0]}{(m.lastName || '')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                          {m.firstName} {m.lastName}
                        </span>
                        {m.birthDate && (
                          <span className="block text-[11px] text-slate-400">
                            Born: {formatDate(m.birthDate)}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-emerald-500" />}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          {(data.participantIds || []).length > 0 && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {data.participantIds.length} participant{data.participantIds.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </FormField>
      </div>
    </SectionCard>
  );
}

// â”€â”€â”€ MEDIA SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface MediaSectionProps {
  data: Record<string, any>;
  onUpdate: (patch: Record<string, any>) => void;
  errors: Record<string, string>;
}

export function MediaSection({ data, onUpdate, errors }: MediaSectionProps) {
  const media: Array<{ url: string; type: string; caption: string; fileName?: string; fileSize?: number; mimeType?: string; thumbnailUrl?: string }> = data.media || [];

  const addMedia = () => {
    onUpdate({ media: [...media, { url: '', type: 'IMAGE', caption: '' }] });
  };

  const updateMedia = (index: number, patch: Partial<typeof media[0]>) => {
    const updated = media.map((m, i) => (i === index ? { ...m, ...patch } : m));
    onUpdate({ media: updated });
  };

  const removeMedia = (index: number) => {
    onUpdate({ media: media.filter((_, i) => i !== index) });
  };

  const moveMedia = (from: number, to: number) => {
    const updated = [...media];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    onUpdate({ media: updated });
  };

  return (
    <SectionCard title="Media & Cover Image" subtitle="Add photos, videos, and audio to bring the event to life">
      <div className="space-y-6">
        <FormField label="Cover Image URL" error={errors.coverImage} description="Main image displayed on the event card">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={data.coverImage || ''}
                onChange={(e) => onUpdate({ coverImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className={`${inputCls} pl-9`}
              />
            </div>
            {data.coverImage && (
              <button
                onClick={() => onUpdate({ coverImage: '' })}
                className="rounded-lg border border-slate-200 px-3 text-slate-400 hover:text-rose-500 dark:border-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {data.coverImage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 overflow-hidden rounded-xl"
            >
              <img
                src={data.coverImage}
                alt="Cover preview"
                className="h-40 w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </motion.div>
          )}
        </FormField>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Media Gallery
            </label>
            <span className="text-xs text-slate-400">{media.length} item{media.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {media.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-2">
                      <button className="cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        item.type === 'VIDEO' ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/20' :
                        item.type === 'AUDIO' ? 'bg-purple-50 text-purple-500 dark:bg-purple-900/20' :
                        'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20'
                      }`}>
                        {item.type === 'VIDEO' ? <Film className="h-4 w-4" /> :
                         item.type === 'AUDIO' ? <Music className="h-4 w-4" /> :
                         <ImageIcon className="h-4 w-4" />}
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={item.type}
                          onChange={(e) => updateMedia(index, { type: e.target.value })}
                          className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        >
                          {MEDIA_TYPES.map((mt) => (
                            <option key={mt.value} value={mt.value}>{mt.label}</option>
                          ))}
                        </select>
                        <input
                          value={item.url}
                          onChange={(e) => updateMedia(index, { url: e.target.value })}
                          placeholder="Media URL"
                          className={`${inputCls} flex-1 text-xs`}
                        />
                      </div>
                      <input
                        value={item.caption}
                        onChange={(e) => updateMedia(index, { caption: e.target.value })}
                        placeholder="Caption (optional)"
                        className={`${inputCls} text-xs`}
                      />
                    </div>

                    <button
                      onClick={() => removeMedia(index)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            onClick={addMedia}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Media
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

// â”€â”€â”€ DOCUMENTS SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface DocumentsSectionProps {
  data: Record<string, any>;
  onUpdate: (patch: Record<string, any>) => void;
  errors: Record<string, string>;
}

interface DocumentItem {
  fileName: string;
  fileType: string;
  fileUrl: string;
  title: string;
  description: string;
  issueDate: string;
  expiryDate: string;
  privacy: string;
}

export function DocumentsSection({ data, onUpdate, errors }: DocumentsSectionProps) {
  const documents: DocumentItem[] = data.documents || [];

  const addDocument = () => {
    onUpdate({
      documents: [...documents, {
        fileName: '', fileType: 'Other', fileUrl: '', title: '',
        description: '', issueDate: '', expiryDate: '', privacy: 'FAMILY',
      }],
    });
  };

  const updateDocument = (index: number, patch: Partial<DocumentItem>) => {
    const updated = documents.map((d, i) => (i === index ? { ...d, ...patch } : d));
    onUpdate({ documents: updated });
  };

  const removeDocument = (index: number) => {
    onUpdate({ documents: documents.filter((_, i) => i !== index) });
  };

  const getDocIcon = (type: string) => {
    if (type.includes('Birth')) return 'ðŸ‘¶';
    if (type.includes('Death')) return 'ðŸ•Šï¸';
    if (type.includes('Marriage')) return 'ðŸ’’';
    if (type.includes('ID') || type.includes('Passport')) return 'ðŸªª';
    if (type.includes('Property') || type.includes('Deed')) return 'ðŸ ';
    if (type.includes('Academic') || type.includes('Diploma')) return 'ðŸŽ“';
    if (type.includes('Military')) return 'ðŸŽ–ï¸';
    if (type.includes('Court')) return 'âš–ï¸';
    return 'ðŸ“„';
  };

  return (
    <SectionCard title="Documents & Records" subtitle="Attach official documents and legal records">
      <div className="space-y-4">
        <AnimatePresence>
          {documents.map((doc, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getDocIcon(doc.fileType)}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {doc.title || `Document ${index + 1}`}
                  </span>
                </div>
                <button
                  onClick={() => removeDocument(index)}
                  className="rounded p-1 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Document Title">
                  <input
                    value={doc.title}
                    onChange={(e) => updateDocument(index, { title: e.target.value })}
                    placeholder="e.g., Birth Certificate"
                    className={inputCls}
                  />
                </FormField>

                <FormField label="Document Type">
                  <select
                    value={doc.fileType}
                    onChange={(e) => updateDocument(index, { fileType: e.target.value })}
                    className={selectCls}
                  >
                    {DOC_TYPES.map((dt) => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="File Name">
                  <input
                    value={doc.fileName}
                    onChange={(e) => updateDocument(index, { fileName: e.target.value })}
                    placeholder="certificate.pdf"
                    className={inputCls}
                  />
                </FormField>

                <FormField label="File URL">
                  <input
                    value={doc.fileUrl}
                    onChange={(e) => updateDocument(index, { fileUrl: e.target.value })}
                    placeholder="https://..."
                    className={inputCls}
                  />
                </FormField>

                <FormField label="Issue Date">
                  <input
                    type="date"
                    value={doc.issueDate}
                    onChange={(e) => updateDocument(index, { issueDate: e.target.value })}
                    className={inputCls}
                  />
                </FormField>

                <FormField label="Expiry Date">
                  <input
                    type="date"
                    value={doc.expiryDate}
                    onChange={(e) => updateDocument(index, { expiryDate: e.target.value })}
                    className={inputCls}
                  />
                </FormField>

                <FormField label="Privacy">
                  <select
                    value={doc.privacy}
                    onChange={(e) => updateDocument(index, { privacy: e.target.value })}
                    className={selectCls}
                  >
                    {VISIBILITY_OPTIONS.map((v) => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </FormField>

                <FormField span={2} label="Description">
                  <input
                    value={doc.description}
                    onChange={(e) => updateDocument(index, { description: e.target.value })}
                    placeholder="Additional notes about this document..."
                    className={inputCls}
                  />
                </FormField>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={addDocument}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Document
        </button>

        {documents.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {documents.map((doc, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="text-sm">{getDocIcon(doc.fileType)}</span>
                <span className="flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                  {doc.title || doc.fileName || `Doc ${i + 1}`}
                </span>
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// â”€â”€â”€ PRIVACY SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface PrivacySectionProps {
  data: Record<string, any>;
  onUpdate: (patch: Record<string, any>) => void;
  errors: Record<string, string>;
}

const VISIBILITY_ICONS: Record<string, React.ComponentType<any>> = {
  ONLY_ME: Lock,
  FAMILY: Users,
  SUB_CLAN: Building2,
  CLAN: Globe,
  COMMUNITY: Globe2,
  PUBLIC: Megaphone,
};

export function PrivacySection({ data, onUpdate, errors }: PrivacySectionProps) {
  return (
    <SectionCard title="Privacy & Visibility" subtitle="Control who can see this event and its details">
      <div className="space-y-6">
        <FormField label="Event Visibility" required error={errors.visibility} description="Choose who can view this event">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {VISIBILITY_OPTIONS.map((option) => {
              const Icon = VISIBILITY_ICONS[option.value] || Eye;
              const isSelected = data.visibility === option.value;
              return (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => onUpdate({ visibility: option.value })}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-100 dark:border-emerald-600 dark:bg-emerald-900/20 dark:shadow-emerald-900/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800/40 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-sm font-medium ${
                    isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {option.label}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                    {option.description}
                  </span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white"
                    >
                      <Check className="h-3 w-3" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </FormField>

        <FormField label="Additional Privacy Settings" description="Fine-tune privacy controls">
          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <EyeOff className="h-4 w-4 text-slate-500" />
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Hide from public timeline</span>
                  <p className="text-[11px] text-slate-400">Event won't appear in public feeds</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdate({ hideFromPublic: !data.hideFromPublic })}
                className={`h-6 w-11 rounded-full p-0.5 transition-colors ${data.hideFromPublic ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${data.hideFromPublic ? 'translate-x-5' : ''}`} />
              </button>
            </label>

            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-slate-500" />
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Restrict screenshot capture</span>
                  <p className="text-[11px] text-slate-400">Attempt to prevent screenshots (advisory only)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdate({ restrictScreenshots: !data.restrictScreenshots })}
                className={`h-6 w-11 rounded-full p-0.5 transition-colors ${data.restrictScreenshots ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${data.restrictScreenshots ? 'translate-x-5' : ''}`} />
              </button>
            </label>
          </div>
        </FormField>
      </div>
    </SectionCard>
  );
}

// â”€â”€â”€ NOTIFICATIONS SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface NotificationsSectionProps {
  data: Record<string, any>;
  onUpdate: (patch: Record<string, any>) => void;
  errors: Record<string, string>;
}

export function NotificationsSection({ data, onUpdate, errors }: NotificationsSectionProps) {
  const channels: string[] = data.notificationChannels || ['IN_APP'];
  const scheduleLater = data.scheduleNotification || false;

  const toggleChannel = (channel: string) => {
    if (channels.includes(channel)) {
      onUpdate({ notificationChannels: channels.filter((c) => c !== channel) });
    } else {
      onUpdate({ notificationChannels: [...channels, channel] });
    }
  };

  const CHANNEL_OPTIONS = [
    { id: 'IN_APP', label: 'In-App', icon: Bell, description: 'Show in notification center' },
    { id: 'EMAIL', label: 'Email', icon: Mail, description: 'Send email notification' },
    { id: 'PUSH', label: 'Push', icon: Smartphone, description: 'Mobile push notification' },
  ];

  return (
    <SectionCard title="Notifications" subtitle="Configure who gets notified and how">
      <div className="space-y-6">
        <FormField label="Notification Audience" description="Who should receive notifications about this event">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {VISIBILITY_OPTIONS.map((option) => {
              const isSelected = (data.notificationAudience || 'FAMILY') === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onUpdate({ notificationAudience: option.value })}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  <span className="text-sm">{option.icon}</span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label="Delivery Channels" description="Select how notifications should be delivered">
          <div className="space-y-2">
            {CHANNEL_OPTIONS.map((ch) => {
              const Icon = ch.icon;
              const isActive = channels.includes(ch.id);
              return (
                <label
                  key={ch.id}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleChannel(ch.id)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{ch.label}</span>
                    <p className="text-[11px] text-slate-400">{ch.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </FormField>

        <FormField label="Notification Message" description="Customize the notification message">
          <textarea
            value={data.notificationMessage || ''}
            onChange={(e) => onUpdate({ notificationMessage: e.target.value })}
            rows={3}
            placeholder={`You're invited to: ${data.title || '[Event Title]'}`}
            className={`${inputCls} resize-none`}
          />
          <div className="mt-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="mb-1 text-[10px] font-medium uppercase text-slate-400 dark:text-slate-500">Preview</p>
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm dark:bg-emerald-900/30">
                {getEventConfig(data.eventType || 'CUSTOM_EVENT').icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {data.title || 'Event Title'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {data.notificationMessage || 'You have a new event notification'}
                </p>
              </div>
            </div>
          </div>
        </FormField>

        <FormField label="Schedule Notification">
          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-4 w-4 text-slate-500" />
              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Schedule for later</span>
                <p className="text-[11px] text-slate-400">Send notification at a specific time</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdate({ scheduleNotification: !scheduleLater })}
              className={`h-6 w-11 rounded-full p-0.5 transition-colors ${scheduleLater ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <div className={`h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${scheduleLater ? 'translate-x-5' : ''}`} />
            </button>
          </label>
          {scheduleLater && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 grid grid-cols-2 gap-3"
            >
              <FormField label="Date">
                <input
                  type="date"
                  value={data.notificationScheduleDate || ''}
                  onChange={(e) => onUpdate({ notificationScheduleDate: e.target.value })}
                  className={inputCls}
                />
              </FormField>
              <FormField label="Time">
                <input
                  type="time"
                  value={data.notificationScheduleTime || ''}
                  onChange={(e) => onUpdate({ notificationScheduleTime: e.target.value })}
                  className={inputCls}
                />
              </FormField>
            </motion.div>
          )}
        </FormField>
      </div>
    </SectionCard>
  );
}

// â”€â”€â”€ REVIEW SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ReviewSectionProps {
  data: Record<string, any>;
  errors: Record<string, string>;
  onNavigateToSection?: (section: string) => void;
}

export function ReviewSection({ data, errors, onNavigateToSection }: ReviewSectionProps) {
  const config = getEventConfig(data.eventType || 'CUSTOM_EVENT');

  const sections = [
    {
      id: 'general', label: 'General', icon: FileText,
      fields: [
        { label: 'Title', value: data.title, required: true },
        { label: 'Subtitle', value: data.subtitle },
        { label: 'Category', value: data.category },
        { label: 'Date', value: data.date, required: true },
        { label: 'Time', value: data.time },
        { label: 'Location', value: data.location },
        { label: 'Venue', value: data.venue },
      ],
    },
    {
      id: 'people', label: 'People', icon: Users,
      fields: [
        { label: 'Family', value: data.familyId },
        { label: 'Primary Member', value: data.memberId },
        { label: 'Participants', value: `${(data.participantIds || []).length} selected` },
      ],
    },
    {
      id: 'media', label: 'Media', icon: ImageIcon,
      fields: [
        { label: 'Cover Image', value: data.coverImage ? 'Set' : '' },
        { label: 'Media Items', value: `${(data.media || []).length} items` },
      ],
    },
    {
      id: 'documents', label: 'Documents', icon: FolderOpen,
      fields: [
        { label: 'Documents', value: `${(data.documents || []).length} attached` },
      ],
    },
    {
      id: 'privacy', label: 'Privacy', icon: Shield,
      fields: [
        { label: 'Visibility', value: VISIBILITY_OPTIONS.find((v) => v.value === data.visibility)?.label || data.visibility },
      ],
    },
  ];

  return (
    <SectionCard title="Review & Confirm" subtitle="Review all details before publishing">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${config.color}`}>
            {config.icon}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {data.title || 'Untitled Event'}
            </h3>
            {data.subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{data.subtitle}</p>
            )}
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                {config.icon} {config.label}
              </span>
              <span className="text-[11px] text-slate-400">
                {data.date ? formatDate(data.date) : 'No date set'}
              </span>
            </div>
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-900/10">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-medium text-rose-700 dark:text-rose-400">
                {Object.keys(errors).length} issue{Object.keys(errors).length !== 1 ? 's' : ''} need attention
              </span>
            </div>
            <ul className="space-y-1">
              {Object.entries(errors).map(([field, msg]) => (
                <li key={field} className="text-xs text-rose-600 dark:text-rose-400">
                  {msg}
                </li>
              ))}
            </ul>
          </div>
        )}

        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{section.label}</span>
                </div>
                {onNavigateToSection && (
                  <button
                    onClick={() => onNavigateToSection(section.id)}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    <PenLine className="h-3 w-3" />
                    Edit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={field.label} className="flex items-baseline gap-2">
                    <span className="text-[11px] text-slate-400 min-w-[80px]">{field.label}:</span>
                    <span className={`text-xs font-medium ${
                      (field as any).required && !field.value
                        ? 'text-rose-500'
                        : field.value
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}>
                      {field.value || ((field as any).required ? 'Required' : 'Not set')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// â”€â”€â”€ PUBLISH SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface PublishSectionProps {
  data: Record<string, any>;
  onUpdate: (patch: Record<string, any>) => void;
  errors: Record<string, string>;
}

export function PublishSection({ data, onUpdate, errors }: PublishSectionProps) {
  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const tags: string[] = data.tags || [];
  const keywords: string[] = data.keywords || [];

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onUpdate({ tags: [...tags, trimmed] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    onUpdate({ tags: tags.filter((t) => t !== tag) });
  };

  const addKeyword = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      onUpdate({ keywords: [...keywords, trimmed] });
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => {
    onUpdate({ keywords: keywords.filter((k) => k !== kw) });
  };

  const STATUS_OPTIONS = [
    { value: 'DRAFT', label: 'Draft', description: 'Save without publishing', icon: FileText },
    { value: 'PUBLISHED', label: 'Published', description: 'Publish immediately', icon: Send },
    { value: 'SCHEDULED', label: 'Scheduled', description: 'Publish at a later time', icon: CalendarClock },
  ];

  return (
    <SectionCard title="Publish Settings" subtitle="Final settings before going live">
      <div className="space-y-6">
        <FormField label="Status" required error={errors.status}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = (data.status || 'DRAFT') === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate({ status: opt.value })}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <div>
                    <span className={`block text-sm font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {opt.label}
                    </span>
                    <span className="block text-[11px] text-slate-400">{opt.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </FormField>

        {(data.status === 'SCHEDULED') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <FormField label="Schedule Date & Time" required error={errors.scheduleDate}>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={data.scheduleDate || ''}
                  onChange={(e) => onUpdate({ scheduleDate: e.target.value })}
                  className={inputCls}
                />
                <input
                  type="time"
                  value={data.scheduleTime || ''}
                  onChange={(e) => onUpdate({ scheduleTime: e.target.value })}
                  className={inputCls}
                />
              </div>
            </FormField>
          </motion.div>
        )}

        <FormField label="Event Flags">
          <div className="space-y-2">
            {[
              { key: 'featured', label: 'Featured Event', description: 'Highlight on the timeline', icon: Star },
              { key: 'pinned', label: 'Pinned Event', description: 'Pin to the top of the timeline', icon: Pin },
              { key: 'verified', label: 'Verified Event', description: 'Show verification badge', icon: BadgeCheck },
            ].map((flag) => {
              const Icon = flag.icon;
              const isActive = data[flag.key] || false;
              return (
                <label
                  key={flag.key}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{flag.label}</span>
                      <p className="text-[11px] text-slate-400">{flag.description}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdate({ [flag.key]: !isActive })}
                    className={`h-6 w-11 rounded-full p-0.5 transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${isActive ? 'translate-x-5' : ''}`} />
                  </button>
                </label>
              );
            })}
          </div>
        </FormField>

        <FormField label="Tags" description="Press Enter or comma to add tags">
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
            {tags.map((tag) => (
              <motion.span
                key={tag}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                <Tag className="h-3 w-3" />
                {tag}
                <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-emerald-900 dark:hover:text-emerald-200">
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder={tags.length === 0 ? 'Add tags...' : ''}
              className="flex-1 min-w-[100px] bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none dark:text-white dark:placeholder-slate-500"
            />
          </div>
        </FormField>

        <FormField label="Keywords" description="Press Enter or comma to add keywords (for search)">
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
            {keywords.map((kw) => (
              <motion.span
                key={kw}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                {kw}
                <button onClick={() => removeKeyword(kw)} className="ml-0.5 hover:text-rose-500">
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ',') && keywordInput.trim()) {
                  e.preventDefault();
                  addKeyword(keywordInput);
                }
              }}
              placeholder={keywords.length === 0 ? 'Add keywords...' : ''}
              className="flex-1 min-w-[100px] bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none dark:text-white dark:placeholder-slate-500"
            />
          </div>
        </FormField>
      </div>
    </SectionCard>
  );
}
