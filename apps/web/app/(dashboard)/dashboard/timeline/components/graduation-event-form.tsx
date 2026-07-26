'use client';

import React, { useState, useMemo } from 'react';
import {
  GraduationCap, Building2, Award, BarChart3, CalendarCheck, FileCheck, Image, FolderOpen, Eye,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const INSTITUTE_TYPES = [
  { value: 'University', label: 'University' },
  { value: 'College', label: 'College' },
  { value: 'School', label: 'School' },
  { value: 'Institute', label: 'Institute' },
  { value: 'Academy', label: 'Academy' },
];

const DEGREES = [
  { value: 'PhD', label: 'PhD' },
  { value: 'Masters', label: 'Masters' },
  { value: 'Bachelors', label: 'Bachelors' },
  { value: 'Diploma', label: 'Diploma' },
  { value: 'Certificate', label: 'Certificate' },
  { value: 'Associate', label: 'Associate' },
];

const RESULT_STATUSES = [
  { value: 'First Class', label: 'First Class' },
  { value: 'Second Class', label: 'Second Class' },
  { value: 'Third Class', label: 'Third Class' },
  { value: 'Pass', label: 'Pass' },
  { value: 'With Distinction', label: 'With Distinction' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <GraduationCap className="h-5 w-5" />, description: 'Basic graduation info', fields: ['title', 'date', 'location'], required: true },
  { id: 'institution', title: 'Institute', icon: <Building2 className="h-5 w-5" />, description: 'Institution details', fields: ['instituteName', 'instituteType', 'department', 'city'] },
  { id: 'degree', title: 'Degree & Field', icon: <Award className="h-5 w-5" />, description: 'Degree and study details', fields: ['degree', 'fieldOfStudy', 'specialization'] },
  { id: 'result', title: 'Result', icon: <BarChart3 className="h-5 w-5" />, description: 'Academic performance', fields: ['resultStatus', 'cgpa', 'totalMarks', 'obtainedMarks', 'percentage'] },
  { id: 'convocation', title: 'Convocation', icon: <CalendarCheck className="h-5 w-5" />, description: 'Convocation ceremony details', fields: ['convocationDate', 'convocationVenue', 'chiefGuest', 'honorsReceived'] },
  { id: 'certificates', title: 'Certificates', icon: <FileCheck className="h-5 w-5" />, description: 'Certificate and transcript info', fields: ['degreeCertificateNumber', 'transcriptNumber', 'hasProvisional'] },
  { id: 'media', title: 'Photos & Videos', icon: <Image className="h-5 w-5" />, description: 'Photos and videos', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Degree and transcript documents', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface GraduationEventFormProps {
  eventType?: string;
  onComplete?: () => void;
}

export default function GraduationEventForm({ eventType, onComplete }: GraduationEventFormProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: 'Graduation Ceremony',
    date: '',
    location: '',
    instituteName: '',
    instituteType: '',
    department: '',
    city: '',
    degree: '',
    fieldOfStudy: '',
    specialization: '',
    resultStatus: '',
    cgpa: '',
    totalMarks: '',
    obtainedMarks: '',
    percentage: '',
    convocationDate: '',
    convocationVenue: '',
    chiefGuest: '',
    honorsReceived: false,
    degreeCertificateNumber: '',
    transcriptNumber: '',
    hasProvisional: false,
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'GRADUATION',
    title: data.title,
    description: data.instituteName ? `${data.instituteName} - ${data.degree || 'Graduation'}` : '',
    date: data.date ? new Date(data.date).toISOString() : undefined,
    location: data.location,
    visibility: data.visibility,
    info: {
      instituteName: data.instituteName,
      instituteType: data.instituteType,
      department: data.department,
      city: data.city,
      degree: data.degree,
      fieldOfStudy: data.fieldOfStudy,
      specialization: data.specialization,
      resultStatus: data.resultStatus,
      cgpa: data.cgpa,
      totalMarks: data.totalMarks,
      obtainedMarks: data.obtainedMarks,
      percentage: data.percentage,
      convocationDate: data.convocationDate,
      convocationVenue: data.convocationVenue,
      chiefGuest: data.chiefGuest,
      honorsReceived: data.honorsReceived,
      degreeCertificateNumber: data.degreeCertificateNumber,
      transcriptNumber: data.transcriptNumber,
      hasProvisional: data.hasProvisional,
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
    if (data.instituteName) score += 15;
    if (data.degree) score += 15;
    if (data.fieldOfStudy) score += 10;
    if (data.resultStatus) score += 5;
    if (data.cgpa) score += 5;
    if (data.convocationDate) score += 5;
    if (data.location) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Graduation Event"
      subtitle="Record a graduation ceremony or academic milestone"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'GRADUATION'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Graduation Ceremony" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Date" required value={data.date} onChange={(v) => update('date', v)} />
                <TextInput label="Location" placeholder="e.g. University Auditorium" value={data.location} onChange={(v) => update('location', v)} />
              </div>
            </div>
          )}

          {activeSection === 'institution' && (
            <div className="space-y-4">
              <TextInput label="Institute Name" placeholder="e.g. MIT" value={data.instituteName} onChange={(v) => update('instituteName', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select label="Institute Type" options={INSTITUTE_TYPES} value={data.instituteType} onChange={(v) => update('instituteType', v)} placeholder="Select type" />
                <TextInput label="Department" placeholder="e.g. Computer Science" value={data.department} onChange={(v) => update('department', v)} />
              </div>
              <TextInput label="City" placeholder="e.g. Cambridge" value={data.city} onChange={(v) => update('city', v)} />
            </div>
          )}

          {activeSection === 'degree' && (
            <div className="space-y-4">
              <Select label="Degree" options={DEGREES} value={data.degree} onChange={(v) => update('degree', v)} placeholder="Select degree" />
              <TextInput label="Field of Study" placeholder="e.g. Computer Science" value={data.fieldOfStudy} onChange={(v) => update('fieldOfStudy', v)} />
              <TextInput label="Specialization" placeholder="e.g. Artificial Intelligence" value={data.specialization} onChange={(v) => update('specialization', v)} />
            </div>
          )}

          {activeSection === 'result' && (
            <div className="space-y-4">
              <Select label="Result Status" options={RESULT_STATUSES} value={data.resultStatus} onChange={(v) => update('resultStatus', v)} placeholder="Select result" />
              <TextInput label="CGPA" placeholder="e.g. 3.8" value={data.cgpa} onChange={(v) => update('cgpa', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Total Marks" type="number" placeholder="e.g. 1000" value={data.totalMarks} onChange={(v) => update('totalMarks', v)} />
                <TextInput label="Obtained Marks" type="number" placeholder="e.g. 850" value={data.obtainedMarks} onChange={(v) => update('obtainedMarks', v)} />
              </div>
              <TextInput label="Percentage" placeholder="e.g. 85%" value={data.percentage} onChange={(v) => update('percentage', v)} />
            </div>
          )}

          {activeSection === 'convocation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Convocation Date" value={data.convocationDate} onChange={(v) => update('convocationDate', v)} />
                <TextInput label="Convocation Venue" placeholder="e.g. Main Auditorium" value={data.convocationVenue} onChange={(v) => update('convocationVenue', v)} />
              </div>
              <TextInput label="Chief Guest" placeholder="e.g. Dr. Jane Smith" value={data.chiefGuest} onChange={(v) => update('chiefGuest', v)} />
              <Toggle label="Honors Received" checked={data.honorsReceived} onChange={(v) => update('honorsReceived', v)} />
            </div>
          )}

          {activeSection === 'certificates' && (
            <div className="space-y-4">
              <TextInput label="Degree Certificate Number" placeholder="e.g. CERT-2024-001" value={data.degreeCertificateNumber} onChange={(v) => update('degreeCertificateNumber', v)} />
              <TextInput label="Transcript Number" placeholder="e.g. TRAN-2024-001" value={data.transcriptNumber} onChange={(v) => update('transcriptNumber', v)} />
              <Toggle label="Has Provisional Certificate" checked={data.hasProvisional} onChange={(v) => update('hasProvisional', v)} />
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
                  {data.instituteName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Institute:</span> {data.instituteName}</p>}
                  {data.degree && <p><span className="font-medium text-slate-700 dark:text-slate-300">Degree:</span> {data.degree}</p>}
                  {data.fieldOfStudy && <p><span className="font-medium text-slate-700 dark:text-slate-300">Field:</span> {data.fieldOfStudy}</p>}
                  {data.resultStatus && <p><span className="font-medium text-slate-700 dark:text-slate-300">Result:</span> {data.resultStatus}</p>}
                  {data.cgpa && <p><span className="font-medium text-slate-700 dark:text-slate-300">CGPA:</span> {data.cgpa}</p>}
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
