'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy, Star, FileText, Image, FolderOpen, Eye, Gift, Users,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle, RadioGroup } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const AWARD_LEVELS = [
  { value: 'Local', label: 'Local' },
  { value: 'Regional', label: 'Regional' },
  { value: 'National', label: 'National' },
  { value: 'International', label: 'International' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <Trophy className="h-5 w-5" />, description: 'Ceremony information', fields: ['title', 'ceremonyDate', 'ceremonyLocation'], required: true },
  { id: 'details', title: 'Award Details', icon: <Star className="h-5 w-5" />, description: 'Name and classification', fields: ['awardName', 'awardType', 'awardCategory', 'awardLevel'] },
  { id: 'presentation', title: 'Presentation', icon: <Users className="h-5 w-5" />, description: 'Who presented the award', fields: ['presentedBy', 'organization', 'awardDescription', 'significance'] },
  { id: 'nomination', title: 'Nomination', icon: <FileText className="h-5 w-5" />, description: 'Nomination details', fields: ['nominationDate', 'nominatedBy', 'nominationReason'] },
  { id: 'prize', title: 'Prize', icon: <Gift className="h-5 w-5" />, description: 'Prize details', fields: ['prizeAmount', 'prizeCurrency'] },
  { id: 'media', title: 'Media', icon: <Image className="h-5 w-5" />, description: 'Ceremony photos and press coverage', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Certificate and citation', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface AwardEventFormProps {
  eventType?: string;
  onComplete?: () => void;
}

export default function AwardEventForm({ eventType, onComplete }: AwardEventFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: '',
    ceremonyDate: '',
    ceremonyLocation: '',
    awardName: '',
    awardType: '',
    awardCategory: '',
    awardLevel: '',
    presentedBy: '',
    organization: '',
    awardDescription: '',
    significance: '',
    nominationDate: '',
    nominatedBy: '',
    nominationReason: '',
    totalNominees: '',
    prizeAmount: '',
    prizeCurrency: 'USD',
    hasTrophy: false,
    hasCertificate: false,
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'AWARD',
    title: data.title,
    description: data.awardDescription || (data.awardName ? `Award: ${data.awardName}` : ''),
    date: data.ceremonyDate ? new Date(data.ceremonyDate).toISOString() : undefined,
    location: data.ceremonyLocation,
    visibility: data.visibility,
    info: {
      ceremonyDate: data.ceremonyDate,
      ceremonyLocation: data.ceremonyLocation,
      awardName: data.awardName,
      awardType: data.awardType,
      awardCategory: data.awardCategory,
      awardLevel: data.awardLevel,
      presentedBy: data.presentedBy,
      organization: data.organization,
      awardDescription: data.awardDescription,
      significance: data.significance,
      nominationDate: data.nominationDate,
      nominatedBy: data.nominatedBy,
      nominationReason: data.nominationReason,
      totalNominees: data.totalNominees,
      prizeAmount: data.prizeAmount,
      prizeCurrency: data.prizeCurrency,
      hasTrophy: data.hasTrophy,
      hasCertificate: data.hasCertificate,
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
    if (data.title) score += 15;
    if (data.ceremonyDate) score += 10;
    if (data.awardName) score += 15;
    if (data.awardType) score += 10;
    if (data.awardLevel) score += 10;
    if (data.presentedBy) score += 10;
    if (data.organization) score += 5;
    if (data.awardDescription) score += 10;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 5;
    if (data.ceremonyLocation) score += 5;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Award Event"
      subtitle="Record an award or achievement"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'AWARD'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Lifetime Achievement Award" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Ceremony Date" required value={data.ceremonyDate} onChange={(v) => update('ceremonyDate', v)} />
                <TextInput label="Ceremony Location" placeholder="e.g. Grand Ballroom, NYC" value={data.ceremonyLocation} onChange={(v) => update('ceremonyLocation', v)} />
              </div>
            </div>
          )}

          {activeSection === 'details' && (
            <div className="space-y-4">
              <TextInput label="Award Name" placeholder="e.g. Nobel Prize in Literature" value={data.awardName} onChange={(v) => update('awardName', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Award Type" placeholder="e.g. Lifetime Achievement" value={data.awardType} onChange={(v) => update('awardType', v)} />
                <TextInput label="Category" placeholder="e.g. Literature" value={data.awardCategory} onChange={(v) => update('awardCategory', v)} />
              </div>
              <Select label="Level" options={AWARD_LEVELS} value={data.awardLevel} onChange={(v) => update('awardLevel', v)} placeholder="Select award level" />
            </div>
          )}

          {activeSection === 'presentation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Presented By" placeholder="e.g. Dr. Jane Smith" value={data.presentedBy} onChange={(v) => update('presentedBy', v)} />
                <TextInput label="Organization" placeholder="e.g. International Committee" value={data.organization} onChange={(v) => update('organization', v)} />
              </div>
              <TextArea label="Description" placeholder="Describe the award and what it recognizes" value={data.awardDescription} onChange={(v) => update('awardDescription', v)} rows={4} />
              <TextArea label="Significance" placeholder="Why is this award significant?" value={data.significance} onChange={(v) => update('significance', v)} rows={3} />
            </div>
          )}

          {activeSection === 'nomination' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Nomination Date" value={data.nominationDate} onChange={(v) => update('nominationDate', v)} />
                <TextInput label="Nominated By" placeholder="e.g. Academic Committee" value={data.nominatedBy} onChange={(v) => update('nominatedBy', v)} />
              </div>
              <TextArea label="Nomination Reason" placeholder="Reason for nomination" value={data.nominationReason} onChange={(v) => update('nominationReason', v)} rows={3} />
              <TextInput label="Total Nominees" type="number" placeholder="e.g. 250" value={data.totalNominees} onChange={(v) => update('totalNominees', v)} />
            </div>
          )}

          {activeSection === 'prize' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Prize Amount" type="number" placeholder="e.g. 1000000" value={data.prizeAmount} onChange={(v) => update('prizeAmount', v)} />
                <Select label="Currency" options={CURRENCIES} value={data.prizeCurrency} onChange={(v) => update('prizeCurrency', v)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Toggle label="Includes Trophy" checked={data.hasTrophy} onChange={(v) => update('hasTrophy', v)} />
                <Toggle label="Includes Certificate" checked={data.hasCertificate} onChange={(v) => update('hasCertificate', v)} />
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
                  {data.awardName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Award:</span> {data.awardName}</p>}
                  {data.awardType && <p><span className="font-medium text-slate-700 dark:text-slate-300">Type:</span> {data.awardType}</p>}
                  {data.awardLevel && <p><span className="font-medium text-slate-700 dark:text-slate-300">Level:</span> {data.awardLevel}</p>}
                  {data.ceremonyDate && <p><span className="font-medium text-slate-700 dark:text-slate-300">Ceremony:</span> {data.ceremonyDate}</p>}
                  {data.presentedBy && <p><span className="font-medium text-slate-700 dark:text-slate-300">Presented by:</span> {data.presentedBy}</p>}
                  {data.organization && <p><span className="font-medium text-slate-700 dark:text-slate-300">Organization:</span> {data.organization}</p>}
                  {data.prizeAmount && <p><span className="font-medium text-slate-700 dark:text-slate-300">Prize:</span> {data.prizeCurrency} {data.prizeAmount}</p>}
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
