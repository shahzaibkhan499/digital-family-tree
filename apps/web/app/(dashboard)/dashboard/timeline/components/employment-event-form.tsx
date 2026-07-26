'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Briefcase, Building2, DollarSign, Award, FileText,
  Image, CheckCircle, Calendar, MapPin, PlaneTakeoff,
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
    description: 'Job title, dates, and location',
    required: true,
    fields: ['title', 'startDate'],
  },
  {
    id: 'company',
    title: 'Company',
    icon: <Building2 className="w-5 h-5" />,
    description: 'Company details and department',
    required: true,
    fields: ['companyName'],
  },
  {
    id: 'position',
    title: 'Position',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Job title, role, and employment type',
    fields: [],
  },
  {
    id: 'compensation',
    title: 'Compensation',
    icon: <DollarSign className="w-5 h-5" />,
    description: 'Salary, benefits, and pay details',
    fields: [],
  },
  {
    id: 'achievements',
    title: 'Achievements',
    icon: <Award className="w-5 h-5" />,
    description: 'Responsibilities, achievements, and skills',
    fields: [],
  },
  {
    id: 'separation',
    title: 'Separation',
    icon: <PlaneTakeoff className="w-5 h-5" />,
    description: 'Reason for leaving and promotion info',
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
    description: 'Offer letters and contracts',
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

const EMPLOYMENT_TYPES = [
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Intern', label: 'Intern' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (â‚¬)' },
  { value: 'GBP', label: 'GBP (Â£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'PKR', label: 'PKR (Rs)' },
  { value: 'INR', label: 'INR (â‚¹)' },
];

const PAY_PERIODS = [
  { value: 'Hourly', label: 'Hourly' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Yearly', label: 'Yearly' },
];

function getDefaultData() {
  return {
    title: '',
    startDate: '',
    endDate: '',
    location: '',
    isRemote: false,
    companyName: '',
    industry: '',
    companySize: '',
    department: '',
    companyWebsite: '',
    jobTitle: '',
    role: '',
    employmentType: 'Full-time',
    salary: '',
    currency: 'USD',
    payPeriod: 'Yearly',
    benefits: '',
    responsibilities: '',
    achievements: '',
    skillsGained: '',
    reasonForLeaving: '',
    isPromotion: false,
    previousPosition: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
    status: 'DRAFT',
  };
}

export default function EmploymentEventForm({
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
    if (data.companyName) score += 15;
    if (data.jobTitle || data.role) score += 10;
    if (data.employmentType) score += 5;
    if (data.salary) score += 5;
    if (data.location || data.isRemote) score += 5;
    if (data.responsibilities) score += 5;
    if (data.achievements) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    if (data.industry) score += 5;
    return Math.min(100, score);
  }, [data]);

  const buildPayload = useCallback(
    (statusOverride?: string) => ({
      eventType,
      title: data.title || `${data.jobTitle || 'Position'} at ${data.companyName || 'Company'}`,
      description: '',
      date: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      location: data.location,
      venue: data.companyName,
      visibility: data.visibility,
      status: statusOverride || data.status,
      media: data.media.filter((m) => m.url),
      documents: data.documents,
      metadata: {
        startDate: data.startDate,
        endDate: data.endDate,
        isRemote: data.isRemote,
        companyName: data.companyName,
        industry: data.industry,
        companySize: data.companySize,
        department: data.department,
        companyWebsite: data.companyWebsite,
        jobTitle: data.jobTitle,
        role: data.role,
        employmentType: data.employmentType,
        salary: data.salary,
        currency: data.currency,
        payPeriod: data.payPeriod,
        benefits: data.benefits,
        responsibilities: data.responsibilities,
        achievements: data.achievements,
        skillsGained: data.skillsGained,
        reasonForLeaving: data.reasonForLeaving,
        isPromotion: data.isPromotion,
        previousPosition: data.previousPosition,
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
      title="Employment Event"
      subtitle="Job, career, or employment details"
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
                placeholder="e.g., Software Engineer at Google"
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
              <TextInput
                label="Location"
                placeholder="e.g., San Francisco, CA"
                value={data.location}
                onChange={(v) => update({ location: v })}
              />
              <Toggle
                label="Remote Position"
                checked={data.isRemote}
                onChange={(v) => update({ isRemote: v })}
              />
            </div>
          )}

          {activeSection === 'company' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label="Company Name"
                placeholder="e.g., Google, Microsoft, Apple"
                value={data.companyName}
                onChange={(v) => update({ companyName: v })}
                required
                className="sm:col-span-2"
              />
              <TextInput
                label="Industry"
                placeholder="e.g., Technology, Healthcare, Finance"
                value={data.industry}
                onChange={(v) => update({ industry: v })}
              />
              <TextInput
                label="Company Size"
                placeholder="e.g., 500-1000 employees"
                value={data.companySize}
                onChange={(v) => update({ companySize: v })}
              />
              <TextInput
                label="Department"
                placeholder="e.g., Engineering, Marketing"
                value={data.department}
                onChange={(v) => update({ department: v })}
              />
              <TextInput
                label="Company Website"
                placeholder="e.g., https://google.com"
                value={data.companyWebsite}
                onChange={(v) => update({ companyWebsite: v })}
                type="url"
              />
            </div>
          )}

          {activeSection === 'position' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label="Job Title"
                placeholder="e.g., Senior Software Engineer"
                value={data.jobTitle}
                onChange={(v) => update({ jobTitle: v })}
              />
              <TextInput
                label="Role"
                placeholder="e.g., Backend Lead, Team Manager"
                value={data.role}
                onChange={(v) => update({ role: v })}
              />
              <Select
                label="Employment Type"
                options={EMPLOYMENT_TYPES}
                value={data.employmentType}
                onChange={(v) => update({ employmentType: v })}
              />
            </div>
          )}

          {activeSection === 'compensation' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label="Salary"
                placeholder="e.g., 120000"
                value={data.salary}
                onChange={(v) => update({ salary: v })}
                type="number"
              />
              <Select
                label="Currency"
                options={CURRENCIES}
                value={data.currency}
                onChange={(v) => update({ currency: v })}
              />
              <Select
                label="Pay Period"
                options={PAY_PERIODS}
                value={data.payPeriod}
                onChange={(v) => update({ payPeriod: v })}
              />
              <TextArea
                label="Benefits"
                placeholder="Health insurance, 401k, stock options, PTO..."
                value={data.benefits}
                onChange={(v) => update({ benefits: v })}
                rows={3}
                className="sm:col-span-2"
              />
            </div>
          )}

          {activeSection === 'achievements' && (
            <div className="grid grid-cols-1 gap-4">
              <TextArea
                label="Responsibilities"
                placeholder="Key duties and day-to-day responsibilities..."
                value={data.responsibilities}
                onChange={(v) => update({ responsibilities: v })}
                rows={4}
              />
              <TextArea
                label="Achievements"
                placeholder="Notable accomplishments, awards, and milestones..."
                value={data.achievements}
                onChange={(v) => update({ achievements: v })}
                rows={4}
              />
              <TextArea
                label="Skills Gained"
                placeholder="Technical and soft skills acquired during this role..."
                value={data.skillsGained}
                onChange={(v) => update({ skillsGained: v })}
                rows={3}
              />
            </div>
          )}

          {activeSection === 'separation' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextArea
                label="Reason for Leaving"
                placeholder="Career growth, relocation, personal reasons..."
                value={data.reasonForLeaving}
                onChange={(v) => update({ reasonForLeaving: v })}
                rows={3}
                className="sm:col-span-2"
              />
              <Toggle
                label="This was a Promotion"
                description="Toggle if this position was a promotion from a previous role"
                checked={data.isPromotion}
                onChange={(v) => update({ isPromotion: v })}
                className="sm:col-span-2"
              />
              {data.isPromotion && (
                <TextInput
                  label="Previous Position"
                  placeholder="e.g., Junior Software Engineer"
                  value={data.previousPosition}
                  onChange={(v) => update({ previousPosition: v })}
                  className="sm:col-span-2"
                />
              )}
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
                    <span className="font-medium text-slate-700 dark:text-slate-300">Company: </span>
                    {data.companyName || 'â€”'}{data.industry ? ` (${data.industry})` : ''}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Position: </span>
                    {data.jobTitle || 'â€”'}{data.employmentType ? ` Â· ${data.employmentType}` : ''}
                  </p>
                  {data.salary && (
                    <p>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Compensation: </span>
                      {data.currency} {data.salary}/{data.payPeriod}
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Dates: </span>
                    {data.startDate || 'â€”'}{data.endDate ? ` to ${data.endDate}` : ' (Present)'}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Location: </span>
                    {data.isRemote ? 'Remote' : data.location || 'â€”'}
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
