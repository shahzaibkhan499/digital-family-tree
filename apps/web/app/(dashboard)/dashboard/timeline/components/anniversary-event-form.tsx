'use client';

import React, { useState, useMemo } from 'react';
import {
  Heart, Users, PartyPopper, ClipboardList, MessageCircle, Image, FolderOpen, Eye,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const CELEBRATION_TYPES = [
  { value: 'Dinner', label: 'Dinner' },
  { value: 'Party', label: 'Party' },
  { value: 'Intimate', label: 'Intimate' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Religious', label: 'Religious' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <Heart className="h-5 w-5" />, description: 'Basic anniversary info', fields: ['title', 'anniversaryDate', 'location'], required: true },
  { id: 'couple', title: 'Couple', icon: <Users className="h-5 w-5" />, description: 'Partner details', fields: ['partner1Name', 'partner2Name', 'weddingDate', 'yearsMarried'] },
  { id: 'celebration', title: 'Celebration', icon: <PartyPopper className="h-5 w-5" />, description: 'Venue and plans', fields: ['venueName', 'venueAddress', 'celebrationType', 'theme', 'expectedGuests'] },
  { id: 'planning', title: 'Planning', icon: <ClipboardList className="h-5 w-5" />, description: 'Event arrangements', fields: ['hasCake', 'cakeDescription', 'entertainment', 'decorations', 'specialGifts', 'renewalVows'] },
  { id: 'reflection', title: 'Reflection', icon: <MessageCircle className="h-5 w-5" />, description: 'Memories and messages', fields: ['memorableMoments', 'messageToPartner', 'familyMessage'] },
  { id: 'media', title: 'Photos & Videos', icon: <Image className="h-5 w-5" />, description: 'Anniversary photos and videos', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Related documents', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface AnniversaryEventFormProps {
  eventType?: string;
  onComplete?: () => void;
}

export default function AnniversaryEventForm({ eventType, onComplete }: AnniversaryEventFormProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: 'Wedding Anniversary',
    anniversaryDate: '',
    location: '',
    partner1Name: '',
    partner2Name: '',
    weddingDate: '',
    yearsMarried: '',
    venueName: '',
    venueAddress: '',
    celebrationType: '',
    theme: '',
    expectedGuests: '',
    hasCake: false,
    cakeDescription: '',
    entertainment: '',
    decorations: '',
    specialGifts: '',
    renewalVows: false,
    memorableMoments: '',
    messageToPartner: '',
    familyMessage: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'ANNIVERSARY',
    title: data.title,
    description: data.partner1Name && data.partner2Name ? `${data.partner1Name} & ${data.partner2Name} Anniversary` : '',
    date: data.anniversaryDate ? new Date(data.anniversaryDate).toISOString() : undefined,
    location: data.location,
    visibility: data.visibility,
    info: {
      anniversaryDate: data.anniversaryDate,
      location: data.location,
      partner1Name: data.partner1Name,
      partner2Name: data.partner2Name,
      weddingDate: data.weddingDate,
      yearsMarried: data.yearsMarried,
      venueName: data.venueName,
      venueAddress: data.venueAddress,
      celebrationType: data.celebrationType,
      theme: data.theme,
      expectedGuests: data.expectedGuests,
      hasCake: data.hasCake,
      cakeDescription: data.cakeDescription,
      entertainment: data.entertainment,
      decorations: data.decorations,
      specialGifts: data.specialGifts,
      renewalVows: data.renewalVows,
      memorableMoments: data.memorableMoments,
      messageToPartner: data.messageToPartner,
      familyMessage: data.familyMessage,
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
    if (data.anniversaryDate) score += 10;
    if (data.partner1Name) score += 10;
    if (data.partner2Name) score += 10;
    if (data.weddingDate) score += 5;
    if (data.yearsMarried) score += 5;
    if (data.venueName) score += 5;
    if (data.celebrationType) score += 5;
    if (data.theme) score += 5;
    if (data.expectedGuests) score += 5;
    if (data.memorableMoments) score += 5;
    if (data.messageToPartner) score += 5;
    if (data.familyMessage) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 5;
    if (data.location) score += 5;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Anniversary Event"
      subtitle="Celebrate a wedding anniversary"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'ANNIVERSARY'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Wedding Anniversary" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Anniversary Date" required value={data.anniversaryDate} onChange={(v) => update('anniversaryDate', v)} />
                <TextInput label="Location" placeholder="e.g. New York, NY" value={data.location} onChange={(v) => update('location', v)} />
              </div>
            </div>
          )}

          {activeSection === 'couple' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Partner 1 Name" placeholder="e.g. John Smith" value={data.partner1Name} onChange={(v) => update('partner1Name', v)} />
                <TextInput label="Partner 2 Name" placeholder="e.g. Jane Smith" value={data.partner2Name} onChange={(v) => update('partner2Name', v)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Wedding Date" value={data.weddingDate} onChange={(v) => update('weddingDate', v)} />
                <TextInput label="Years Married" type="number" placeholder="e.g. 25" value={data.yearsMarried} onChange={(v) => update('yearsMarried', v)} />
              </div>
            </div>
          )}

          {activeSection === 'celebration' && (
            <div className="space-y-4">
              <TextInput label="Venue Name" placeholder="e.g. The Grand Ballroom" value={data.venueName} onChange={(v) => update('venueName', v)} />
              <TextInput label="Venue Address" placeholder="e.g. 123 Main St, City" value={data.venueAddress} onChange={(v) => update('venueAddress', v)} />
              <Select label="Celebration Type" options={CELEBRATION_TYPES} value={data.celebrationType} onChange={(v) => update('celebrationType', v)} placeholder="Select type" />
              <TextInput label="Theme" placeholder="e.g. Golden Jubilee" value={data.theme} onChange={(v) => update('theme', v)} />
              <TextInput label="Expected Guests" type="number" placeholder="e.g. 50" value={data.expectedGuests} onChange={(v) => update('expectedGuests', v)} />
            </div>
          )}

          {activeSection === 'planning' && (
            <div className="space-y-4">
              <Toggle label="Has Cake" checked={data.hasCake} onChange={(v) => update('hasCake', v)} />
              {data.hasCake && (
                <TextInput label="Cake Description" placeholder="e.g. Three-tier vanilla with gold accents" value={data.cakeDescription} onChange={(v) => update('cakeDescription', v)} />
              )}
              <TextArea label="Entertainment" placeholder="Describe music, performances, or activities" value={data.entertainment} onChange={(v) => update('entertainment', v)} rows={3} />
              <TextArea label="Decorations" placeholder="Describe decorations and setup" value={data.decorations} onChange={(v) => update('decorations', v)} rows={3} />
              <TextArea label="Special Gifts" placeholder="List any planned gifts" value={data.specialGifts} onChange={(v) => update('specialGifts', v)} rows={3} />
              <Toggle label="Renewal of Vows" checked={data.renewalVows} onChange={(v) => update('renewalVows', v)} />
            </div>
          )}

          {activeSection === 'reflection' && (
            <div className="space-y-4">
              <TextArea label="Memorable Moments" placeholder="Share favorite memories together" value={data.memorableMoments} onChange={(v) => update('memorableMoments', v)} rows={4} />
              <TextArea label="Message to Partner" placeholder="Write a message to your partner" value={data.messageToPartner} onChange={(v) => update('messageToPartner', v)} rows={4} />
              <TextArea label="Family Message" placeholder="Share a message for the family" value={data.familyMessage} onChange={(v) => update('familyMessage', v)} rows={4} />
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
                  {data.partner1Name && data.partner2Name && <p><span className="font-medium text-slate-700 dark:text-slate-300">Couple:</span> {data.partner1Name} &amp; {data.partner2Name}</p>}
                  {data.anniversaryDate && <p><span className="font-medium text-slate-700 dark:text-slate-300">Date:</span> {data.anniversaryDate}</p>}
                  {data.weddingDate && <p><span className="font-medium text-slate-700 dark:text-slate-300">Wedding Date:</span> {data.weddingDate}</p>}
                  {data.yearsMarried && <p><span className="font-medium text-slate-700 dark:text-slate-300">Years Married:</span> {data.yearsMarried}</p>}
                  {data.location && <p><span className="font-medium text-slate-700 dark:text-slate-300">Location:</span> {data.location}</p>}
                  {data.celebrationType && <p><span className="font-medium text-slate-700 dark:text-slate-300">Type:</span> {data.celebrationType}</p>}
                  {data.theme && <p><span className="font-medium text-slate-700 dark:text-slate-300">Theme:</span> {data.theme}</p>}
                  {data.expectedGuests && <p><span className="font-medium text-slate-700 dark:text-slate-300">Guests:</span> {data.expectedGuests}</p>}
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
