'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Calendar, Heart, Users, MapPin, FileText, Image as ImageIcon, Shield, Send, DollarSign,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle, RadioGroup } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General Information', icon: <Calendar className="w-5 h-5" />,
    description: 'Date, time, location, and venue', required: true,
    fields: ['date', 'location', 'venue'] },
  { id: 'couple', title: 'Couple Details', icon: <Heart className="w-5 h-5" />,
    description: 'Spouse name, marriage type, ceremony type',
    fields: ['spouseName', 'marriageType'] },
  { id: 'ceremony', title: 'Ceremony Details', icon: <MapPin className="w-5 h-5" />,
    description: 'Nikah, walima, mehndi dates and locations',
    fields: [] },
  { id: 'logistics', title: 'Logistics', icon: <Users className="w-5 h-5" />,
    description: 'Guests, budget, caterer, photographer',
    fields: [] },
  { id: 'financial', title: 'Financial Details', icon: <DollarSign className="w-5 h-5" />,
    description: 'Mahr, dowry, gifts',
    fields: [] },
  { id: 'media', title: 'Photos & Videos', icon: <ImageIcon className="w-5 h-5" />,
    description: 'Wedding photos and videos',
    fields: [] },
  { id: 'documents', title: 'Documents', icon: <FileText className="w-5 h-5" />,
    description: 'Marriage certificate, witnesses',
    fields: [] },
  { id: 'visibility', title: 'Privacy & Visibility', icon: <Shield className="w-5 h-5" />,
    description: 'Who can see this event',
    fields: ['visibility'] },
  { id: 'publish', title: 'Review & Publish', icon: <Send className="w-5 h-5" />,
    description: 'Review your event before publishing',
    fields: [] },
];

