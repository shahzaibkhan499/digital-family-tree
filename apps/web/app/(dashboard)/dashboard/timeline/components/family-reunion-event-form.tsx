'use client';

import React, { useState, useMemo } from 'react';
import {
  Users, UserCheck, Home, ClipboardCheck, CalendarDays, Image, FolderOpen, Eye,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const VENUE_TYPES = [
  { value: 'Home', label: 'Home' },
  { value: 'Park', label: 'Park' },
  { value: 'Hall', label: 'Hall' },
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Outdoor', label: 'Outdoor' },
  { value: 'Other', label: 'Other' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <Users className="h-5 w-5" />, description: 'Basic reunion info', fields: ['title', 'reunionDate', 'location'], required: true },
  { id: 'organizer', title: 'Organizer', icon: <UserCheck className="h-5 w-5" />, description: 'Organizer details', fields: ['organizerName', 'organizerContact', 'organizingCommittee'] },
  { id: 'families', title: 'Participating Families', icon: <Users className="h-5 w-5" />, description: 'Family attendance', fields: ['totalFamilies', 'familyBranches', 'familyElders', 'travelingFrom'] },
  { id: 'venue', title: 'Venue', icon: <Home className="h-5 w-5" />, description: 'Location details', fields: ['venueName', 'venueAddress', 'venueType', 'indoorOutdoor', 'hasAccommodation'] },
  { id: 'attendance', title: 'Attendance', icon: <ClipboardCheck className="h-5 w-5" />, description: 'Guests and meals', fields: ['expectedAttendees', 'rsvpRequired', 'mealPlanning', 'dietaryRequirements'] },
  { id: 'activities', title: 'Activities & Agenda', icon: <CalendarDays className="h-5 w-5" />, description: 'Schedule and events', fields: ['agenda', 'activities', 'photoSession', 'videoRecording'] },
  { id: 'media', title: 'Photos & Videos', icon: <Image className="h-5 w-5" />, description: 'Reunion photos and videos', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Related documents', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface FamilyReunionEventFormProps {
  eventType?: string;
  onComplete?: () => void;
}

export default function FamilyReunionEventForm({ eventType, onComplete }: FamilyReunionEventFormProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: 'Family Reunion',
    reunionDate: '',
    location: '',
    organizerName: '',
    organizerContact: '',
    organizingCommittee: '',
    totalFamilies: '',
    familyBranches: '',
    familyElders: '',
    travelingFrom: '',
    venueName: '',
    venueAddress: '',
    venueType: '',
    indoorOutdoor: false,
    hasAccommodation: false,
    expectedAttendees: '',
    rsvpRequired: false,
    mealPlanning: false,
    dietaryRequirements: '',
    agenda: '',
    activities: '',
    photoSession: false,
    videoRecording: false,
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'CLAN',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'FAMILY_REUNION',
    title: data.title,
    description: data.organizerName ? `Family Reunion organized by ${data.organizerName}` : '',
    date: data.reunionDate ? new Date(data.reunionDate).toISOString() : undefined,
    location: data.location,
    visibility: data.visibility,
    info: {
      reunionDate: data.reunionDate,
      location: data.location,
      organizerName: data.organizerName,
      organizerContact: data.organizerContact,
      organizingCommittee: data.organizingCommittee,
      totalFamilies: data.totalFamilies,
      familyBranches: data.familyBranches,
      familyElders: data.familyElders,
      travelingFrom: data.travelingFrom,
      venueName: data.venueName,
      venueAddress: data.venueAddress,
      venueType: data.venueType,
      indoorOutdoor: data.indoorOutdoor,
      hasAccommodation: data.hasAccommodation,
      expectedAttendees: data.expectedAttendees,
      rsvpRequired: data.rsvpRequired,
      mealPlanning: data.mealPlanning,
      dietaryRequirements: data.dietaryRequirements,
      agenda: data.agenda,
      activities: data.activities,
      photoSession: data.photoSession,
      videoRecording: data.videoRecording,
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
    if (data.reunionDate) score += 10;
    if (data.location) score += 5;
    if (data.organizerName) score += 10;
    if (data.organizerContact) score += 5;
    if (data.totalFamilies) score += 5;
    if (data.familyBranches) score += 5;
    if (data.venueName) score += 5;
    if (data.venueType) score += 5;
    if (data.expectedAttendees) score += 5;
    if (data.agenda) score += 10;
    if (data.activities) score += 5;
    if (data.dietaryRequirements) score += 5;
    if (data.familyElders) score += 5;
    if (data.travelingFrom) score += 5;
    if (data.media.length > 0) score += 5;
    if (data.documents.length > 0) score += 5;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Family Reunion"
      subtitle="Record a family reunion gathering"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'FAMILY_REUNION'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Family Reunion" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Reunion Date" required value={data.reunionDate} onChange={(v) => update('reunionDate', v)} />
                <TextInput label="Location" placeholder="e.g. Springfield, IL" value={data.location} onChange={(v) => update('location', v)} />
              </div>
            </div>
          )}

          {activeSection === 'organizer' && (
            <div className="space-y-4">
              <TextInput label="Organizer Name" placeholder="e.g. John Smith" value={data.organizerName} onChange={(v) => update('organizerName', v)} />
              <TextInput label="Organizer Contact" placeholder="e.g. john@email.com or 555-1234" value={data.organizerContact} onChange={(v) => update('organizerContact', v)} />
              <TextArea label="Organizing Committee" placeholder="List committee members and their roles" value={data.organizingCommittee} onChange={(v) => update('organizingCommittee', v)} rows={4} />
            </div>
          )}

          {activeSection === 'families' && (
            <div className="space-y-4">
              <TextInput label="Total Families" type="number" placeholder="e.g. 15" value={data.totalFamilies} onChange={(v) => update('totalFamilies', v)} />
              <TextArea label="Family Branches" placeholder="List family branches attending" value={data.familyBranches} onChange={(v) => update('familyBranches', v)} rows={4} />
              <TextArea label="Family Elders" placeholder="List family elders attending" value={data.familyElders} onChange={(v) => update('familyElders', v)} rows={3} />
              <TextArea label="Traveling From" placeholder="List locations guests are traveling from" value={data.travelingFrom} onChange={(v) => update('travelingFrom', v)} rows={3} />
            </div>
          )}

          {activeSection === 'venue' && (
            <div className="space-y-4">
              <TextInput label="Venue Name" placeholder="e.g. Community Park" value={data.venueName} onChange={(v) => update('venueName', v)} />
              <TextInput label="Venue Address" placeholder="e.g. 456 Oak Ave, City" value={data.venueAddress} onChange={(v) => update('venueAddress', v)} />
              <Select label="Venue Type" options={VENUE_TYPES} value={data.venueType} onChange={(v) => update('venueType', v)} placeholder="Select venue type" />
              <Toggle label="Indoor / Outdoor" checked={data.indoorOutdoor} onChange={(v) => update('indoorOutdoor', v)} />
              <Toggle label="Has Accommodation" checked={data.hasAccommodation} onChange={(v) => update('hasAccommodation', v)} />
            </div>
          )}

          {activeSection === 'attendance' && (
            <div className="space-y-4">
              <TextInput label="Expected Attendees" type="number" placeholder="e.g. 75" value={data.expectedAttendees} onChange={(v) => update('expectedAttendees', v)} />
              <Toggle label="RSVP Required" checked={data.rsvpRequired} onChange={(v) => update('rsvpRequired', v)} />
              <Toggle label="Meal Planning" checked={data.mealPlanning} onChange={(v) => update('mealPlanning', v)} />
              <TextArea label="Dietary Requirements" placeholder="List dietary requirements or restrictions" value={data.dietaryRequirements} onChange={(v) => update('dietaryRequirements', v)} rows={3} />
            </div>
          )}

          {activeSection === 'activities' && (
            <div className="space-y-4">
              <TextArea label="Agenda" placeholder="Schedule of events for the reunion" value={data.agenda} onChange={(v) => update('agenda', v)} rows={6} />
              <TextArea label="Activities" placeholder="List games, trips, or group activities" value={data.activities} onChange={(v) => update('activities', v)} rows={4} />
              <Toggle label="Photo Session" checked={data.photoSession} onChange={(v) => update('photoSession', v)} />
              <Toggle label="Video Recording" checked={data.videoRecording} onChange={(v) => update('videoRecording', v)} />
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
                  {data.reunionDate && <p><span className="font-medium text-slate-700 dark:text-slate-300">Date:</span> {data.reunionDate}</p>}
                  {data.location && <p><span className="font-medium text-slate-700 dark:text-slate-300">Location:</span> {data.location}</p>}
                  {data.organizerName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Organizer:</span> {data.organizerName}</p>}
                  {data.totalFamilies && <p><span className="font-medium text-slate-700 dark:text-slate-300">Families:</span> {data.totalFamilies}</p>}
                  {data.expectedAttendees && <p><span className="font-medium text-slate-700 dark:text-slate-300">Attendees:</span> {data.expectedAttendees}</p>}
                  {data.venueName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Venue:</span> {data.venueName}</p>}
                  {data.venueType && <p><span className="font-medium text-slate-700 dark:text-slate-300">Venue Type:</span> {data.venueType}</p>}
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
