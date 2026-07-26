'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Calendar, Heart, Users, MapPin, FileText, Image as ImageIcon, Shield, Send, BookOpen,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, RadioGroup } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General Information', icon: <Calendar className="w-5 h-5" />,
    description: 'Date, time, and location of passing', required: true,
    fields: ['date', 'location'] },
  { id: 'details', title: 'Death Details', icon: <Heart className="w-5 h-5" />,
    description: 'Cause, type, age at death',
    fields: ['causeOfDeath', 'deathType'] },
  { id: 'funeral', title: 'Funeral & Burial', icon: <MapPin className="w-5 h-5" />,
    description: 'Burial date/location, janazah details',
    fields: [] },
  { id: 'legal', title: 'Legal Information', icon: <FileText className="w-5 h-5" />,
    description: 'Death certificate, burial permit, estate',
    fields: [] },
  { id: 'family', title: 'Family Notification', icon: <Users className="w-5 h-5" />,
    description: 'Next of kin and family details',
    fields: [] },
  { id: 'memorial', title: 'Memorial & Obituary', icon: <BookOpen className="w-5 h-5" />,
    description: 'Obituary, memorial service details',
    fields: [] },
  { id: 'media', title: 'Photos & Videos', icon: <ImageIcon className="w-5 h-5" />,
    description: 'Photos and memorial media',
    fields: [] },
  { id: 'documents', title: 'Documents', icon: <FileText className="w-5 h-5" />,
    description: 'Certificates, reports, permits',
    fields: [] },
  { id: 'visibility', title: 'Privacy & Visibility', icon: <Shield className="w-5 h-5" />,
    description: 'Who can see this event',
    fields: ['visibility'] },
  { id: 'publish', title: 'Review & Publish', icon: <Send className="w-5 h-5" />,
    description: 'Review your event before publishing',
    fields: [] },
];

