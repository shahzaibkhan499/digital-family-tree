'use client';

import React, { useState, useMemo } from 'react';
import {
  Scale, BookOpen, AlertTriangle, Building2, FileText, Baby, DollarSign, Image, FolderOpen, Eye,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const CUSTODY_ARRANGEMENT_OPTIONS = [
  { value: 'Joint', label: 'Joint Custody' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Father', label: 'Father' },
  { value: 'Other', label: 'Other' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <Scale className="h-5 w-5" />, description: 'Basic event info', fields: ['title', 'date', 'location'], required: true },
  { id: 'marriageRef', title: 'Marriage Reference', icon: <BookOpen className="h-5 w-5" />, description: 'Original marriage details', fields: ['originalMarriageDate', 'originalMarriageLocation', 'spouseName'] },
  { id: 'reason', title: 'Reason', icon: <AlertTriangle className="h-5 w-5" />, description: 'Reason for divorce', fields: ['divorceReason', 'separationDate', 'isMutual'] },
  { id: 'court', title: 'Court Details', icon: <Building2 className="h-5 w-5" />, description: 'Court and case info', fields: ['courtName', 'judgeName', 'caseNumber', 'filingDate'] },
  { id: 'legal', title: 'Legal Documents', icon: <FileText className="h-5 w-5" />, description: 'Decree and custody orders', fields: ['hasDecree', 'decreeNumber', 'hasCustodyOrder', 'custodyDetails'] },
  { id: 'children', title: 'Children', icon: <Baby className="h-5 w-5" />, description: 'Child custody and visitation', fields: ['childrenCount', 'custodyArrangement', 'visitationDetails'] },
  { id: 'financial', title: 'Financial', icon: <DollarSign className="h-5 w-5" />, description: 'Assets, alimony, and support', fields: ['assetDivision', 'alimonyDetails', 'childSupportDetails'] },
  { id: 'media', title: 'Media', icon: <Image className="h-5 w-5" />, description: 'Related photos and videos', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Legal documents', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface Props {
  eventType?: string;
  onComplete?: () => void;
}

export default function DivorceEventForm({ eventType, onComplete }: Props) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: 'Divorce Finalization',
    date: '',
    location: '',
    originalMarriageDate: '',
    originalMarriageLocation: '',
    spouseName: '',
    divorceReason: '',
    separationDate: '',
    isMutual: false,
    courtName: '',
    judgeName: '',
    caseNumber: '',
    filingDate: '',
    hasDecree: false,
    decreeNumber: '',
    hasCustodyOrder: false,
    custodyDetails: '',
    childrenCount: '',
    custodyArrangement: '',
    visitationDetails: '',
    assetDivision: '',
    alimonyDetails: '',
    childSupportDetails: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'ONLY_ME',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'DIVORCE',
    title: data.title,
    description: data.spouseName ? `Divorce finalization with ${data.spouseName}` : '',
    date: data.date ? new Date(data.date).toISOString() : undefined,
    location: data.location,
    visibility: data.visibility,
    info: {
      originalMarriageDate: data.originalMarriageDate,
      originalMarriageLocation: data.originalMarriageLocation,
      spouseName: data.spouseName,
      divorceReason: data.divorceReason,
      separationDate: data.separationDate,
      isMutual: data.isMutual,
      courtName: data.courtName,
      judgeName: data.judgeName,
      caseNumber: data.caseNumber,
      filingDate: data.filingDate,
      hasDecree: data.hasDecree,
      decreeNumber: data.decreeNumber,
      hasCustodyOrder: data.hasCustodyOrder,
      custodyDetails: data.custodyDetails,
      childrenCount: data.childrenCount,
      custodyArrangement: data.custodyArrangement,
      visitationDetails: data.visitationDetails,
      assetDivision: data.assetDivision,
      alimonyDetails: data.alimonyDetails,
      childSupportDetails: data.childSupportDetails,
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
    if (data.spouseName) score += 10;
    if (data.divorceReason) score += 5;
    if (data.courtName) score += 10;
    if (data.caseNumber) score += 5;
    if (data.custodyArrangement) score += 5;
    if (data.childrenCount) score += 5;
    if (data.assetDivision) score += 5;
    if (data.hasDecree) score += 10;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Divorce Event"
      subtitle="Record a divorce finalization"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'DIVORCE'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Divorce Finalization" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Divorce Date" required value={data.date} onChange={(v) => update('date', v)} />
                <TextInput label="Location (Court)" placeholder="e.g. Family Court, Islamabad" value={data.location} onChange={(v) => update('location', v)} />
              </div>
            </div>
          )}

          {activeSection === 'marriageRef' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Original Marriage Date" value={data.originalMarriageDate} onChange={(v) => update('originalMarriageDate', v)} />
                <TextInput label="Original Marriage Location" placeholder="e.g. Karachi, Pakistan" value={data.originalMarriageLocation} onChange={(v) => update('originalMarriageLocation', v)} />
              </div>
              <TextInput label="Spouse Name" placeholder="e.g. Ahmed Khan" value={data.spouseName} onChange={(v) => update('spouseName', v)} />
            </div>
          )}

          {activeSection === 'reason' && (
            <div className="space-y-4">
              <TextArea label="Divorce Reason" placeholder="Describe the reason for divorce" value={data.divorceReason} onChange={(v) => update('divorceReason', v)} rows={4} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Separation Date" value={data.separationDate} onChange={(v) => update('separationDate', v)} />
                <div className="flex items-center pt-6">
                  <Toggle label="Mutual Consent" checked={data.isMutual} onChange={(v) => update('isMutual', v)} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'court' && (
            <div className="space-y-4">
              <TextInput label="Court Name" placeholder="e.g. Family Court Lahore" value={data.courtName} onChange={(v) => update('courtName', v)} />
              <TextInput label="Judge Name" placeholder="e.g. Justice Sara Malik" value={data.judgeName} onChange={(v) => update('judgeName', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Case Number" placeholder="e.g. FC-2025-00123" value={data.caseNumber} onChange={(v) => update('caseNumber', v)} />
                <DateInput label="Filing Date" value={data.filingDate} onChange={(v) => update('filingDate', v)} />
              </div>
            </div>
          )}

          {activeSection === 'legal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Toggle label="Decree Issued" checked={data.hasDecree} onChange={(v) => update('hasDecree', v)} />
                {data.hasDecree && (
                  <TextInput label="Decree Number" placeholder="e.g. DEC-2025-456" value={data.decreeNumber} onChange={(v) => update('decreeNumber', v)} />
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Toggle label="Custody Order Issued" checked={data.hasCustodyOrder} onChange={(v) => update('hasCustodyOrder', v)} />
              </div>
              {data.hasCustodyOrder && (
                <TextArea label="Custody Details" placeholder="Describe the custody order" value={data.custodyDetails} onChange={(v) => update('custodyDetails', v)} rows={3} />
              )}
            </div>
          )}

          {activeSection === 'children' && (
            <div className="space-y-4">
              <TextInput label="Number of Children" type="number" placeholder="e.g. 2" value={data.childrenCount} onChange={(v) => update('childrenCount', v)} />
              <Select label="Custody Arrangement" options={CUSTODY_ARRANGEMENT_OPTIONS} value={data.custodyArrangement} onChange={(v) => update('custodyArrangement', v)} placeholder="Select arrangement" />
              <TextArea label="Visitation Details" placeholder="Describe visitation schedule and arrangements" value={data.visitationDetails} onChange={(v) => update('visitationDetails', v)} rows={4} />
            </div>
          )}

          {activeSection === 'financial' && (
            <div className="space-y-4">
              <TextArea label="Asset Division" placeholder="Describe how assets were divided" value={data.assetDivision} onChange={(v) => update('assetDivision', v)} rows={4} />
              <TextArea label="Alimony Details" placeholder="Alimony/spousal support details" value={data.alimonyDetails} onChange={(v) => update('alimonyDetails', v)} rows={3} />
              <TextArea label="Child Support Details" placeholder="Child support payment details" value={data.childSupportDetails} onChange={(v) => update('childSupportDetails', v)} rows={3} />
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
                  {data.location && <p><span className="font-medium text-slate-700 dark:text-slate-300">Court:</span> {data.location}</p>}
                  {data.spouseName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Spouse:</span> {data.spouseName}</p>}
                  {data.courtName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Court Name:</span> {data.courtName}</p>}
                  {data.caseNumber && <p><span className="font-medium text-slate-700 dark:text-slate-300">Case #:</span> {data.caseNumber}</p>}
                  {data.custodyArrangement && <p><span className="font-medium text-slate-700 dark:text-slate-300">Custody:</span> {data.custodyArrangement}</p>}
                  {data.childrenCount && <p><span className="font-medium text-slate-700 dark:text-slate-300">Children:</span> {data.childrenCount}</p>}
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
