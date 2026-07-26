'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Plane, MapPin, Globe, FileText, Users, DollarSign,
  Image, CheckCircle, Calendar, Ship, Train, Car,
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
    description: 'Event title and travel dates',
    required: true,
    fields: ['title', 'travelDate'],
  },
  {
    id: 'origin',
    title: 'Origin',
    icon: <MapPin className="w-5 h-5" />,
    description: 'Where the journey started',
    required: true,
    fields: ['originCountry'],
  },
  {
    id: 'destination',
    title: 'Destination',
    icon: <Globe className="w-5 h-5" />,
    description: 'Where the journey ended',
    required: true,
    fields: ['destCountry'],
  },
  {
    id: 'travel',
    title: 'Travel Details',
    icon: <Plane className="w-5 h-5" />,
    description: 'Method, route, and duration',
    fields: [],
  },
  {
    id: 'legal',
    title: 'Legal',
    icon: <FileText className="w-5 h-5" />,
    description: 'Visa, passport, and immigration details',
    fields: [],
  },
  {
    id: 'family',
    title: 'Family',
    icon: <Users className="w-5 h-5" />,
    description: 'Accompanying family members',
    fields: [],
  },
  {
    id: 'financial',
    title: 'Financial',
    icon: <DollarSign className="w-5 h-5" />,
    description: 'Sponsor and financial situation',
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
    description: 'Visa, passport, and immigration papers',
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

const TRAVEL_METHODS = [
  { value: 'Air', label: 'Air', description: 'By airplane' },
  { value: 'Sea', label: 'Sea', description: 'By ship or boat' },
  { value: 'Land', label: 'Land', description: 'By car or bus' },
  { value: 'Rail', label: 'Rail', description: 'By train' },
];

function getDefaultData() {
  return {
    title: '',
    travelDate: '',
    arrivalDate: '',
    originCountry: '',
    originCity: '',
    originAddress: '',
    destCountry: '',
    destCity: '',
    destAddress: '',
    travelMethod: 'Air',
    travelRoute: '',
    travelDuration: '',
    visaType: '',
    passportNumber: '',
    immigrationLawyer: '',
    caseNumber: '',
    accompanyingFamily: '',
    hasPets: false,
    sponsorName: '',
    sponsorRelation: '',
    sponsorContact: '',
    financialSituation: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
    status: 'DRAFT',
  };
}

export default function MigrationEventForm({
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
    if (data.title) score += 12;
    if (data.travelDate) score += 8;
    if (data.originCountry) score += 12;
    if (data.destCountry) score += 12;
    if (data.travelMethod) score += 5;
    if (data.visaType) score += 8;
    if (data.passportNumber) score += 5;
    if (data.accompanyingFamily) score += 5;
    if (data.sponsorName) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    if (data.originCity) score += 3;
    if (data.destCity) score += 3;
    if (data.travelRoute) score += 3;
    return Math.min(100, score);
  }, [data]);

  const buildPayload = useCallback(
    (statusOverride?: string) => ({
      eventType,
      title: data.title || `Migration â€” ${data.originCountry || '?'} to ${data.destCountry || '?'}`,
      description: '',
      date: data.travelDate ? new Date(data.travelDate).toISOString() : undefined,
      endDate: data.arrivalDate ? new Date(data.arrivalDate).toISOString() : undefined,
      location: `${data.originCity || ''}, ${data.originCountry || ''}`.trim().replace(/^,\s*/, ''),
      venue: '',
      visibility: data.visibility,
      status: statusOverride || data.status,
      media: data.media.filter((m) => m.url),
      documents: data.documents,
      metadata: {
        travelDate: data.travelDate,
        arrivalDate: data.arrivalDate,
        originCountry: data.originCountry,
        originCity: data.originCity,
        originAddress: data.originAddress,
        destCountry: data.destCountry,
        destCity: data.destCity,
        destAddress: data.destAddress,
        travelMethod: data.travelMethod,
        travelRoute: data.travelRoute,
        travelDuration: data.travelDuration,
        visaType: data.visaType,
        passportNumber: data.passportNumber,
        immigrationLawyer: data.immigrationLawyer,
        caseNumber: data.caseNumber,
        accompanyingFamily: data.accompanyingFamily,
        hasPets: data.hasPets,
        sponsorName: data.sponsorName,
        sponsorRelation: data.sponsorRelation,
        sponsorContact: data.sponsorContact,
        financialSituation: data.financialSituation,
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
      title="Migration Event"
      subtitle="Relocation, immigration, and travel details"
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
                placeholder="e.g., Migration from Pakistan to Canada"
                value={data.title}
                onChange={(v) => update({ title: v })}
                required
                className="sm:col-span-2"
              />
              <DateInput
                label="Travel Date"
                value={data.travelDate}
                onChange={(v) => update({ travelDate: v })}
                required
              />
              <DateInput
                label="Arrival Date"
                value={data.arrivalDate}
                onChange={(v) => update({ arrivalDate: v })}
              />
            </div>
          )}

          {activeSection === 'origin' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label="Country"
                placeholder="e.g., Pakistan"
                value={data.originCountry}
                onChange={(v) => update({ originCountry: v })}
                required
              />
              <TextInput
                label="City"
                placeholder="e.g., Lahore"
                value={data.originCity}
                onChange={(v) => update({ originCity: v })}
              />
              <TextArea
                label="Address"
                placeholder="Full address at origin..."
                value={data.originAddress}
                onChange={(v) => update({ originAddress: v })}
                rows={2}
                className="sm:col-span-2"
              />
            </div>
          )}

          {activeSection === 'destination' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label="Country"
                placeholder="e.g., Canada"
                value={data.destCountry}
                onChange={(v) => update({ destCountry: v })}
                required
              />
              <TextInput
                label="City"
                placeholder="e.g., Toronto"
                value={data.destCity}
                onChange={(v) => update({ destCity: v })}
              />
              <TextArea
                label="Address"
                placeholder="Destination address..."
                value={data.destAddress}
                onChange={(v) => update({ destAddress: v })}
                rows={2}
                className="sm:col-span-2"
              />
            </div>
          )}

          {activeSection === 'travel' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RadioGroup
                label="Travel Method"
                options={TRAVEL_METHODS}
                value={data.travelMethod}
                onChange={(v) => update({ travelMethod: v })}
                className="sm:col-span-2"
              />
              <TextInput
                label="Route Description"
                placeholder="e.g., Lahore â†’ Istanbul â†’ Toronto"
                value={data.travelRoute}
                onChange={(v) => update({ travelRoute: v })}
                className="sm:col-span-2"
              />
              <TextInput
                label="Travel Duration"
                placeholder="e.g., 18 hours, 2 days"
                value={data.travelDuration}
                onChange={(v) => update({ travelDuration: v })}
              />
            </div>
          )}

          {activeSection === 'legal' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label="Visa Type"
                placeholder="e.g., Work Permit, PR, Student Visa"
                value={data.visaType}
                onChange={(v) => update({ visaType: v })}
              />
              <TextInput
                label="Passport Number"
                placeholder="e.g., A1234567"
                value={data.passportNumber}
                onChange={(v) => update({ passportNumber: v })}
              />
              <TextInput
                label="Immigration Lawyer"
                placeholder="e.g., Smith & Associates"
                value={data.immigrationLawyer}
                onChange={(v) => update({ immigrationLawyer: v })}
              />
              <TextInput
                label="Case Number"
                placeholder="e.g., IMM-2024-12345"
                value={data.caseNumber}
                onChange={(v) => update({ caseNumber: v })}
              />
            </div>
          )}

          {activeSection === 'family' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextArea
                label="Accompanying Family"
                placeholder="List family members who traveled together (names, relationships)..."
                value={data.accompanyingFamily}
                onChange={(v) => update({ accompanyingFamily: v })}
                rows={4}
                className="sm:col-span-2"
              />
              <Toggle
                label="Traveling with Pets"
                description="Indicate if pets were part of the migration"
                checked={data.hasPets}
                onChange={(v) => update({ hasPets: v })}
                className="sm:col-span-2"
              />
            </div>
          )}

          {activeSection === 'financial' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label="Sponsor Name"
                placeholder="e.g., John Smith"
                value={data.sponsorName}
                onChange={(v) => update({ sponsorName: v })}
              />
              <TextInput
                label="Relation to Sponsor"
                placeholder="e.g., Uncle, Employer, Self"
                value={data.sponsorRelation}
                onChange={(v) => update({ sponsorRelation: v })}
              />
              <TextInput
                label="Sponsor Contact"
                placeholder="e.g., john@example.com or +1-555-1234"
                value={data.sponsorContact}
                onChange={(v) => update({ sponsorContact: v })}
              />
              <TextArea
                label="Financial Situation"
                placeholder="Savings, funding sources, financial preparations for the move..."
                value={data.financialSituation}
                onChange={(v) => update({ financialSituation: v })}
                rows={3}
                className="sm:col-span-2"
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
                  Migration Summary
                </h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Title: </span>
                    {data.title || 'â€”'}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">From: </span>
                    {data.originCity ? `${data.originCity}, ` : ''}{data.originCountry || 'â€”'}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">To: </span>
                    {data.destCity ? `${data.destCity}, ` : ''}{data.destCountry || 'â€”'}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Method: </span>
                    {data.travelMethod}{data.travelDuration ? ` Â· ${data.travelDuration}` : ''}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Dates: </span>
                    {data.travelDate || 'â€”'}{data.arrivalDate ? ` â†’ ${data.arrivalDate}` : ''}
                  </p>
                  {data.visaType && (
                    <p>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Visa: </span>
                      {data.visaType}
                    </p>
                  )}
                  {data.sponsorName && (
                    <p>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Sponsor: </span>
                      {data.sponsorName}{data.sponsorRelation ? ` (${data.sponsorRelation})` : ''}
                    </p>
                  )}
                  {data.accompanyingFamily && (
                    <p>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Family: </span>
                      {data.accompanyingFamily}
                    </p>
                  )}
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
