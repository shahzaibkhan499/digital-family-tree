'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  GraduationCap, Building2, Award, DollarSign, BookOpen,
  Image, FileText, CheckCircle, Calendar, MapPin,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle, RadioGroup } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';

const SECTIONS: FormSection[] = [
  {
    id: 'general',
    title: 'General Information',
    icon: <Calendar className="w-5 h-5" />,
    description: 'Event title, dates, and location',
    required: true,
    fields: ['title', 'startDate'],
  },
  {
    id: 'institution',
    title: 'Institution',
    icon: <Building2 className="w-5 h-5" />,
    description: 'School, college, or university details',
    required: true,
    fields: ['institutionName'],
  },
  {
    id: 'academic',
    title: 'Academic Details',
    icon: <Award className="w-5 h-5" />,
    description: 'Degree, field of study, GPA, and honors',
    fields: [],
  },
  {
    id: 'financial',
    title: 'Financial',
    icon: <DollarSign className="w-5 h-5" />,
    description: 'Scholarships and tuition costs',
    fields: [],
  },
  {
    id: 'activities',
    title: 'Activities',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Extracurriculars, clubs, and achievements',
    fields: [],
  },
  {
    id: 'media',
    title: 'Media',
    icon: <Image className="w-5 h-5" />,
    description: 'Photos and visual memories',
    fields: [],
  },
  {
    id: 'documents',
    title: 'Documents',
    icon: <FileText className="w-5 h-5" />,
    description: 'Degrees, transcripts, and certificates',
    fields: [],
  },
  {
    id: 'review',
    title: 'Review & Publish',
    icon: <CheckCircle className="w-5 h-5" />,
    description: 'Summary and publish',
    fields: ['title'],
  },
];

const INSTITUTION_TYPES = [
  { value: 'School', label: 'School' },
  { value: 'College', label: 'College' },
  { value: 'University', label: 'University' },
  { value: 'Online', label: 'Online' },
];

const GPA_SCALES = [
  { value: '4.0', label: '4.0' },
  { value: '5.0', label: '5.0' },
  { value: '10.0', label: '10.0' },
  { value: '100', label: '100' },
];

function getDefaultData() {
  return {
    title: '',
    startDate: '',
    endDate: '',
    graduationDate: '',
    location: '',
    institutionName: '',
    institutionType: 'University',
    institutionLocation: '',
    degree: '',
    fieldOfStudy: '',
    gpa: '',
    gpaScale: '4.0',
    honors: '',
    thesis: '',
    hasScholarship: false,
    scholarshipDetails: '',
    tuitionCost: '',
    extracurriculars: '',
    clubs: '',
    achievements: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
    status: 'DRAFT',
  };
}

