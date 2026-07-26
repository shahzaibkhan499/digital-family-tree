'use client';

import React, { useState, useMemo } from 'react';
import {
  Users, User, FileText, Image, FolderOpen, Eye, ClipboardList, CalendarDays, UserCheck,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const MEETING_PURPOSE_OPTIONS = [
  { value: 'General Assembly', label: 'General Assembly' },
  { value: 'Conflict Resolution', label: 'Conflict Resolution' },
  { value: 'Planning', label: 'Planning' },
  { value: 'Celebration', label: 'Celebration' },
  { value: 'Emergency', label: 'Emergency' },
  { value: 'Other', label: 'Other' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <Users className="h-5 w-5" />, description: 'Basic gathering info', fields: ['title', 'date', 'location'], required: true },
  { id: 'organizer', title: 'Organizer', icon: <User className="h-5 w-5" />, description: 'Organizer details', fields: ['organizerName', 'organizerRole', 'organizerContact', 'clanName', 'subClanName'] },
  { id: 'clan', title: 'Clan Details', icon: <Users className="h-5 w-5" />, description: 'Clan and elder info', fields: ['clanElder', 'totalClansmen', 'clansRepresented', 'historicalSignificance'] },
  { id: 'agenda', title: 'Agenda', icon: <ClipboardList className="h-5 w-5" />, description: 'Meeting purpose and agenda', fields: ['meetingPurpose', 'agendaItems', 'meetingStartTime', 'meetingEndTime'] },
  { id: 'minutes', title: 'Meeting Notes', icon: <FileText className="h-5 w-5" />, description: 'Decisions and resolutions', fields: ['meetingNotes', 'keyDecisions', 'resolutions', 'actionItems', 'nextMeetingDate'] },
  { id: 'attendance', title: 'Attendance', icon: <UserCheck className="h-5 w-5" />, description: 'Attendees and logistics', fields: ['expectedAttendees', 'rsvpRequired', 'hasFood', 'foodArrangements'] },
  { id: 'media', title: 'Photos & Videos', icon: <Image className="h-5 w-5" />, description: 'Media from the gathering', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Related documents', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface ClanGatheringEventFormProps {
  eventType?: string;
  onComplete?: () => void;
}

export default function ClanGatheringEventForm({ eventType, onComplete }: ClanGatheringEventFormProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: '',
    date: '',
    location: '',
    organizerName: '',
    organizerRole: '',
    organizerContact: '',
    clanName: '',
    subClanName: '',
    clanElder: '',
    totalClansmen: '',
    clansRepresented: '',
    historicalSignificance: '',
    meetingPurpose: '',
    agendaItems: '',
    meetingStartTime: '',
    meetingEndTime: '',
    meetingNotes: '',
    keyDecisions: '',
    resolutions: '',
    actionItems: '',
    nextMeetingDate: '',
    expectedAttendees: '',
    rsvpRequired: false,
    hasFood: false,
    foodArrangements: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'CLAN',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'CLAN_GATHERING',
    title: data.title,
    description: data.clanName ? `${data.clanName} Clan Gathering` : 'Clan Gathering',
    date: data.date ? new Date(data.date).toISOString() : undefined,
    location: data.location,
    visibility: data.visibility,
    info: {
      organizerName: data.organizerName,
      organizerRole: data.organizerRole,
      organizerContact: data.organizerContact,
      clanName: data.clanName,
      subClanName: data.subClanName,
      clanElder: data.clanElder,
      totalClansmen: data.totalClansmen,
      clansRepresented: data.clansRepresented,
      historicalSignificance: data.historicalSignificance,
      meetingPurpose: data.meetingPurpose,
      agendaItems: data.agendaItems,
      meetingStartTime: data.meetingStartTime,
      meetingEndTime: data.meetingEndTime,
      meetingNotes: data.meetingNotes,
      keyDecisions: data.keyDecisions,
      resolutions: data.resolutions,
      actionItems: data.actionItems,
      nextMeetingDate: data.nextMeetingDate,
      expectedAttendees: data.expectedAttendees,
      rsvpRequired: data.rsvpRequired,
      hasFood: data.hasFood,
      foodArrangements: data.foodArrangements,
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
    if (data.organizerName) score += 10;
    if (data.clanName) score += 10;
    if (data.clanElder) score += 5;
    if (data.meetingPurpose) score += 10;
    if (data.agendaItems) score += 5;
    if (data.meetingNotes) score += 5;
    if (data.keyDecisions) score += 5;
    if (data.expectedAttendees) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Clan Gathering"
      subtitle="Record a clan gathering or meeting"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'CLAN_GATHERING'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Annual Clan Gathering 2024" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Date" required value={data.date} onChange={(v) => update('date', v)} />
                <TextInput label="Location" placeholder="e.g. ancestral grounds, Village Hall" value={data.location} onChange={(v) => update('location', v)} />
              </div>
            </div>
          )}

          {activeSection === 'organizer' && (
            <div className="space-y-4">
              <TextInput label="Organizer Name" placeholder="e.g. Chief Okonkwo" value={data.organizerName} onChange={(v) => update('organizerName', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Organizer Role" placeholder="e.g. Clan Head" value={data.organizerRole} onChange={(v) => update('organizerRole', v)} />
                <TextInput label="Organizer Contact" placeholder="e.g. +1 234 567 8900" value={data.organizerContact} onChange={(v) => update('organizerContact', v)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Clan Name" placeholder="e.g. Umuofia" value={data.clanName} onChange={(v) => update('clanName', v)} />
                <TextInput label="Sub-Clan Name" placeholder="e.g. Ezeudu" value={data.subClanName} onChange={(v) => update('subClanName', v)} />
              </div>
            </div>
          )}

          {activeSection === 'clan' && (
            <div className="space-y-4">
              <TextInput label="Clan Elder" placeholder="e.g. Elder Nwankwo" value={data.clanElder} onChange={(v) => update('clanElder', v)} />
              <TextInput label="Total Clansmen" type="number" placeholder="e.g. 150" value={data.totalClansmen} onChange={(v) => update('totalClansmen', v)} />
              <TextArea label="Clans Represented" placeholder="List all clans represented at the gathering" value={data.clansRepresented} onChange={(v) => update('clansRepresented', v)} rows={4} />
              <TextArea label="Historical Significance" placeholder="Describe the historical significance of this gathering" value={data.historicalSignificance} onChange={(v) => update('historicalSignificance', v)} rows={4} />
            </div>
          )}

          {activeSection === 'agenda' && (
            <div className="space-y-4">
              <Select label="Meeting Purpose" options={MEETING_PURPOSE_OPTIONS} value={data.meetingPurpose} onChange={(v) => update('meetingPurpose', v)} placeholder="Select purpose" />
              <TextArea label="Agenda Items" placeholder="List agenda items for the meeting" value={data.agendaItems} onChange={(v) => update('agendaItems', v)} rows={5} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Meeting Start Time" placeholder="e.g. 10:00 AM" value={data.meetingStartTime} onChange={(v) => update('meetingStartTime', v)} />
                <TextInput label="Meeting End Time" placeholder="e.g. 4:00 PM" value={data.meetingEndTime} onChange={(v) => update('meetingEndTime', v)} />
              </div>
            </div>
          )}

          {activeSection === 'minutes' && (
            <div className="space-y-4">
              <TextArea label="Meeting Notes" placeholder="Record key discussion points from the meeting" value={data.meetingNotes} onChange={(v) => update('meetingNotes', v)} rows={5} />
              <TextArea label="Key Decisions" placeholder="List major decisions made during the meeting" value={data.keyDecisions} onChange={(v) => update('keyDecisions', v)} rows={4} />
              <TextArea label="Resolutions" placeholder="Record formal resolutions passed" value={data.resolutions} onChange={(v) => update('resolutions', v)} rows={4} />
              <TextArea label="Action Items" placeholder="List action items with responsible parties" value={data.actionItems} onChange={(v) => update('actionItems', v)} rows={4} />
              <DateInput label="Next Meeting Date" value={data.nextMeetingDate} onChange={(v) => update('nextMeetingDate', v)} />
            </div>
          )}

          {activeSection === 'attendance' && (
            <div className="space-y-4">
              <TextInput label="Expected Attendees" type="number" placeholder="e.g. 120" value={data.expectedAttendees} onChange={(v) => update('expectedAttendees', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Toggle label="RSVP Required" checked={data.rsvpRequired} onChange={(v) => update('rsvpRequired', v)} />
                <Toggle label="Food Arrangements" checked={data.hasFood} onChange={(v) => update('hasFood', v)} />
              </div>
              {data.hasFood && (
                <TextArea label="Food Arrangements" placeholder="Describe food and drink arrangements" value={data.foodArrangements} onChange={(v) => update('foodArrangements', v)} rows={3} />
              )}
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
                  {data.clanName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Clan:</span> {data.clanName}</p>}
                  {data.date && <p><span className="font-medium text-slate-700 dark:text-slate-300">Date:</span> {data.date}</p>}
                  {data.location && <p><span className="font-medium text-slate-700 dark:text-slate-300">Location:</span> {data.location}</p>}
                  {data.organizerName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Organizer:</span> {data.organizerName}</p>}
                  {data.meetingPurpose && <p><span className="font-medium text-slate-700 dark:text-slate-300">Purpose:</span> {data.meetingPurpose}</p>}
                  {data.expectedAttendees && <p><span className="font-medium text-slate-700 dark:text-slate-300">Expected Attendees:</span> {data.expectedAttendees}</p>}
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
