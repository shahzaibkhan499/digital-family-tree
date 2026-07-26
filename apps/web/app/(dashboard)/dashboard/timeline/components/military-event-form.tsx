'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, ShieldCheck, FileText, Award, Heart, AlertTriangle,
  Users, Image, FolderOpen, Eye,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle, RadioGroup } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const BRANCHES = [
  { value: 'Army', label: 'Army' },
  { value: 'Navy', label: 'Navy' },
  { value: 'Air Force', label: 'Air Force' },
  { value: 'Marines', label: 'Marines' },
  { value: 'Coast Guard', label: 'Coast Guard' },
  { value: 'Space Force', label: 'Space Force' },
];

const DISCHARGE_TYPES = [
  { value: 'Honorable', label: 'Honorable' },
  { value: 'General', label: 'General' },
  { value: 'Other Than Honorable', label: 'Other Than Honorable' },
  { value: 'Dishonorable', label: 'Dishonorable' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <Shield className="h-5 w-5" />, description: 'Basic event information', fields: ['title', 'enlistmentDate', 'dischargeDate', 'location'], required: true },
  { id: 'service', title: 'Service Details', icon: <ShieldCheck className="h-5 w-5" />, description: 'Branch and rank information', fields: ['branch', 'rank', 'serviceNumber'] },
  { id: 'assignment', title: 'Assignment', icon: <Users className="h-5 w-5" />, description: 'Unit and duty information', fields: ['unit', 'base', 'theater', 'specialty', 'mosCode'] },
  { id: 'awards', title: 'Awards & Commendations', icon: <Award className="h-5 w-5" />, description: 'Medals, commendations, and decorations', fields: ['medals', 'commendations', 'decorations'] },
  { id: 'health', title: 'Health', icon: <Heart className="h-5 w-5" />, description: 'Injuries and disability information', fields: ['injuries', 'disabilityRating'] },
  { id: 'separation', title: 'Separation', icon: <AlertTriangle className="h-5 w-5" />, description: 'Discharge details', fields: ['dischargeType', 'dischargeReason'] },
  { id: 'media', title: 'Media', icon: <Image className="h-5 w-5" />, description: 'Photos and videos', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Service records and certificates', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface MilitaryEventFormProps {
  eventType?: string;
  onComplete?: () => void;
}

export default function MilitaryEventForm({ eventType, onComplete }: MilitaryEventFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: '',
    enlistmentDate: '',
    dischargeDate: '',
    location: '',
    branch: '',
    rank: '',
    serviceNumber: '',
    unit: '',
    base: '',
    theater: '',
    specialty: '',
    mosCode: '',
    medals: '',
    commendations: '',
    decorations: '',
    injuries: '',
    disabilityRating: '',
    dischargeType: '',
    dischargeReason: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.timeline.create({
        eventType: eventType || 'MILITARY_SERVICE',
        title: data.title,
        description: [
          data.branch && `Branch: ${data.branch}`,
          data.rank && `Rank: ${data.rank}`,
          data.serviceNumber && `Service #: ${data.serviceNumber}`,
          data.unit && `Unit: ${data.unit}`,
          data.base && `Base: ${data.base}`,
        ].filter(Boolean).join('\n'),
        date: data.enlistmentDate ? new Date(data.enlistmentDate).toISOString() : undefined,
        location: data.location,
        visibility: data.visibility,
        info: {
          enlistmentDate: data.enlistmentDate,
          dischargeDate: data.dischargeDate,
          branch: data.branch,
          rank: data.rank,
          serviceNumber: data.serviceNumber,
          unit: data.unit,
          base: data.base,
          theater: data.theater,
          specialty: data.specialty,
          mosCode: data.mosCode,
          medals: data.medals,
          commendations: data.commendations,
          decorations: data.decorations,
          injuries: data.injuries,
          disabilityRating: data.disabilityRating,
          dischargeType: data.dischargeType,
          dischargeReason: data.dischargeReason,
        },
        media: data.media.filter((m: MediaItem) => m.url),
        documents: data.documents,
      });
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
      await api.timeline.create({
        eventType: eventType || 'MILITARY_SERVICE',
        title: data.title,
        description: [
          data.branch && `Branch: ${data.branch}`,
          data.rank && `Rank: ${data.rank}`,
        ].filter(Boolean).join('\n'),
        date: data.enlistmentDate ? new Date(data.enlistmentDate).toISOString() : undefined,
        location: data.location,
        status: 'PUBLISHED',
        visibility: data.visibility,
        info: {
          enlistmentDate: data.enlistmentDate,
          dischargeDate: data.dischargeDate,
          branch: data.branch,
          rank: data.rank,
          serviceNumber: data.serviceNumber,
          unit: data.unit,
          base: data.base,
          theater: data.theater,
          specialty: data.specialty,
          mosCode: data.mosCode,
          medals: data.medals,
          commendations: data.commendations,
          decorations: data.decorations,
          injuries: data.injuries,
          disabilityRating: data.disabilityRating,
          dischargeType: data.dischargeType,
          dischargeReason: data.dischargeReason,
        },
        media: data.media.filter((m: MediaItem) => m.url),
        documents: data.documents,
      });
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
    if (data.enlistmentDate) score += 10;
    if (data.branch) score += 15;
    if (data.rank) score += 10;
    if (data.unit) score += 5;
    if (data.dischargeType) score += 10;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    if (data.visibility) score += 5;
    if (data.location) score += 5;
    if (data.medals) score += 5;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Military Service Event"
      subtitle="Record military service details"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'MILITARY_SERVICE'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Service of John Doe" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Enlistment Date" required value={data.enlistmentDate} onChange={(v) => update('enlistmentDate', v)} />
                <DateInput label="Discharge Date" value={data.dischargeDate} onChange={(v) => update('dischargeDate', v)} />
              </div>
              <TextInput label="Location" placeholder="e.g. Fort Bragg, NC" value={data.location} onChange={(v) => update('location', v)} />
            </div>
          )}

          {activeSection === 'service' && (
            <div className="space-y-4">
              <Select label="Branch" options={BRANCHES} value={data.branch} onChange={(v) => update('branch', v)} placeholder="Select branch" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Rank" placeholder="e.g. Sergeant (E-5)" value={data.rank} onChange={(v) => update('rank', v)} />
                <TextInput label="Service Number" placeholder="e.g. AB12345678" value={data.serviceNumber} onChange={(v) => update('serviceNumber', v)} />
              </div>
            </div>
          )}

          {activeSection === 'assignment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Unit" placeholder="e.g. 1st Infantry Division" value={data.unit} onChange={(v) => update('unit', v)} />
                <TextInput label="Base" placeholder="e.g. Fort Riley, KS" value={data.base} onChange={(v) => update('base', v)} />
              </div>
              <TextInput label="Theater of Operations" placeholder="e.g. Middle East" value={data.theater} onChange={(v) => update('theater', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Specialty" placeholder="e.g. Infantry" value={data.specialty} onChange={(v) => update('specialty', v)} />
                <TextInput label="MOS Code" placeholder="e.g. 11B" value={data.mosCode} onChange={(v) => update('mosCode', v)} />
              </div>
            </div>
          )}

          {activeSection === 'awards' && (
            <div className="space-y-4">
              <TextArea label="Medals" placeholder="e.g. Purple Heart, Bronze Star" value={data.medals} onChange={(v) => update('medals', v)} rows={3} />
              <TextArea label="Commendations" placeholder="e.g. Army Commendation Medal" value={data.commendations} onChange={(v) => update('commendations', v)} rows={3} />
              <TextArea label="Decorations" placeholder="e.g. Combat Infantryman Badge" value={data.decorations} onChange={(v) => update('decorations', v)} rows={3} />
            </div>
          )}

          {activeSection === 'health' && (
            <div className="space-y-4">
              <TextArea label="Injuries" placeholder="Describe any injuries sustained during service" value={data.injuries} onChange={(v) => update('injuries', v)} rows={3} />
              <TextInput label="Disability Rating" placeholder="e.g. 40% VA disability" value={data.disabilityRating} onChange={(v) => update('disabilityRating', v)} />
            </div>
          )}

          {activeSection === 'separation' && (
            <div className="space-y-4">
              <Select label="Discharge Type" options={DISCHARGE_TYPES} value={data.dischargeType} onChange={(v) => update('dischargeType', v)} placeholder="Select discharge type" />
              <TextArea label="Discharge Reason" placeholder="Reason for separation" value={data.dischargeReason} onChange={(v) => update('dischargeReason', v)} rows={3} />
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
                  {data.branch && <p><span className="font-medium text-slate-700 dark:text-slate-300">Branch:</span> {data.branch}</p>}
                  {data.rank && <p><span className="font-medium text-slate-700 dark:text-slate-300">Rank:</span> {data.rank}</p>}
                  {data.enlistmentDate && <p><span className="font-medium text-slate-700 dark:text-slate-300">Enlistment:</span> {data.enlistmentDate}</p>}
                  {data.dischargeDate && <p><span className="font-medium text-slate-700 dark:text-slate-300">Discharge:</span> {data.dischargeDate}</p>}
                  {data.dischargeType && <p><span className="font-medium text-slate-700 dark:text-slate-300">Discharge Type:</span> {data.dischargeType}</p>}
                  {data.unit && <p><span className="font-medium text-slate-700 dark:text-slate-300">Unit:</span> {data.unit}</p>}
                  {data.location && <p><span className="font-medium text-slate-700 dark:text-slate-300">Location:</span> {data.location}</p>}
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
