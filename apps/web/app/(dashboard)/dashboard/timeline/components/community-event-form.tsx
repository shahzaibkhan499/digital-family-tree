'use client';

import React, { useState, useMemo } from 'react';
import {
  Heart, Users, MapPin, Mail, Mic, DollarSign, Image, FolderOpen, Eye, CalendarDays,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const COMMUNITY_EVENT_TYPES = [
  { value: 'Festival', label: 'Festival' },
  { value: 'Charity', label: 'Charity' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Cultural', label: 'Cultural' },
  { value: 'Educational', label: 'Educational' },
  { value: 'Health', label: 'Health' },
  { value: 'Religious', label: 'Religious' },
  { value: 'Other', label: 'Other' },
];

const VENUE_TYPES = [
  { value: 'Indoor', label: 'Indoor' },
  { value: 'Outdoor', label: 'Outdoor' },
  { value: 'Both', label: 'Both' },
];

const INVITATION_SCOPES = [
  { value: 'Community', label: 'Community' },
  { value: 'Regional', label: 'Regional' },
  { value: 'National', label: 'National' },
];

const BUDGET_CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <Heart className="h-5 w-5" />, description: 'Basic event info', fields: ['title', 'date', 'location'], required: true },
  { id: 'organizer', title: 'Organizer', icon: <Users className="h-5 w-5" />, description: 'Organizer details', fields: ['organizerName', 'organizingBody', 'organizerContact', 'communityName'] },
  { id: 'event', title: 'Event Details', icon: <CalendarDays className="h-5 w-5" />, description: 'Type and description', fields: ['eventType', 'eventDescription', 'targetAudience', 'expectedImpact'] },
  { id: 'venue', title: 'Venue', icon: <MapPin className="h-5 w-5" />, description: 'Venue information', fields: ['venueName', 'venueAddress', 'venueCapacity', 'venueType', 'parkingAvailable'] },
  { id: 'invitations', title: 'Invitations', icon: <Mail className="h-5 w-5" />, description: 'Guest and invite details', fields: ['invitationScope', 'guestOfHonor', 'vipGuests', 'mediaInvited'] },
  { id: 'guests', title: 'Guests & Speakers', icon: <Mic className="h-5 w-5" />, description: 'Speakers and special guests', fields: ['expectedGuests', 'keynoteSpeaker', 'otherSpeakers', 'specialGuests'] },
  { id: 'sponsors', title: 'Sponsors', icon: <DollarSign className="h-5 w-5" />, description: 'Sponsors and budget', fields: ['sponsorList', 'sponsorshipTiers', 'totalBudget', 'budgetCurrency'] },
  { id: 'media', title: 'Photos & Videos', icon: <Image className="h-5 w-5" />, description: 'Media from the event', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Related documents', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface CommunityEventFormProps {
  eventType?: string;
  onComplete?: () => void;
}

export default function CommunityEventForm({ eventType, onComplete }: CommunityEventFormProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: '',
    date: '',
    location: '',
    organizerName: '',
    organizingBody: '',
    organizerContact: '',
    communityName: '',
    eventType: '',
    eventDescription: '',
    targetAudience: '',
    expectedImpact: '',
    venueName: '',
    venueAddress: '',
    venueCapacity: '',
    venueType: '',
    parkingAvailable: false,
    invitationScope: '',
    guestOfHonor: '',
    vipGuests: '',
    mediaInvited: false,
    expectedGuests: '',
    keynoteSpeaker: '',
    otherSpeakers: '',
    specialGuests: '',
    sponsorList: '',
    sponsorshipTiers: '',
    totalBudget: '',
    budgetCurrency: 'USD',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'COMMUNITY',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'COMMUNITY_EVENT',
    title: data.title,
    description: data.communityName ? `${data.communityName} Community Event` : 'Community Event',
    date: data.date ? new Date(data.date).toISOString() : undefined,
    location: data.location,
    visibility: data.visibility,
    info: {
      organizerName: data.organizerName,
      organizingBody: data.organizingBody,
      organizerContact: data.organizerContact,
      communityName: data.communityName,
      eventType: data.eventType,
      eventDescription: data.eventDescription,
      targetAudience: data.targetAudience,
      expectedImpact: data.expectedImpact,
      venueName: data.venueName,
      venueAddress: data.venueAddress,
      venueCapacity: data.venueCapacity,
      venueType: data.venueType,
      parkingAvailable: data.parkingAvailable,
      invitationScope: data.invitationScope,
      guestOfHonor: data.guestOfHonor,
      vipGuests: data.vipGuests,
      mediaInvited: data.mediaInvited,
      expectedGuests: data.expectedGuests,
      keynoteSpeaker: data.keynoteSpeaker,
      otherSpeakers: data.otherSpeakers,
      specialGuests: data.specialGuests,
      sponsorList: data.sponsorList,
      sponsorshipTiers: data.sponsorshipTiers,
      totalBudget: data.totalBudget,
      budgetCurrency: data.budgetCurrency,
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
    if (data.communityName) score += 10;
    if (data.eventType) score += 10;
    if (data.eventDescription) score += 5;
    if (data.venueName) score += 5;
    if (data.keynoteSpeaker) score += 5;
    if (data.sponsorList) score += 5;
    if (data.totalBudget) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Community Event"
      subtitle="Record a community event"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'COMMUNITY_EVENT'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Annual Community Festival" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Date" required value={data.date} onChange={(v) => update('date', v)} />
                <TextInput label="Location" placeholder="e.g. Community Center, Main Street" value={data.location} onChange={(v) => update('location', v)} />
              </div>
            </div>
          )}

          {activeSection === 'organizer' && (
            <div className="space-y-4">
              <TextInput label="Organizer Name" placeholder="e.g. Jane Smith" value={data.organizerName} onChange={(v) => update('organizerName', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Organizing Body" placeholder="e.g. Community Council" value={data.organizingBody} onChange={(v) => update('organizingBody', v)} />
                <TextInput label="Organizer Contact" placeholder="e.g. +1 234 567 8900" value={data.organizerContact} onChange={(v) => update('organizerContact', v)} />
              </div>
              <TextInput label="Community Name" placeholder="e.g. Riverside Community" value={data.communityName} onChange={(v) => update('communityName', v)} />
            </div>
          )}

          {activeSection === 'event' && (
            <div className="space-y-4">
              <Select label="Event Type" options={COMMUNITY_EVENT_TYPES} value={data.eventType} onChange={(v) => update('eventType', v)} placeholder="Select type" />
              <TextArea label="Event Description" placeholder="Describe the event in detail" value={data.eventDescription} onChange={(v) => update('eventDescription', v)} rows={5} />
              <TextInput label="Target Audience" placeholder="e.g. All community members" value={data.targetAudience} onChange={(v) => update('targetAudience', v)} />
              <TextArea label="Expected Impact" placeholder="Describe the expected impact on the community" value={data.expectedImpact} onChange={(v) => update('expectedImpact', v)} rows={4} />
            </div>
          )}

          {activeSection === 'venue' && (
            <div className="space-y-4">
              <TextInput label="Venue Name" placeholder="e.g. Community Hall" value={data.venueName} onChange={(v) => update('venueName', v)} />
              <TextInput label="Venue Address" placeholder="e.g. 123 Main Street" value={data.venueAddress} onChange={(v) => update('venueAddress', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Venue Capacity" type="number" placeholder="e.g. 500" value={data.venueCapacity} onChange={(v) => update('venueCapacity', v)} />
                <Select label="Venue Type" options={VENUE_TYPES} value={data.venueType} onChange={(v) => update('venueType', v)} placeholder="Select type" />
              </div>
              <Toggle label="Parking Available" checked={data.parkingAvailable} onChange={(v) => update('parkingAvailable', v)} />
            </div>
          )}

          {activeSection === 'invitations' && (
            <div className="space-y-4">
              <Select label="Invitation Scope" options={INVITATION_SCOPES} value={data.invitationScope} onChange={(v) => update('invitationScope', v)} placeholder="Select scope" />
              <TextInput label="Guest of Honor" placeholder="e.g. Mayor John Doe" value={data.guestOfHonor} onChange={(v) => update('guestOfHonor', v)} />
              <TextArea label="VIP Guests" placeholder="List VIP guests and their affiliations" value={data.vipGuests} onChange={(v) => update('vipGuests', v)} rows={4} />
              <Toggle label="Media Invited" checked={data.mediaInvited} onChange={(v) => update('mediaInvited', v)} />
            </div>
          )}

          {activeSection === 'guests' && (
            <div className="space-y-4">
              <TextInput label="Expected Guests" type="number" placeholder="e.g. 200" value={data.expectedGuests} onChange={(v) => update('expectedGuests', v)} />
              <TextInput label="Keynote Speaker" placeholder="e.g. Dr. Sarah Johnson" value={data.keynoteSpeaker} onChange={(v) => update('keynoteSpeaker', v)} />
              <TextArea label="Other Speakers" placeholder="List other speakers and their topics" value={data.otherSpeakers} onChange={(v) => update('otherSpeakers', v)} rows={4} />
              <TextArea label="Special Guests" placeholder="List special guests" value={data.specialGuests} onChange={(v) => update('specialGuests', v)} rows={4} />
            </div>
          )}

          {activeSection === 'sponsors' && (
            <div className="space-y-4">
              <TextArea label="Sponsor List" placeholder="List sponsors and their contributions" value={data.sponsorList} onChange={(v) => update('sponsorList', v)} rows={4} />
              <TextArea label="Sponsorship Tiers" placeholder="e.g. Platinum: $10k+, Gold: $5k+, Silver: $2k+" value={data.sponsorshipTiers} onChange={(v) => update('sponsorshipTiers', v)} rows={4} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Total Budget" type="number" placeholder="e.g. 50000" value={data.totalBudget} onChange={(v) => update('totalBudget', v)} />
                <Select label="Budget Currency" options={BUDGET_CURRENCIES} value={data.budgetCurrency} onChange={(v) => update('budgetCurrency', v)} />
              </div>
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
                  {data.communityName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Community:</span> {data.communityName}</p>}
                  {data.eventType && <p><span className="font-medium text-slate-700 dark:text-slate-300">Type:</span> {data.eventType}</p>}
                  {data.date && <p><span className="font-medium text-slate-700 dark:text-slate-300">Date:</span> {data.date}</p>}
                  {data.location && <p><span className="font-medium text-slate-700 dark:text-slate-300">Location:</span> {data.location}</p>}
                  {data.organizerName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Organizer:</span> {data.organizerName}</p>}
                  {data.venueName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Venue:</span> {data.venueName}</p>}
                  {data.keynoteSpeaker && <p><span className="font-medium text-slate-700 dark:text-slate-300">Keynote:</span> {data.keynoteSpeaker}</p>}
                  {data.totalBudget && <p><span className="font-medium text-slate-700 dark:text-slate-300">Budget:</span> {data.budgetCurrency} {data.totalBudget}</p>}
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
