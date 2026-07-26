'use client';

import React, { useState, useMemo } from 'react';
import {
  Cake, PartyPopper, Users, Palette, Gift, Image, FolderOpen, Eye,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const INVITEE_SCOPES = [
  { value: 'Family', label: 'Family' },
  { value: 'Friends', label: 'Friends' },
  { value: 'Colleagues', label: 'Colleagues' },
  { value: 'All', label: 'All' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <Cake className="h-5 w-5" />, description: 'Basic celebration info', fields: ['title', 'date'], required: true },
  { id: 'celebration', title: 'Celebration Details', icon: <PartyPopper className="h-5 w-5" />, description: 'Venue and milestone info', fields: ['theme', 'venueName', 'venueAddress', 'age'] },
  { id: 'guests', title: 'Guests', icon: <Users className="h-5 w-5" />, description: 'Guest and invite details', fields: ['expectedGuests', 'guestOfHonor', 'inviteeScope'] },
  { id: 'planning', title: 'Planning', icon: <Palette className="h-5 w-5" />, description: 'Cake, entertainment, and decor', fields: ['cakeDescription', 'cakeFlavor', 'entertainment', 'decorations'] },
  { id: 'gifts', title: 'Gift Registry', icon: <Gift className="h-5 w-5" />, description: 'Gift preferences and registry', fields: ['registryUrl', 'giftPreferences'] },
  { id: 'media', title: 'Photos & Videos', icon: <Image className="h-5 w-5" />, description: 'Celebration photos and videos', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Invitations and related docs', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface Props {
  eventType?: string;
  onComplete?: () => void;
}

export default function BirthdayEventForm({ eventType, onComplete }: Props) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: '',
    date: '',
    location: '',
    theme: '',
    venueName: '',
    venueAddress: '',
    age: '',
    milestone: false,
    expectedGuests: '',
    guestOfHonor: '',
    inviteeScope: '',
    rsvpRequired: false,
    cakeDescription: '',
    cakeFlavor: '',
    entertainment: '',
    decorations: '',
    specialSurprises: '',
    hasRegistry: false,
    registryUrl: '',
    giftPreferences: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'BIRTHDAY',
    title: data.title,
    description: data.guestOfHonor ? `Birthday celebration for ${data.guestOfHonor}` : '',
    date: data.date ? new Date(data.date).toISOString() : undefined,
    location: data.venueName || data.location,
    visibility: data.visibility,
    info: {
      theme: data.theme,
      venueName: data.venueName,
      venueAddress: data.venueAddress,
      age: data.age,
      milestone: data.milestone,
      expectedGuests: data.expectedGuests,
      guestOfHonor: data.guestOfHonor,
      inviteeScope: data.inviteeScope,
      rsvpRequired: data.rsvpRequired,
      cakeDescription: data.cakeDescription,
      cakeFlavor: data.cakeFlavor,
      entertainment: data.entertainment,
      decorations: data.decorations,
      specialSurprises: data.specialSurprises,
      hasRegistry: data.hasRegistry,
      registryUrl: data.registryUrl,
      giftPreferences: data.giftPreferences,
    },
    media: data.media.filter((m: MediaItem) => m.url),
    documents: data.documents,
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
      await api.timeline.create({ ...buildPayload(), status: 'PUBLISHED' });
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
    if (data.title) score += 10;
    if (data.date) score += 10;
    if (data.guestOfHonor) score += 15;
    if (data.age) score += 5;
    if (data.venueName) score += 10;
    if (data.theme) score += 5;
    if (data.expectedGuests) score += 5;
    if (data.inviteeScope) score += 5;
    if (data.cakeDescription) score += 5;
    if (data.cakeFlavor) score += 5;
    if (data.entertainment) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Birthday Celebration"
      subtitle="Record a birthday event"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'BIRTHDAY'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. John's 50th Birthday" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Birth Date" required value={data.date} onChange={(v) => update('date', v)} />
                <TextInput label="Venue" placeholder="e.g. Grand Ballroom, Hilton Hotel" value={data.location} onChange={(v) => update('location', v)} />
              </div>
            </div>
          )}

          {activeSection === 'celebration' && (
            <div className="space-y-4">
              <TextInput label="Theme" placeholder="e.g. Hawaiian Luau" value={data.theme} onChange={(v) => update('theme', v)} />
              <TextInput label="Venue Name" placeholder="e.g. Riverside Banquet Hall" value={data.venueName} onChange={(v) => update('venueName', v)} />
              <TextInput label="Venue Address" placeholder="e.g. 123 Main St, City, State" value={data.venueAddress} onChange={(v) => update('venueAddress', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Age" type="number" placeholder="e.g. 50" value={data.age} onChange={(v) => update('age', v)} />
                <Toggle label="Milestone Birthday" checked={data.milestone} onChange={(v) => update('milestone', v)} />
              </div>
            </div>
          )}

          {activeSection === 'guests' && (
            <div className="space-y-4">
              <TextInput label="Expected Guests" type="number" placeholder="e.g. 100" value={data.expectedGuests} onChange={(v) => update('expectedGuests', v)} />
              <TextInput label="Guest of Honor" placeholder="e.g. John Smith" value={data.guestOfHonor} onChange={(v) => update('guestOfHonor', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select label="Invitee Scope" options={INVITEE_SCOPES} value={data.inviteeScope} onChange={(v) => update('inviteeScope', v)} placeholder="Select scope" />
                <Toggle label="RSVP Required" checked={data.rsvpRequired} onChange={(v) => update('rsvpRequired', v)} />
              </div>
            </div>
          )}

          {activeSection === 'planning' && (
            <div className="space-y-4">
              <TextInput label="Cake Description" placeholder="e.g. Three-tier chocolate cake" value={data.cakeDescription} onChange={(v) => update('cakeDescription', v)} />
              <TextInput label="Cake Flavor" placeholder="e.g. Red Velvet" value={data.cakeFlavor} onChange={(v) => update('cakeFlavor', v)} />
              <TextArea label="Entertainment" placeholder="Describe music, DJ, activities, etc." value={data.entertainment} onChange={(v) => update('entertainment', v)} rows={4} />
              <TextArea label="Decorations" placeholder="Describe the decorations" value={data.decorations} onChange={(v) => update('decorations', v)} rows={3} />
              <TextArea label="Special Surprises" placeholder="Any surprises planned?" value={data.specialSurprises} onChange={(v) => update('specialSurprises', v)} rows={3} />
            </div>
          )}

          {activeSection === 'gifts' && (
            <div className="space-y-4">
              <Toggle label="Has Gift Registry" checked={data.hasRegistry} onChange={(v) => update('hasRegistry', v)} />
              <TextInput label="Registry URL" type="url" placeholder="https://www.example.com/registry" value={data.registryUrl} onChange={(v) => update('registryUrl', v)} />
              <TextArea label="Gift Preferences" placeholder="Describe gift preferences or wish list" value={data.giftPreferences} onChange={(v) => update('giftPreferences', v)} rows={4} />
            </div>
          )}

          {activeSection === 'media' && (
            <MediaManager media={data.media} onChange={(media) => update('media', media)} />
          )}

          {activeSection === 'documents' && (
            <DocumentManager documents={data.documents} onChange={(docs) => update('documents', docs)} />
          )}

          {activeSection === 'review' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Event Summary</h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {data.title && <p><span className="font-medium text-slate-700 dark:text-slate-300">Title:</span> {data.title}</p>}
                  {data.guestOfHonor && <p><span className="font-medium text-slate-700 dark:text-slate-300">Guest of Honor:</span> {data.guestOfHonor}</p>}
                  {data.age && <p><span className="font-medium text-slate-700 dark:text-slate-300">Age:</span> {data.age}</p>}
                  {data.date && <p><span className="font-medium text-slate-700 dark:text-slate-300">Date:</span> {data.date}</p>}
                  {data.theme && <p><span className="font-medium text-slate-700 dark:text-slate-300">Theme:</span> {data.theme}</p>}
                  {data.venueName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Venue:</span> {data.venueName}</p>}
                  {data.expectedGuests && <p><span className="font-medium text-slate-700 dark:text-slate-300">Guests:</span> {data.expectedGuests}</p>}
                  {data.inviteeScope && <p><span className="font-medium text-slate-700 dark:text-slate-300">Scope:</span> {data.inviteeScope}</p>}
                  {data.cakeFlavor && <p><span className="font-medium text-slate-700 dark:text-slate-300">Cake:</span> {data.cakeFlavor}</p>}
                </div>
              </div>
              <Select label="Visibility" options={VISIBILITY_OPTIONS.map((v) => ({ value: v.value, label: v.label }))} value={data.visibility} onChange={(v) => update('visibility', v)} />
            </div>
          )}
        </>
      )}
    </AccordionFormLayout>
  );
}
