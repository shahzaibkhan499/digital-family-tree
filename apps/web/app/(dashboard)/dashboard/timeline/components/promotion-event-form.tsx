'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp, Briefcase, Award, ClipboardCheck, DollarSign, FileCheck, Image, FolderOpen, Eye,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const PROMOTION_TYPES = [
  { value: 'Merit', label: 'Merit' },
  { value: 'Seniority', label: 'Seniority' },
  { value: 'Special', label: 'Special' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Acting', label: 'Acting' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <TrendingUp className="h-5 w-5" />, description: 'Basic promotion info', fields: ['title', 'date', 'location'], required: true },
  { id: 'previous', title: 'Previous Position', icon: <Briefcase className="h-5 w-5" />, description: 'Prior role details', fields: ['previousTitle', 'previousDepartment', 'previousLevel', 'previousDuration'] },
  { id: 'new', title: 'New Position', icon: <Award className="h-5 w-5" />, description: 'New role details', fields: ['newTitle', 'newDepartment', 'newLevel', 'newResponsibilities'] },
  { id: 'details', title: 'Promotion Details', icon: <ClipboardCheck className="h-5 w-5" />, description: 'Promotion specifics', fields: ['promotionType', 'promotedBy', 'reportingTo', 'approvalDate'] },
  { id: 'compensation', title: 'Compensation Change', icon: <DollarSign className="h-5 w-5" />, description: 'Salary and benefits', fields: ['newSalary', 'currency', 'salaryChange'] },
  { id: 'certificate', title: 'Certificate & Letter', icon: <FileCheck className="h-5 w-5" />, description: 'Official documents', fields: ['hasAppointmentLetter', 'hasCertificate', 'certificateNumber'] },
  { id: 'media', title: 'Media', icon: <Image className="h-5 w-5" />, description: 'Photos and videos', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Promotion and certificate docs', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface PromotionEventFormProps {
  eventType?: string;
  onComplete?: () => void;
}

export default function PromotionEventForm({ eventType, onComplete }: PromotionEventFormProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: 'Career Promotion',
    date: '',
    location: '',
    previousTitle: '',
    previousDepartment: '',
    previousLevel: '',
    previousDuration: '',
    newTitle: '',
    newDepartment: '',
    newLevel: '',
    newResponsibilities: '',
    promotionType: '',
    promotedBy: '',
    reportingTo: '',
    approvalDate: '',
    newSalary: '',
    currency: 'USD',
    salaryChange: '',
    hasAppointmentLetter: false,
    hasCertificate: false,
    certificateNumber: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'PROMOTION',
    title: data.title,
    description: data.newTitle ? `Promoted to ${data.newTitle}` : '',
    date: data.date ? new Date(data.date).toISOString() : undefined,
    location: data.location,
    visibility: data.visibility,
    info: {
      previousTitle: data.previousTitle,
      previousDepartment: data.previousDepartment,
      previousLevel: data.previousLevel,
      previousDuration: data.previousDuration,
      newTitle: data.newTitle,
      newDepartment: data.newDepartment,
      newLevel: data.newLevel,
      newResponsibilities: data.newResponsibilities,
      promotionType: data.promotionType,
      promotedBy: data.promotedBy,
      reportingTo: data.reportingTo,
      approvalDate: data.approvalDate,
      newSalary: data.newSalary,
      currency: data.currency,
      salaryChange: data.salaryChange,
      hasAppointmentLetter: data.hasAppointmentLetter,
      hasCertificate: data.hasCertificate,
      certificateNumber: data.certificateNumber,
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
    if (data.previousTitle) score += 10;
    if (data.newTitle) score += 15;
    if (data.promotionType) score += 10;
    if (data.newSalary) score += 5;
    if (data.location) score += 5;
    if (data.promotedBy) score += 5;
    if (data.approvalDate) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Promotion Event"
      subtitle="Record a career promotion or advancement"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'PROMOTION'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Career Promotion" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Effective Date" required value={data.date} onChange={(v) => update('date', v)} />
                <TextInput label="Location" placeholder="e.g. Company HQ" value={data.location} onChange={(v) => update('location', v)} />
              </div>
            </div>
          )}

          {activeSection === 'previous' && (
            <div className="space-y-4">
              <TextInput label="Previous Title" placeholder="e.g. Junior Developer" value={data.previousTitle} onChange={(v) => update('previousTitle', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Previous Department" placeholder="e.g. Engineering" value={data.previousDepartment} onChange={(v) => update('previousDepartment', v)} />
                <TextInput label="Previous Level" placeholder="e.g. L3" value={data.previousLevel} onChange={(v) => update('previousLevel', v)} />
              </div>
              <TextInput label="Duration in Previous Role" placeholder="e.g. 2 years" value={data.previousDuration} onChange={(v) => update('previousDuration', v)} />
            </div>
          )}

          {activeSection === 'new' && (
            <div className="space-y-4">
              <TextInput label="New Title" placeholder="e.g. Senior Developer" value={data.newTitle} onChange={(v) => update('newTitle', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="New Department" placeholder="e.g. Engineering" value={data.newDepartment} onChange={(v) => update('newDepartment', v)} />
                <TextInput label="New Level" placeholder="e.g. L4" value={data.newLevel} onChange={(v) => update('newLevel', v)} />
              </div>
              <TextArea label="New Responsibilities" placeholder="Describe new responsibilities and scope" value={data.newResponsibilities} onChange={(v) => update('newResponsibilities', v)} rows={4} />
            </div>
          )}

          {activeSection === 'details' && (
            <div className="space-y-4">
              <Select label="Promotion Type" options={PROMOTION_TYPES} value={data.promotionType} onChange={(v) => update('promotionType', v)} placeholder="Select type" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Promoted By" placeholder="e.g. John Smith" value={data.promotedBy} onChange={(v) => update('promotedBy', v)} />
                <TextInput label="Reporting To" placeholder="e.g. Jane Doe" value={data.reportingTo} onChange={(v) => update('reportingTo', v)} />
              </div>
              <DateInput label="Approval Date" value={data.approvalDate} onChange={(v) => update('approvalDate', v)} />
            </div>
          )}

          {activeSection === 'compensation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="New Salary" type="number" placeholder="e.g. 95000" value={data.newSalary} onChange={(v) => update('newSalary', v)} />
                <Select label="Currency" options={CURRENCIES} value={data.currency} onChange={(v) => update('currency', v)} />
              </div>
              <TextArea label="Salary Change Notes" placeholder="Describe changes in compensation or benefits" value={data.salaryChange} onChange={(v) => update('salaryChange', v)} rows={3} />
            </div>
          )}

          {activeSection === 'certificate' && (
            <div className="space-y-4">
              <Toggle label="Has Appointment Letter" checked={data.hasAppointmentLetter} onChange={(v) => update('hasAppointmentLetter', v)} />
              <Toggle label="Has Promotion Certificate" checked={data.hasCertificate} onChange={(v) => update('hasCertificate', v)} />
              <TextInput label="Certificate Number" placeholder="e.g. PROMO-2024-001" value={data.certificateNumber} onChange={(v) => update('certificateNumber', v)} />
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
                  {data.previousTitle && <p><span className="font-medium text-slate-700 dark:text-slate-300">From:</span> {data.previousTitle}</p>}
                  {data.newTitle && <p><span className="font-medium text-slate-700 dark:text-slate-300">To:</span> {data.newTitle}</p>}
                  {data.promotionType && <p><span className="font-medium text-slate-700 dark:text-slate-300">Type:</span> {data.promotionType}</p>}
                  {data.newSalary && <p><span className="font-medium text-slate-700 dark:text-slate-300">Salary:</span> {data.currency} {data.newSalary}</p>}
                  {data.date && <p><span className="font-medium text-slate-700 dark:text-slate-300">Date:</span> {data.date}</p>}
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
