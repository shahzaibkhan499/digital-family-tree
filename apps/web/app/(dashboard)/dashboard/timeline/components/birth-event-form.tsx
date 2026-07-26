'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Calendar, Baby, Users, Heart, Image as ImageIcon, FileText, Shield, Send,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle, RadioGroup } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { BIRTH_DELIVERY_TYPES, BLOOD_GROUPS, VISIBILITY_OPTIONS } from './constants';

const SECTIONS: FormSection[] = [
  { id: 'basic', title: 'General Information', icon: <Calendar className="w-5 h-5" />,
    description: 'Date, time, and location of birth', required: true,
    fields: ['date', 'birthPlace', 'hospitalName'] },
  { id: 'baby', title: 'Baby Details', icon: <Baby className="w-5 h-5" />,
    description: 'Weight, length, blood group, and medical details',
    fields: ['birthWeight', 'birthLength', 'bloodGroup', 'deliveryType'] },
  { id: 'parents', title: 'Family Information', icon: <Users className="w-5 h-5" />,
    description: 'Father and mother details',
    fields: ['fatherName', 'motherName'] },
  { id: 'medical', title: 'Medical Details', icon: <Heart className="w-5 h-5" />,
    description: 'Hospital, doctor, vaccinations',
    fields: ['doctorName', 'complications'] },
  { id: 'media', title: 'Photos & Videos', icon: <ImageIcon className="w-5 h-5" />,
    description: 'Birth photos and videos',
    fields: [] },
  { id: 'documents', title: 'Documents', icon: <FileText className="w-5 h-5" />,
    description: 'Birth certificate, hospital papers',
    fields: [] },
  { id: 'visibility', title: 'Privacy & Visibility', icon: <Shield className="w-5 h-5" />,
    description: 'Who can see this event',
    fields: ['visibility'] },
  { id: 'publish', title: 'Review & Publish', icon: <Send className="w-5 h-5" />,
    description: 'Review your event before publishing',
    fields: [] },
];

