'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, FileText, Users, Image, FolderOpen, Eye, Bell, Lock,
  MapPin, Clock, Tag,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS, EVENT_CATEGORIES } from './constants';

const CATEGORY_OPTIONS = EVENT_CATEGORIES.filter((c) => c.id !== 'all').map((c) => ({
  value: c.id,
  label: c.label,
}));

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <Calendar className="h-5 w-5" />, description: 'Event basics', fields: ['title', 'date', 'location'], required: true },
  { id: 'details', title: 'Details', icon: <FileText className="h-5 w-5" />, description: 'Description and category', fields: ['description', 'category'] },
  { id: 'people', title: 'People', icon: <Users className="h-5 w-5" />, description: 'Participants and attendees', fields: [] },
  { id: 'media', title: 'Media', icon: <Image className="h-5 w-5" />, description: 'Photos and videos', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Attached documents', fields: [] },
  { id: 'notifications', title: 'Notifications', icon: <Bell className="h-5 w-5" />, description: 'Reminder settings', fields: [] },
  { id: 'privacy', title: 'Privacy & Visibility', icon: <Lock className="h-5 w-5" />, description: 'Who can see this event', fields: ['visibility'] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface GenericEventFormProps {
  eventType?: string;
  onComplete?: () => void;
}

export default function GenericEventForm({ eventType, onComplete }: GenericEventFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: '',
    subtitle: '',
    description: '',
    date: '',
    endDate: '',
    location: '',
    venue: '',
    mapLink: '',
    category: '',
    customFields: [] as { key: string; value: string }[],
    participantIds: [] as string[],
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    reminderEnabled: false,
    reminderDate: '',
    reminderTime: '',
    visibility: 'FAMILY',
    tags: [] as string[],
    keywords: [] as string[],
    status: 'DRAFT',
  });

  const [tagInput, setTagInput] = useState('');

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !data.tags.includes(trimmed)) {
      update('tags', [...data.tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    update('tags', data.tags.filter((t: string) => t !== tag));
  };

  const addCustomField = () => {
    update('customFields', [...data.customFields, { key: '', value: '' }]);
  };

  const updateCustomField = (index: number, patch: Partial<{ key: string; value: string }>) => {
    const updated = [...data.customFields];
    updated[index] = { ...updated[index], ...patch };
    update('customFields', updated);
  };

  const removeCustomField = (index: number) => {
    update('customFields', data.customFields.filter((_: any, i: number) => i !== index));
  };

  const buildPayload = (statusOverride?: string) => ({
    eventType: eventType || 'CUSTOM_EVENT',
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    date: data.date ? new Date(data.date).toISOString() : undefined,
    endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    location: data.location,
    venue: data.venue,
    mapLink: data.mapLink,
    category: data.category,
    visibility: data.visibility,
    tags: data.tags,
    keywords: data.keywords,
    customFields: data.customFields,
    participantIds: data.participantIds,
    status: statusOverride || data.status,
    media: data.media.filter((m: MediaItem) => m.url),
    documents: data.documents,
    info: {
      reminderEnabled: data.reminderEnabled,
      reminderDate: data.reminderDate,
      reminderTime: data.reminderTime,
      customFields: data.customFields,
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.timeline.create(buildPayload());
      setLastSaved(new Date());
      setIsDirty(false);
      onComplete?.();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await api.timeline.create(buildPayload('PUBLISHED'));
      onComplete?.();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
    } finally {
      setSaving(false);
    }
  };

  const completion = useMemo(() => {
    let score = 0;
    if (data.title) score += 20;
    if (data.date) score += 15;
    if (data.description) score += 15;
    if (data.location) score += 10;
    if (data.category) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    if (data.visibility) score += 5;
    if (data.tags.length > 0) score += 5;
    if (data.venue) score += 5;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Event"
      subtitle="Create a custom event"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'CUSTOM_EVENT'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Family Reunion 2025" value={data.title} onChange={(v) => update('title', v)} />
              <TextInput label="Subtitle" placeholder="A short tagline for the event" value={data.subtitle} onChange={(v) => update('subtitle', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Start Date" required value={data.date} onChange={(v) => update('date', v)} includeTime />
                <DateInput label="End Date" value={data.endDate} onChange={(v) => update('endDate', v)} includeTime />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Location" placeholder="e.g. Chicago, IL" value={data.location} onChange={(v) => update('location', v)} />
                <TextInput label="Venue" placeholder="e.g. Hilton Hotel" value={data.venue} onChange={(v) => update('venue', v)} />
              </div>
              <TextInput label="Google Maps Link" type="url" placeholder="https://maps.google.com/..." value={data.mapLink} onChange={(v) => update('mapLink', v)} />
            </div>
          )}

          {activeSection === 'details' && (
            <div className="space-y-4">
              <TextArea label="Description" placeholder="Describe this event in detail" value={data.description} onChange={(v) => update('description', v)} rows={6} maxLength={5000} showCount />
              <Select label="Category" options={CATEGORY_OPTIONS} value={data.category} onChange={(v) => update('category', v)} placeholder="Select category" />
              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Custom Fields</label>
                {data.customFields.map((field: { key: string; value: string }, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <TextInput label="" placeholder="Field name" value={field.key} onChange={(v) => updateCustomField(i, { key: v })} className="flex-1" />
                    <TextInput label="" placeholder="Value" value={field.value} onChange={(v) => updateCustomField(i, { value: v })} className="flex-1" />
                    <button onClick={() => removeCustomField(i)} className="mt-6 rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                      &times;
                    </button>
                  </div>
                ))}
                <button onClick={addCustomField} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                  + Add Custom Field
                </button>
              </div>
            </div>
          )}

          {activeSection === 'people' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Select a family first, then choose participants to associate with this event.
              </p>
              <TextArea label="Participants" placeholder="List participants (names or descriptions)" value={(data.participantIds || []).join(', ')} onChange={(v) => update('participantIds', v.split(',').map((s: string) => s.trim()).filter(Boolean))} rows={4} />
            </div>
          )}

          {activeSection === 'media' && (
            <MediaManager media={data.media} onChange={(media) => update('media', media)} />
          )}

          {activeSection === 'documents' && (
            <DocumentManager documents={data.documents} onChange={(docs) => update('documents', docs)} />
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-4">
              <Toggle label="Enable Reminder" description="Send a reminder before this event" checked={data.reminderEnabled} onChange={(v) => update('reminderEnabled', v)} />
              {data.reminderEnabled && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DateInput label="Reminder Date" value={data.reminderDate} onChange={(v) => update('reminderDate', v)} />
                  <TextInput label="Reminder Time" placeholder="e.g. 09:00" value={data.reminderTime} onChange={(v) => update('reminderTime', v)} />
                </div>
              )}
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="space-y-4">
              <Select label="Visibility" options={VISIBILITY_OPTIONS.map((v) => ({ value: v.value, label: v.label }))} value={data.visibility} onChange={(v) => update('visibility', v)} />
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tags</label>
                <div className="flex gap-2">
                  <TextInput label="" placeholder="Add a tag" value={tagInput} onChange={setTagInput} className="flex-1" />
                  <button onClick={addTag} className="mt-6 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Add
                  </button>
                </div>
                {data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag: string) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-0.5 text-slate-400 hover:text-rose-500">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <TextArea label="Keywords" placeholder="Comma-separated keywords for search" value={(data.keywords || []).join(', ')} onChange={(v) => update('keywords', v.split(',').map((s: string) => s.trim()).filter(Boolean))} rows={2} />
            </div>
          )}

          {activeSection === 'review' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Event Summary</h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {data.title && <p><span className="font-medium text-slate-700 dark:text-slate-300">Title:</span> {data.title}</p>}
                  {data.subtitle && <p><span className="font-medium text-slate-700 dark:text-slate-300">Subtitle:</span> {data.subtitle}</p>}
                  {data.date && <p><span className="font-medium text-slate-700 dark:text-slate-300">Date:</span> {data.date}</p>}
                  {data.location && <p><span className="font-medium text-slate-700 dark:text-slate-300">Location:</span> {data.location}</p>}
                  {data.venue && <p><span className="font-medium text-slate-700 dark:text-slate-300">Venue:</span> {data.venue}</p>}
                  {data.category && <p><span className="font-medium text-slate-700 dark:text-slate-300">Category:</span> {data.category}</p>}
                  {data.description && <p><span className="font-medium text-slate-700 dark:text-slate-300">Description:</span> {data.description.substring(0, 120)}{data.description.length > 120 ? '...' : ''}</p>}
                  {data.tags.length > 0 && <p><span className="font-medium text-slate-700 dark:text-slate-300">Tags:</span> {data.tags.join(', ')}</p>}
                  {data.media.length > 0 && <p><span className="font-medium text-slate-700 dark:text-slate-300">Media:</span> {data.media.length} item(s)</p>}
                  {data.documents.length > 0 && <p><span className="font-medium text-slate-700 dark:text-slate-300">Documents:</span> {data.documents.length} file(s)</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select label="Visibility" options={VISIBILITY_OPTIONS.map((v) => ({ value: v.value, label: v.label }))} value={data.visibility} onChange={(v) => update('visibility', v)} />
                <Select label="Status" options={[{ value: 'DRAFT', label: 'Draft' }, { value: 'PUBLISHED', label: 'Published' }]} value={data.status} onChange={(v) => update('status', v)} />
              </div>
            </div>
          )}
        </>
      )}
    </AccordionFormLayout>
  );
}
