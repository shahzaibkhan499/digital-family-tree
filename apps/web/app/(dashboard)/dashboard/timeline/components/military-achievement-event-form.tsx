'use client';

import React, { useState, useMemo } from 'react';
import {
  Award, Target, Building2, ShieldCheck, Sparkles, Image, FolderOpen, Eye,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const ACHIEVEMENT_TYPES = [
  { value: 'Medal', label: 'Medal' },
  { value: 'Commendation', label: 'Commendation' },
  { value: 'Citation', label: 'Citation' },
  { value: 'Promotion', label: 'Promotion' },
  { value: 'Classification', label: 'Classification' },
  { value: 'Other', label: 'Other' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <Award className="h-5 w-5" />, description: 'Basic achievement info', fields: ['title', 'awardDate'], required: true },
  { id: 'achievement', title: 'Achievement', icon: <Award className="h-5 w-5" />, description: 'Award details and type', fields: ['awardTitle', 'achievementType'] },
  { id: 'organization', title: 'Organization', icon: <Building2 className="h-5 w-5" />, description: 'Issuing organization', fields: ['organizationName', 'presentedBy', 'rankAtAward', 'unitAtTime'] },
  { id: 'verification', title: 'Verification', icon: <ShieldCheck className="h-5 w-5" />, description: 'Official verification details', fields: ['verificationSource', 'referenceNumber', 'certificateNumber'] },
  { id: 'significance', title: 'Significance', icon: <Sparkles className="h-5 w-5" />, description: 'Impact and importance', fields: ['significance', 'impact'] },
  { id: 'media', title: 'Photos & Videos', icon: <Image className="h-5 w-5" />, description: 'Award photos and videos', fields: [] },
  { id: 'documents', title: 'Certificates & Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Official documents', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface Props {
  eventType?: string;
  onComplete?: () => void;
}

export default function MilitaryAchievementEventForm({ eventType, onComplete }: Props) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: '',
    awardDate: '',
    location: '',
    awardTitle: '',
    achievementType: '',
    description: '',
    organizationName: '',
    presentedBy: '',
    rankAtAward: '',
    unitAtTime: '',
    isOfficial: false,
    verificationSource: '',
    referenceNumber: '',
    hasCertificate: false,
    certificateNumber: '',
    significance: '',
    impact: '',
    mediaCoverage: false,
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'MILITARY_ACHIEVEMENT',
    title: data.title,
    description: data.description || (data.awardTitle ? `${data.awardTitle}` : ''),
    date: data.awardDate ? new Date(data.awardDate).toISOString() : undefined,
    location: data.location,
    visibility: data.visibility,
    info: {
      awardTitle: data.awardTitle,
      achievementType: data.achievementType,
      description: data.description,
      organizationName: data.organizationName,
      presentedBy: data.presentedBy,
      rankAtAward: data.rankAtAward,
      unitAtTime: data.unitAtTime,
      isOfficial: data.isOfficial,
      verificationSource: data.verificationSource,
      referenceNumber: data.referenceNumber,
      hasCertificate: data.hasCertificate,
      certificateNumber: data.certificateNumber,
      significance: data.significance,
      impact: data.impact,
      mediaCoverage: data.mediaCoverage,
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
    if (data.awardDate) score += 10;
    if (data.awardTitle) score += 15;
    if (data.achievementType) score += 5;
    if (data.description) score += 10;
    if (data.organizationName) score += 10;
    if (data.presentedBy) score += 5;
    if (data.significance) score += 10;
    if (data.impact) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    if (data.location) score += 5;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Military Achievement"
      subtitle="Record a military award or achievement"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'MILITARY_ACHIEVEMENT'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Purple Heart Award" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Award Date" required value={data.awardDate} onChange={(v) => update('awardDate', v)} />
                <TextInput label="Location" placeholder="e.g. Fort Bragg, NC" value={data.location} onChange={(v) => update('location', v)} />
              </div>
            </div>
          )}

          {activeSection === 'achievement' && (
            <div className="space-y-4">
              <TextInput label="Award Title" placeholder="e.g. Purple Heart" value={data.awardTitle} onChange={(v) => update('awardTitle', v)} />
              <Select label="Achievement Type" options={ACHIEVEMENT_TYPES} value={data.achievementType} onChange={(v) => update('achievementType', v)} placeholder="Select type" />
              <TextArea label="Description" placeholder="Describe the achievement and circumstances" value={data.description} onChange={(v) => update('description', v)} rows={4} />
            </div>
          )}

          {activeSection === 'organization' && (
            <div className="space-y-4">
              <TextInput label="Organization Name" placeholder="e.g. United States Army" value={data.organizationName} onChange={(v) => update('organizationName', v)} />
              <TextInput label="Presented By" placeholder="e.g. General James Smith" value={data.presentedBy} onChange={(v) => update('presentedBy', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Rank at Award" placeholder="e.g. Sergeant" value={data.rankAtAward} onChange={(v) => update('rankAtAward', v)} />
                <TextInput label="Unit at Time" placeholder="e.g. 1st Infantry Division" value={data.unitAtTime} onChange={(v) => update('unitAtTime', v)} />
              </div>
            </div>
          )}

          {activeSection === 'verification' && (
            <div className="space-y-4">
              <Toggle label="Official Recognition" checked={data.isOfficial} onChange={(v) => update('isOfficial', v)} />
              <TextInput label="Verification Source" placeholder="e.g. National Archives" value={data.verificationSource} onChange={(v) => update('verificationSource', v)} />
              <TextInput label="Reference Number" placeholder="e.g. USA-2024-001234" value={data.referenceNumber} onChange={(v) => update('referenceNumber', v)} />
              <Toggle label="Has Certificate" checked={data.hasCertificate} onChange={(v) => update('hasCertificate', v)} />
              <TextInput label="Certificate Number" placeholder="e.g. CERT-2024-5678" value={data.certificateNumber} onChange={(v) => update('certificateNumber', v)} />
            </div>
          )}

          {activeSection === 'significance' && (
            <div className="space-y-4">
              <TextArea label="Significance" placeholder="Why does this achievement matter?" value={data.significance} onChange={(v) => update('significance', v)} rows={4} />
              <TextArea label="Impact" placeholder="Describe the impact of this achievement" value={data.impact} onChange={(v) => update('impact', v)} rows={4} />
              <Toggle label="Media Coverage" checked={data.mediaCoverage} onChange={(v) => update('mediaCoverage', v)} />
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
                  {data.awardTitle && <p><span className="font-medium text-slate-700 dark:text-slate-300">Award:</span> {data.awardTitle}</p>}
                  {data.achievementType && <p><span className="font-medium text-slate-700 dark:text-slate-300">Type:</span> {data.achievementType}</p>}
                  {data.organizationName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Organization:</span> {data.organizationName}</p>}
                  {data.presentedBy && <p><span className="font-medium text-slate-700 dark:text-slate-300">Presented By:</span> {data.presentedBy}</p>}
                  {data.rankAtAward && <p><span className="font-medium text-slate-700 dark:text-slate-300">Rank:</span> {data.rankAtAward}</p>}
                  {data.unitAtTime && <p><span className="font-medium text-slate-700 dark:text-slate-300">Unit:</span> {data.unitAtTime}</p>}
                  {data.awardDate && <p><span className="font-medium text-slate-700 dark:text-slate-300">Date:</span> {data.awardDate}</p>}
                  {data.location && <p><span className="font-medium text-slate-700 dark:text-slate-300">Location:</span> {data.location}</p>}
                  {data.referenceNumber && <p><span className="font-medium text-slate-700 dark:text-slate-300">Reference:</span> {data.referenceNumber}</p>}
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