export default function BirthEventForm({ eventType, onComplete }: { eventType: string; onComplete: () => void }) {
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    birthPlace: '',
    hospitalName: '',
    hospitalOrHome: 'Hospital',
    birthWeight: '',
    birthLength: '',
    bloodGroup: '',
    deliveryType: '',
    apgarScore: '',
    healthStatus: '',
    hairColor: '',
    eyeColor: '',
    physicalDescription: '',
    fatherName: '',
    fatherAge: '',
    grandfatherName: '',
    motherName: '',
    motherAge: '',
    doctorName: '',
    nurseName: '',
    dai: '',
    complications: '',
    vaccinationStarted: false,
    firstPhoto: '',
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
    const required = ['date', 'title', 'birthPlace', 'visibility'];
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
        eventType: 'BIRTH',
        title: form.title || `Birth of Baby`,
        description: form.description,
        notes: form.notes,
        date: form.date ? new Date(form.date).toISOString() : undefined,
        time: form.time,
        location: form.birthPlace,
        venue: form.hospitalOrHome === 'Hospital' ? form.hospitalName : undefined,
        visibility: form.visibility,
        status: publishStatus,
        coverImage: form.firstPhoto || undefined,
        metadata: {
          hospitalOrHome: form.hospitalOrHome,
          hospitalName: form.hospitalName,
          birthWeight: form.birthWeight,
          birthLength: form.birthLength,
          bloodGroup: form.bloodGroup,
          deliveryType: form.deliveryType,
          apgarScore: form.apgarScore,
          healthStatus: form.healthStatus,
          hairColor: form.hairColor,
          eyeColor: form.eyeColor,
          physicalDescription: form.physicalDescription,
          fatherName: form.fatherName,
          fatherAge: form.fatherAge,
          grandfatherName: form.grandfatherName,
          motherName: form.motherName,
          motherAge: form.motherAge,
          doctorName: form.doctorName,
          nurseName: form.nurseName,
          dai: form.dai,
          complications: form.complications,
          vaccinationStarted: form.vaccinationStarted,
          firstPhoto: form.firstPhoto,
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

  const deliveryTypeOptions = BIRTH_DELIVERY_TYPES.map(t => ({ value: t, label: t }));
  const bloodGroupOptions = BLOOD_GROUPS.map(b => ({ value: b, label: b }));

  return (
    <AccordionFormLayout
      title="Create Birth Event"
      subtitle="Document the arrival of a new family member"
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
          {activeSection === 'basic' && (
            <div className="space-y-5">
              <TextInput
                label="Event Title"
                value={form.title}
                onChange={v => update('title', v)}
                placeholder="Birth of [Name]"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput
                  label="Date of Birth"
                  value={form.date}
                  onChange={v => update('date', v)}
                  required
                  includeTime
                />
                <Select
                  label="Born At"
                  value={form.hospitalOrHome}
                  onChange={v => update('hospitalOrHome', v)}
                  options={[
                    { value: 'Hospital', label: 'Hospital' },
                    { value: 'Home', label: 'Home' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Birth Place"
                  value={form.birthPlace}
                  onChange={v => update('birthPlace', v)}
                  placeholder="City, Country"
                />
                <TextInput
                  label="Hospital / Facility Name"
                  value={form.hospitalName}
                  onChange={v => update('hospitalName', v)}
                  placeholder="Hospital name"
                />
              </div>
              <TextInput
                label="Description"
                value={form.description}
                onChange={v => update('description', v)}
                placeholder="A beautiful story about this birth..."
              />
            </div>
          )}

          {activeSection === 'baby' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Birth Weight"
                  value={form.birthWeight}
                  onChange={v => update('birthWeight', v)}
                  placeholder="e.g., 3.2 kg"
                />
                <TextInput
                  label="Birth Length"
                  value={form.birthLength}
                  onChange={v => update('birthLength', v)}
                  placeholder="e.g., 50 cm"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Blood Group"
                  value={form.bloodGroup}
                  onChange={v => update('bloodGroup', v)}
                  options={bloodGroupOptions}
                  placeholder="Select blood group"
                />
                <Select
                  label="Delivery Type"
                  value={form.deliveryType}
                  onChange={v => update('deliveryType', v)}
                  options={deliveryTypeOptions}
                  placeholder="Select delivery type"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Apgar Score"
                  value={form.apgarScore}
                  onChange={v => update('apgarScore', v)}
                  placeholder="e.g., 9/10"
                />
                <TextInput
                  label="Health Status"
                  value={form.healthStatus}
                  onChange={v => update('healthStatus', v)}
                  placeholder="e.g., Healthy"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Hair Color"
                  value={form.hairColor}
                  onChange={v => update('hairColor', v)}
                  placeholder="e.g., Black"
                />
                <TextInput
                  label="Eye Color"
                  value={form.eyeColor}
                  onChange={v => update('eyeColor', v)}
                  placeholder="e.g., Brown"
                />
              </div>
              <TextArea
                label="Physical Description"
                value={form.physicalDescription}
                onChange={v => update('physicalDescription', v)}
                placeholder="Additional physical description..."
                rows={2}
              />
            </div>
          )}

          {activeSection === 'parents' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Father's Name"
                  value={form.fatherName}
                  onChange={v => update('fatherName', v)}
                  placeholder="Father's full name"
                />
                <TextInput
                  label="Father's Age"
                  value={form.fatherAge}
                  onChange={v => update('fatherAge', v)}
                  placeholder="e.g., 32"
                  type="number"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Grandfather's Name"
                  value={form.grandfatherName}
                  onChange={v => update('grandfatherName', v)}
                  placeholder="Paternal grandfather"
                />
                <div />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Mother's Name"
                  value={form.motherName}
                  onChange={v => update('motherName', v)}
                  placeholder="Mother's full name"
                />
                <TextInput
                  label="Mother's Age"
                  value={form.motherAge}
                  onChange={v => update('motherAge', v)}
                  placeholder="e.g., 28"
                  type="number"
                />
              </div>
            </div>
          )}

          {activeSection === 'medical' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Doctor's Name"
                  value={form.doctorName}
                  onChange={v => update('doctorName', v)}
                  placeholder="Attending physician"
                />
                <TextInput
                  label="Nurse / Midwife"
                  value={form.nurseName}
                  onChange={v => update('nurseName', v)}
                  placeholder="Nurse or midwife name"
                />
              </div>
              <TextInput
                label="Dai (Traditional Midwife)"
                value={form.dai}
                onChange={v => update('dai', v)}
                placeholder="Dai's name"
              />
              <TextArea
                label="Complications"
                value={form.complications}
                onChange={v => update('complications', v)}
                placeholder="Any complications during birth..."
                rows={3}
              />
              <Toggle
                label="Vaccination Started"
                description="Whether vaccination has been started"
                checked={form.vaccinationStarted}
                onChange={v => update('vaccinationStarted', v)}
              />
            </div>
          )}

          {activeSection === 'media' && (
            <div className="space-y-5">
              <TextInput
                label="First Photo URL"
                value={form.firstPhoto}
                onChange={v => update('firstPhoto', v)}
                placeholder="https://..."
              />
              {form.firstPhoto && (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <img src={form.firstPhoto} alt="First photo" className="h-48 w-full object-cover" />
                </div>
              )}
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
                description="Choose who can see this birth event"
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
                    <span className="font-medium text-slate-900 dark:text-white">{form.birthPlace || 'â€”'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hospital</span>
                    <span className="font-medium text-slate-900 dark:text-white">{form.hospitalName || 'â€”'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight</span>
                    <span className="font-medium text-slate-900 dark:text-white">{form.birthWeight || 'â€”'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Father</span>
                    <span className="font-medium text-slate-900 dark:text-white">{form.fatherName || 'â€”'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mother</span>
                    <span className="font-medium text-slate-900 dark:text-white">{form.motherName || 'â€”'}</span>
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