export default function DeathEventForm({ eventType, onComplete }: { eventType: string; onComplete: () => void }) {
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    hospital: '',
    causeOfDeath: '',
    ageAtDeath: '',
    deathType: 'Natural',
    burialDate: '',
    burialLocation: '',
    funeralHome: '',
    janazahDetails: '',
    deathCertNumber: '',
    coronerReport: '',
    estateExecutor: '',
    nextOfKin: '',
    familyNotificationStatus: '',
    obituary: '',
    memorialServiceDate: '',
    memorialServiceLocation: '',
    memorialServiceDetails: '',
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
    const required = ['date', 'title', 'location', 'visibility'];
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
        eventType: 'DEATH',
        title: form.title || 'Passing Event',
        description: form.description,
        notes: form.notes,
        date: form.date ? new Date(form.date).toISOString() : undefined,
        time: form.time,
        location: form.location,
        venue: form.hospital,
        visibility: form.visibility,
        status: publishStatus,
        metadata: {
          hospital: form.hospital,
          causeOfDeath: form.causeOfDeath,
          ageAtDeath: form.ageAtDeath,
          deathType: form.deathType,
          burialDate: form.burialDate,
          burialLocation: form.burialLocation,
          funeralHome: form.funeralHome,
          janazahDetails: form.janazahDetails,
          deathCertNumber: form.deathCertNumber,
          coronerReport: form.coronerReport,
          estateExecutor: form.estateExecutor,
          nextOfKin: form.nextOfKin,
          familyNotificationStatus: form.familyNotificationStatus,
          obituary: form.obituary,
          memorialServiceDate: form.memorialServiceDate,
          memorialServiceLocation: form.memorialServiceLocation,
          memorialServiceDetails: form.memorialServiceDetails,
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
      title="Create Death Event"
      subtitle="Honor the memory of a loved one"
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
                placeholder="In loving memory of..."
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput
                  label="Date of Passing"
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
              <TextInput
                label="Hospital / Care Facility"
                value={form.hospital}
                onChange={v => update('hospital', v)}
                placeholder="Hospital or care facility name"
              />
              <TextArea
                label="Description"
                value={form.description}
                onChange={v => update('description', v)}
                placeholder="A tribute to their life..."
                rows={3}
              />
            </div>
          )}

          {activeSection === 'details' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Cause of Death"
                  value={form.causeOfDeath}
                  onChange={v => update('causeOfDeath', v)}
                  placeholder="e.g., Natural causes, Illness"
                />
                <TextInput
                  label="Age at Death"
                  value={form.ageAtDeath}
                  onChange={v => update('ageAtDeath', v)}
                  placeholder="e.g., 78 years"
                />
              </div>
              <Select
                label="Type of Death"
                value={form.deathType}
                onChange={v => update('deathType', v)}
                options={[
                  { value: 'Natural', label: 'Natural' },
                  { value: 'Accident', label: 'Accident' },
                  { value: 'Illness', label: 'Illness' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>
          )}

          {activeSection === 'funeral' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput
                  label="Burial Date"
                  value={form.burialDate}
                  onChange={v => update('burialDate', v)}
                />
                <TextInput
                  label="Burial Location"
                  value={form.burialLocation}
                  onChange={v => update('burialLocation', v)}
                  placeholder="Cemetery / Burial site"
                />
              </div>
              <TextInput
                label="Funeral Home"
                value={form.funeralHome}
                onChange={v => update('funeralHome', v)}
                placeholder="Funeral home name"
              />
              <TextArea
                label="Janazah Prayer Details"
                value={form.janazahDetails}
                onChange={v => update('janazahDetails', v)}
                placeholder="Masjid, time, and other details..."
                rows={3}
              />
            </div>
          )}

          {activeSection === 'legal' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Death Certificate Number"
                  value={form.deathCertNumber}
                  onChange={v => update('deathCertNumber', v)}
                  placeholder="Certificate number"
                />
                <TextInput
                  label="Coroner Report Reference"
                  value={form.coronerReport}
                  onChange={v => update('coronerReport', v)}
                  placeholder="Report reference"
                />
              </div>
              <TextInput
                label="Estate Executor"
                value={form.estateExecutor}
                onChange={v => update('estateExecutor', v)}
                placeholder="Executor name"
              />
            </div>
          )}

          {activeSection === 'family' && (
            <div className="space-y-5">
              <TextInput
                label="Next of Kin"
                value={form.nextOfKin}
                onChange={v => update('nextOfKin', v)}
                placeholder="Next of kin name"
              />
              <Select
                label="Family Notification Status"
                value={form.familyNotificationStatus}
                onChange={v => update('familyNotificationStatus', v)}
                options={[
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Notified', label: 'Notified' },
                  { value: 'All Notified', label: 'All Notified' },
                ]}
                placeholder="Select status"
              />
            </div>
          )}

          {activeSection === 'memorial' && (
            <div className="space-y-5">
              <TextArea
                label="Obituary"
                value={form.obituary}
                onChange={v => update('obituary', v)}
                placeholder="Write a heartfelt obituary..."
                rows={6}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput
                  label="Memorial Service Date"
                  value={form.memorialServiceDate}
                  onChange={v => update('memorialServiceDate', v)}
                />
                <TextInput
                  label="Memorial Service Location"
                  value={form.memorialServiceLocation}
                  onChange={v => update('memorialServiceLocation', v)}
                  placeholder="Venue name"
                />
              </div>
              <TextArea
                label="Memorial Service Details"
                value={form.memorialServiceDetails}
                onChange={v => update('memorialServiceDetails', v)}
                placeholder="Additional details about the service..."
                rows={3}
              />
            </div>
          )}

          {activeSection === 'media' && (
            <div className="space-y-5">
              <MediaManager
                media={form.media}
                onChange={m => update('media', m)}
                maxItems={20}
              />
            </div>
          )}

          {activeSection === 'documents' && (
            <div className="space-y-5">
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
                description="Choose who can see this memorial event"
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
                    <span>Cause</span>
                    <span className="font-medium text-slate-900 dark:text-white">{form.causeOfDeath || 'â€”'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="font-medium text-slate-900 dark:text-white">{form.deathType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Burial Date</span>
                    <span className="font-medium text-slate-900 dark:text-white">{form.burialDate || 'â€”'}</span>
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
