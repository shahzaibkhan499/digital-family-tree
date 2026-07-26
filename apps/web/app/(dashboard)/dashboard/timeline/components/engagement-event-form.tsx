'use client';

import React, { useState, useMemo } from 'react';
import {
  Heart, Users, Gem, Mail, Image, FolderOpen, Eye, Handshake,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const INVITATION_SCOPE_OPTIONS = [
  { value: 'Family', label: 'Family' },
  { value: 'SubClan', label: 'Sub-Clan' },
  { value: 'Clan', label: 'Clan' },
  { value: 'Community', label: 'Community' },
  { value: 'All', label: 'All' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <Heart className="h-5 w-5" />, description: 'Basic event info', fields: ['title', 'date', 'location'], required: true },
  { id: 'bride', title: 'Bride', icon: <Users className="h-5 w-5" />, description: 'Bride details', fields: ['brideName', 'brideAge', 'brideFamily', 'brideFather', 'brideMother'] },
  { id: 'groom', title: 'Groom', icon: <Users className="h-5 w-5" />, description: 'Groom details', fields: ['groomName', 'groomAge', 'groomFamily', 'groomFather', 'groomMother'] },
  { id: 'families', title: 'Families', icon: <Handshake className="h-5 w-5" />, description: 'Family introductions and approval', fields: ['brideFamilyName', 'groomFamilyName', 'introductionDate', 'familyApproval'] },
  { id: 'ring', title: 'Ring Ceremony', icon: <Gem className="h-5 w-5" />, description: 'Ring ceremony details', fields: ['ringDate', 'ringLocation', 'ringDescription', 'ringCost'] },
  { id: 'invitation', title: 'Invitation', icon: <Mail className="h-5 w-5" />, description: 'Guest list and venue', fields: ['invitationScope', 'guestCount', 'venueName'] },
  { id: 'media', title: 'Photos & Videos', icon: <Image className="h-5 w-5" />, description: 'Engagement photos and videos', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Related documents', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface Props {
  eventType?: string;
  onComplete?: () => void;
}

export default function EngagementEventForm({ eventType, onComplete }: Props) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: 'Engagement Celebration',
    date: '',
    location: '',
    brideName: '',
    brideAge: '',
    brideFamily: '',
    brideFather: '',
    brideMother: '',
    groomName: '',
    groomAge: '',
    groomFamily: '',
    groomFather: '',
    groomMother: '',
    brideFamilyName: '',
    groomFamilyName: '',
    introductionDate: '',
    familyApproval: false,
    ringDate: '',
    ringLocation: '',
    ringDescription: '',
    ringCost: '',
    invitationScope: '',
    guestCount: '',
    venueName: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'ENGAGEMENT',
    title: data.title,
    description: data.brideName && data.groomName
      ? `Engagement of ${data.brideName} & ${data.groomName}`
      : '',
    date: data.date ? new Date(data.date).toISOString() : undefined,
    location: data.location,
    visibility: data.visibility,
    info: {
      brideName: data.brideName,
      brideAge: data.brideAge,
      brideFamily: data.brideFamily,
      brideFather: data.brideFather,
      brideMother: data.brideMother,
      groomName: data.groomName,
      groomAge: data.groomAge,
      groomFamily: data.groomFamily,
      groomFather: data.groomFather,
      groomMother: data.groomMother,
      brideFamilyName: data.brideFamilyName,
      groomFamilyName: data.groomFamilyName,
      introductionDate: data.introductionDate,
      familyApproval: data.familyApproval,
      ringDate: data.ringDate,
      ringLocation: data.ringLocation,
      ringDescription: data.ringDescription,
      ringCost: data.ringCost,
      invitationScope: data.invitationScope,
      guestCount: data.guestCount,
      venueName: data.venueName,
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
    if (data.location) score += 5;
    if (data.brideName) score += 10;
    if (data.groomName) score += 10;
    if (data.brideFamily) score += 5;
    if (data.groomFamily) score += 5;
    if (data.ringDate) score += 5;
    if (data.ringLocation) score += 5;
    if (data.invitationScope) score += 5;
    if (data.guestCount) score += 5;
    if (data.venueName) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Engagement Event"
      subtitle="Record an engagement celebration"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'ENGAGEMENT'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Engagement Celebration" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Engagement Date" required value={data.date} onChange={(v) => update('date', v)} />
                <TextInput label="Location" placeholder="e.g. Lahore, Pakistan" value={data.location} onChange={(v) => update('location', v)} />
              </div>
            </div>
          )}

          {activeSection === 'bride' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Bride Name" placeholder="e.g. Ayesha Khan" value={data.brideName} onChange={(v) => update('brideName', v)} />
                <TextInput label="Bride Age" type="number" placeholder="e.g. 25" value={data.brideAge} onChange={(v) => update('brideAge', v)} />
              </div>
              <TextInput label="Bride Family" placeholder="e.g. Khan Family" value={data.brideFamily} onChange={(v) => update('brideFamily', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Father's Name" placeholder="e.g. Ahmed Khan" value={data.brideFather} onChange={(v) => update('brideFather', v)} />
                <TextInput label="Mother's Name" placeholder="e.g. Fatima Khan" value={data.brideMother} onChange={(v) => update('brideMother', v)} />
              </div>
            </div>
          )}

          {activeSection === 'groom' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Groom Name" placeholder="e.g. Ali Malik" value={data.groomName} onChange={(v) => update('groomName', v)} />
                <TextInput label="Groom Age" type="number" placeholder="e.g. 27" value={data.groomAge} onChange={(v) => update('groomAge', v)} />
              </div>
              <TextInput label="Groom Family" placeholder="e.g. Malik Family" value={data.groomFamily} onChange={(v) => update('groomFamily', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Father's Name" placeholder="e.g. Hassan Malik" value={data.groomFather} onChange={(v) => update('groomFather', v)} />
                <TextInput label="Mother's Name" placeholder="e.g. Zainab Malik" value={data.groomMother} onChange={(v) => update('groomMother', v)} />
              </div>
            </div>
          )}

          {activeSection === 'families' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Bride Family Name" placeholder="e.g. Khan" value={data.brideFamilyName} onChange={(v) => update('brideFamilyName', v)} />
                <TextInput label="Groom Family Name" placeholder="e.g. Malik" value={data.groomFamilyName} onChange={(v) => update('groomFamilyName', v)} />
              </div>
              <DateInput label="Introduction Date" value={data.introductionDate} onChange={(v) => update('introductionDate', v)} />
              <Toggle label="Family Approval" checked={data.familyApproval} onChange={(v) => update('familyApproval', v)} />
            </div>
          )}

          {activeSection === 'ring' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Ring Ceremony Date" value={data.ringDate} onChange={(v) => update('ringDate', v)} />
                <TextInput label="Ring Ceremony Location" placeholder="e.g. Hotel Serena" value={data.ringLocation} onChange={(v) => update('ringLocation', v)} />
              </div>
              <TextArea label="Ring Description" placeholder="Describe the ring ceremony details" value={data.ringDescription} onChange={(v) => update('ringDescription', v)} rows={3} />
              <TextInput label="Ring Cost" type="number" placeholder="e.g. 50000" value={data.ringCost} onChange={(v) => update('ringCost', v)} />
            </div>
          )}

          {activeSection === 'invitation' && (
            <div className="space-y-4">
              <Select label="Invitation Scope" options={INVITATION_SCOPE_OPTIONS} value={data.invitationScope} onChange={(v) => update('invitationScope', v)} placeholder="Select scope" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Guest Count" type="number" placeholder="e.g. 200" value={data.guestCount} onChange={(v) => update('guestCount', v)} />
                <TextInput label="Venue Name" placeholder="e.g. Grand Ballroom" value={data.venueName} onChange={(v) => update('venueName', v)} />
              </div>
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
                  {data.date && <p><span className="font-medium text-slate-700 dark:text-slate-300">Date:</span> {data.date}</p>}
                  {data.location && <p><span className="font-medium text-slate-700 dark:text-slate-300">Location:</span> {data.location}</p>}
                  {data.brideName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Bride:</span> {data.brideName}</p>}
                  {data.groomName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Groom:</span> {data.groomName}</p>}
                  {data.ringDate && <p><span className="font-medium text-slate-700 dark:text-slate-300">Ring Ceremony:</span> {data.ringDate}</p>}
                  {data.venueName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Venue:</span> {data.venueName}</p>}
                  {data.guestCount && <p><span className="font-medium text-slate-700 dark:text-slate-300">Guests:</span> {data.guestCount}</p>}
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