export default function EducationEventForm({
  eventType,
  onComplete,
}: {
  eventType: string;
  onComplete: () => void;
}) {
  const [data, setData] = useState(getDefaultData);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [initialData] = useState(() => JSON.stringify(getDefaultData()));

  const isDirty = useMemo(
    () => JSON.stringify(data) !== initialData,
    [data, initialData],
  );

  const update = useCallback(
    (patch: Record<string, any>) => setData((prev) => ({ ...prev, ...patch })),
    [],
  );

  const completion = useMemo(() => {
    let score = 0;
    if (data.title) score += 15;
    if (data.startDate) score += 10;
    if (data.institutionName) score += 15;
    if (data.degree) score += 10;
    if (data.fieldOfStudy) score += 5;
    if (data.gpa) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    if (data.visibility) score += 5;
    if (data.extracurriculars || data.clubs || data.achievements) score += 5;
    if (data.graduationDate) score += 5;
    if (data.location || data.institutionLocation) score += 5;
    return Math.min(100, score);
  }, [data]);

  const buildPayload = useCallback(
    (statusOverride?: string) => ({
      eventType,
      title: data.title || `${data.degree || 'Education'} at ${data.institutionName || 'Institution'}`,
      description: '',
      date: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      location: data.location || data.institutionLocation,
      venue: data.institutionName,
      visibility: data.visibility,
      status: statusOverride || data.status,
      media: data.media.filter((m) => m.url),
      documents: data.documents,
      metadata: {
        startDate: data.startDate,
        endDate: data.endDate,
        graduationDate: data.graduationDate,
        institutionName: data.institutionName,
        institutionType: data.institutionType,
        institutionLocation: data.institutionLocation,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        gpa: data.gpa,
        gpaScale: data.gpaScale,
        honors: data.honors,
        thesis: data.thesis,
        hasScholarship: data.hasScholarship,
        scholarshipDetails: data.scholarshipDetails,
        tuitionCost: data.tuitionCost,
        extracurriculars: data.extracurriculars,
        clubs: data.clubs,
        achievements: data.achievements,
      },
    }),
    [data, eventType],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await api.timeline.create(buildPayload('DRAFT'));
      setLastSaved(new Date());
      onComplete();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Save failed:', err);
      }
    } finally {
      setSaving(false);
    }
  }, [buildPayload, onComplete]);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      await api.timeline.create(buildPayload('PUBLISHED'));
      onComplete();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Publish failed:', err);
      }
    } finally {
      setPublishing(false);
    }
  }, [buildPayload, onComplete]);

  return (
    <AccordionFormLayout
      title="Education Event"
      subtitle={`${eventType === 'GRADUATION' ? 'Graduation' : 'Education'} event details`}
      sections={SECTIONS}
      data={data}
      onChange={update}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      publishing={publishing}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label="Event Title"
                placeholder="e.g., Bachelor's in Computer Science"
                value={data.title}
                onChange={(v) => update({ title: v })}
                required
                className="sm:col-span-2"
              />
              <DateInput
                label="Start Date"
                value={data.startDate}
                onChange={(v) => update({ startDate: v })}
                required
              />
              <DateInput
                label="End Date"
                value={data.endDate}
                onChange={(v) => update({ endDate: v })}
              />
              <DateInput
                label="Graduation Date"
                value={data.graduationDate}
                onChange={(v) => update({ graduationDate: v })}
              />
              <TextInput
                label="Location"
                placeholder="e.g., Cambridge, MA"
                value={data.location}
                onChange={(v) => update({ location: v })}
                type="text"
              />
            </div>
          )}

          {activeSection === 'institution' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label="Institution Name"
                placeholder="e.g., Massachusetts Institute of Technology"
                value={data.institutionName}
                onChange={(v) => update({ institutionName: v })}
                required
                className="sm:col-span-2"
              />
              <Select
                label="Institution Type"
                options={INSTITUTION_TYPES}
                value={data.institutionType}
                onChange={(v) => update({ institutionType: v })}
              />
              <TextInput
                label="Institution Location"
                placeholder="e.g., Cambridge, Massachusetts"
                value={data.institutionLocation}
                onChange={(v) => update({ institutionLocation: v })}
              />
            </div>
          )}

          {activeSection === 'academic' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label="Degree"
                placeholder="e.g., Bachelor of Science"
                value={data.degree}
                onChange={(v) => update({ degree: v })}
              />
              <TextInput
                label="Field of Study"
                placeholder="e.g., Computer Science"
                value={data.fieldOfStudy}
                onChange={(v) => update({ fieldOfStudy: v })}
              />
              <TextInput
                label="GPA"
                placeholder="e.g., 3.85"
                value={data.gpa}
                onChange={(v) => update({ gpa: v })}
                type="text"
              />
              <Select
                label="GPA Scale"
                options={GPA_SCALES}
                value={data.gpaScale}
                onChange={(v) => update({ gpaScale: v })}
              />
              <TextInput
                label="Honors"
                placeholder="e.g., Magna Cum Laude"
                value={data.honors}
                onChange={(v) => update({ honors: v })}
                className="sm:col-span-2"
              />
              <TextArea
                label="Thesis / Capstone"
                placeholder="Title and brief description of your thesis or capstone project..."
                value={data.thesis}
                onChange={(v) => update({ thesis: v })}
                rows={3}
                className="sm:col-span-2"
              />
            </div>
          )}

          {activeSection === 'financial' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Toggle
                label="Received Scholarship"
                description="Toggle if you received a scholarship during this education"
                checked={data.hasScholarship}
                onChange={(v) => update({ hasScholarship: v })}
                className="sm:col-span-2"
              />
              {data.hasScholarship && (
                <TextArea
                  label="Scholarship Details"
                  placeholder="Name, amount, and criteria for the scholarship..."
                  value={data.scholarshipDetails}
                  onChange={(v) => update({ scholarshipDetails: v })}
                  rows={3}
                  className="sm:col-span-2"
                />
              )}
              <TextInput
                label="Tuition Cost"
                placeholder="e.g., 45000"
                value={data.tuitionCost}
                onChange={(v) => update({ tuitionCost: v })}
                type="number"
              />
            </div>
          )}

          {activeSection === 'activities' && (
            <div className="grid grid-cols-1 gap-4">
              <TextArea
                label="Extracurricular Activities"
                placeholder="Sports, volunteer work, research assistantships..."
                value={data.extracurriculars}
                onChange={(v) => update({ extracurriculars: v })}
                rows={3}
              />
              <TextArea
                label="Clubs & Organizations"
                placeholder="Student government, academic clubs, Greek life..."
                value={data.clubs}
                onChange={(v) => update({ clubs: v })}
                rows={3}
              />
              <TextArea
                label="Achievements & Awards"
                placeholder="Dean's list, competition wins, publications..."
                value={data.achievements}
                onChange={(v) => update({ achievements: v })}
                rows={3}
              />
            </div>
          )}

          {activeSection === 'media' && (
            <MediaManager
              media={data.media}
              onChange={(media) => update({ media })}
              maxItems={20}
            />
          )}

          {activeSection === 'documents' && (
            <DocumentManager
              documents={data.documents}
              onChange={(documents) => update({ documents })}
              maxItems={10}
            />
          )}

          {activeSection === 'review' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                  Event Summary
                </h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Title: </span>
                    {data.title || 'â€”'}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Institution: </span>
                    {data.institutionName || 'â€”'}{data.institutionType ? ` (${data.institutionType})` : ''}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Degree: </span>
                    {data.degree || 'â€”'}{data.fieldOfStudy ? ` in ${data.fieldOfStudy}` : ''}
                  </p>
                  {data.gpa && (
                    <p>
                      <span className="font-medium text-slate-700 dark:text-slate-300">GPA: </span>
                      {data.gpa} / {data.gpaScale}
                    </p>
                  )}
                  {data.honors && (
                    <p>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Honors: </span>
                      {data.honors}
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Dates: </span>
                    {data.startDate || 'â€”'}{data.endDate ? ` to ${data.endDate}` : ''}
                    {data.graduationDate ? ` (Graduated: ${data.graduationDate})` : ''}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Media: </span>
                    {data.media.length} items
                  </p>
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Documents: </span>
                    {data.documents.length} items
                  </p>
                </div>
              </div>

              <Select
                label="Visibility"
                options={[
                  { value: 'ONLY_ME', label: 'Only Me' },
                  { value: 'FAMILY', label: 'Family' },
                  { value: 'SUB_CLAN', label: 'Sub Clan' },
                  { value: 'CLAN', label: 'Clan' },
                  { value: 'COMMUNITY', label: 'Community' },
                  { value: 'PUBLIC', label: 'Public' },
                ]}
                value={data.visibility}
                onChange={(v) => update({ visibility: v })}
              />
            </div>
          )}
        </>
      )}
    </AccordionFormLayout>
  );
}