export default function MarriageEventForm({ eventType, onComplete }: { eventType: string; onComplete: () => void }) {
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    date: '',
    time: '',
    location: '',
    venue: '',
    mapLink: '',
    spouseName: '',
    marriageType: 'Civil',
    ceremonyType: '',
    religion: '',
    nikahDate: '',
    nikahLocation: '',
    walimaDate: '',
    walimaLocation: '',
    mehndiDate: '',
    mehndiLocation: '',
    venueCapacity: '',
    caterer: '',
    photographer: '',
    decorator: '',
    seatingArrangement: '',
    mahrAmount: '',
    dowryDetails: '',
    totalBudget: '',
    giftRegistry: '',
    marriageCertNumber: '',
    witnesses: '',
    visibility: 'FAMILY',
    description: '',
    notes: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
  });

  const update = useCallback((field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    setIsDirty(true);
  }, []);

  const completionPercentage = useMemo(() => {
    const required = ['date', 'title', 'location', 'spouseName', 'visibility'];
    const filled = required.filter(f => {
      const val = form[f as keyof typeof form];
      if (val === undefined || val === null) return false;
      if (typeof val === 'string') return val.trim().length > 0;
      return true;
    });
    return Math.round((filled.length / required.length) * 100);
  }, [form]);

  const handleSave = async (publishStatus: string = 'DRAFT') => {
    if (publishStatus === 'PUBLISHED') setPublishing(true);
    else setSaving(true);
    try {
      const eventData: any = {
        eventType: eventType || 'MARRIAGE',
        title: form.title || `Marriage of ${form.spouseName || 'Partner'}`,
        description: form.description,
        notes: form.notes,
        date: form.date ? new Date(form.date).toISOString() : undefined,
        time: form.time,
        location: form.location,
        venue: form.venue,
        mapLink: form.mapLink,
        visibility: form.visibility,
        status: publishStatus,
        metadata: {
          subtitle: form.subtitle,
          spouseName: form.spouseName,
          marriageType: form.marriageType,
          ceremonyType: form.ceremonyType,
          religion: form.religion,
          nikahDate: form.nikahDate,
          nikahLocation: form.nikahLocation,
          walimaDate: form.walimaDate,
          walimaLocation: form.walimaLocation,
          mehndiDate: form.mehndiDate,
          mehndiLocation: form.mehndiLocation,
          venueCapacity: form.venueCapacity,
          caterer: form.caterer,
          photographer: form.photographer,
          decorator: form.decorator,
          seatingArrangement: form.seatingArrangement,
          mahrAmount: form.mahrAmount,
          dowryDetails: form.dowryDetails,
          totalBudget: form.totalBudget,
          giftRegistry: form.giftRegistry,
          marriageCertNumber: form.marriageCertNumber,
          witnesses: form.witnesses,
        },
        media: form.media.filter(m => m.url),
        documents: form.documents,
      };

      await api.timeline.create(eventData);
      setLastSaved(new Date());
      setIsDirty(false);
      onComplete();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Save error:', err);
      }
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const visibilityOptions = VISIBILITY_OPTIONS.map(v => ({
    value: v.value,
    label: v.label,
    description: v.description,
  }));

  return (
    <AccordionFormLayout
      title={eventType === 'ENGAGEMENT' ? 'Create Engagement Event' : 'Create Marriage Event'}
      subtitle={eventType === 'ENGAGEMENT' ? 'Document this special engagement' : 'Document this beautiful union'}
      sections={SECTIONS}
      data={form}
      onChange={(data: Record<string, any>) => setForm(f => ({ ...f, ...data }))}
      onSave={() => handleSave('DRAFT')}
      onPublish={() => handleSave('PUBLISHED')}
      saving={saving}
      publishing={publishing}
      completionPercentage={completionPercentage}
      lastSaved={lastSaved}
      isDirty={isDirty}
      eventType={eventType}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-5">
              <TextInput
                label="Event Title"
                value={form.title}
                onChange={v => update('title', v)}
                placeholder="Marriage of [Partner 1] & [Partner 2]"
              />
              <TextInput
                label="Subtitle"
                value={form.subtitle}
                onChange={v => update('subtitle', v)}
                placeholder="e.g., A union of two families"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput
                  label="Marriage Date"
                  value={form.date}
                  onChange={v => update('date', v)}
                  required
                  includeTime
                />
                <TextInput
                  label="Location"
                  value={form.location}
                  onChange={v => update('location', v)}
                  placeholder="City, Country"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Venue"
                  value={form.venue}
                  onChange={v => update('venue', v)}
                  placeholder="Venue name"
                />
                <TextInput
                  label="Google Maps Link"
                  value={form.mapLink}
                  onChange={v => update('mapLink', v)}
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <TextArea
                label="Description"
                value={form.description}
                onChange={v => update('description', v)}
                placeholder="Describe this beautiful occasion..."
                rows={3}
              />
            </div>
          )}

          {activeSection === 'couple' && (
            <div className="space-y-5">
              <TextInput
                label="Spouse Name"
                value={form.spouseName}
                onChange={v => update('spouseName', v)}
                placeholder="Spouse / partner name"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Marriage Type"
                  value={form.marriageType}
                  onChange={v => update('marriageType', v)}
                  options={[
                    { value: 'Civil', label: 'Civil' },
                    { value: 'Religious', label: 'Religious' },
                    { value: 'Both', label: 'Both' },
                  ]}
                />
                <TextInput
                  label="Ceremony Type"
                  value={form.ceremonyType}
                  onChange={v => update('ceremonyType', v)}
                  placeholder="e.g., Nikah, Church Wedding"
                />
              </div>
              <TextInput
                label="Religion"
                value={form.religion}
                onChange={v => update('religion', v)}
                placeholder="e.g., Islam, Christianity"
              />
            </div>
          )}

          {activeSection === 'ceremony' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Nikah</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DateInput
                    label="Nikah Date"
                    value={form.nikahDate}
                    onChange={v => update('nikahDate', v)}
                  />
                  <TextInput
                    label="Nikah Location"
                    value={form.nikahLocation}
                    onChange={v => update('nikahLocation', v)}
                    placeholder="Masjid or venue"
                  />
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Walima</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DateInput
                    label="Walima Date"
                    value={form.walimaDate}
                    onChange={v => update('walimaDate', v)}
                  />
                  <TextInput
                    label="Walima Location"
                    value={form.walimaLocation}
                    onChange={v => update('walimaLocation', v)}
                    placeholder="Venue name"
                  />
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Mehndi</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DateInput
                    label="Mehndi Date"
                    value={form.mehndiDate}
                    onChange={v => update('mehndiDate', v)}
                  />
                  <TextInput
                    label="Mehndi Location"
                    value={form.mehndiLocation}
                    onChange={v => update('mehndiLocation', v)}
                    placeholder="Venue name"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'logistics' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Venue Capacity"
                  value={form.venueCapacity}
                  onChange={v => update('venueCapacity', v)}
                  placeholder="Max guests"
                  type="number"
                />
                <TextInput
                  label="Caterer"
                  value={form.caterer}
                  onChange={v => update('caterer', v)}
                  placeholder="Catering service name"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Photographer"
                  value={form.photographer}
                  onChange={v => update('photographer', v)}
                  placeholder="Photographer name"
                />
                <TextInput
                  label="Decorator"
                  value={form.decorator}
                  onChange={v => update('decorator', v)}
                  placeholder="Decorator / Event planner"
                />
              </div>
              <TextInput
                label="Seating Arrangement"
                value={form.seatingArrangement}
                onChange={v => update('seatingArrangement', v)}
                placeholder="e.g., Round tables, Banquet style"
              />
            </div>
          )}

          {activeSection === 'financial' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Mahr Amount"
                  value={form.mahrAmount}
                  onChange={v => update('mahrAmount', v)}
                  placeholder="e.g., 500,000 PKR"
                />
                <TextInput
                  label="Dowry Details"
                  value={form.dowryDetails}
                  onChange={v => update('dowryDetails', v)}
                  placeholder="Brief dowry description"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Total Budget"
                  value={form.totalBudget}
                  onChange={v => update('totalBudget', v)}
                  placeholder="Estimated total"
                />
                <TextInput
                  label="Gift Registry"
                  value={form.giftRegistry}
                  onChange={v => update('giftRegistry', v)}
                  placeholder="Registry link or details"
                />
              </div>
            </div>
          )}

          {activeSection === 'media' && (
            <div className="space-y-5">
              <MediaManager
                media={form.media}
                onChange={m => update('media', m)}
                maxItems={30}
              />
            </div>
          )}

          {activeSection === 'documents' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Marriage Certificate Number"
                  value={form.marriageCertNumber}
                  onChange={v => update('marriageCertNumber', v)}
                  placeholder="Certificate number"
                />
                <TextInput
                  label="Witnesses"
                  value={form.witnesses}
                  onChange={v => update('witnesses', v)}
                  placeholder="Names of witnesses"
                />
              </div>
              <DocumentManager
                documents={form.documents}
                onChange={d => update('documents', d)}
                maxItems={10}
              />
            </div>
          )}

          {activeSection === 'visibility' && (
            <div className="space-y-5">
              <RadioGroup
                label="Visibility"
                description="Choose who can see this marriage event"
                options={visibilityOptions}
                value={form.visibility}
                onChange={v => update('visibility', v)}
                required
              />
            </div>
          )}

          {activeSection === 'publish' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-slate-700 dark:bg-slate-800/60">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Event Summary</h3>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Title</span>
                    <span className="font-medium text-slate-900 dark:text-white">{form.title || 'â€”'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date</span>
                    <span className="font-medium text-slate-900 dark:text-white">{form.date || 'â€”'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location</span>
                    <span className="font-medium text-slate-900 dark:text-white">{form.location || 'â€”'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Venue</span>
                    <span className="font-medium text-slate-900 dark:text-white">{form.venue || 'â€”'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spouse</span>
                    <span className="font-medium text-slate-900 dark:text-white">{form.spouseName || 'â€”'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="font-medium text-slate-900 dark:text-white">{form.marriageType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visibility</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {VISIBILITY_OPTIONS.find(v => v.value === form.visibility)?.label || form.visibility}
                    </span>
                  </div>
                </div>
              </div>

              <TextArea
                label="Additional Notes"
                value={form.notes}
                onChange={v => update('notes', v)}
                placeholder="Any final notes before publishing..."
                rows={3}
              />
            </div>
          )}
        </>
      )}
    </AccordionFormLayout>
  );
}
