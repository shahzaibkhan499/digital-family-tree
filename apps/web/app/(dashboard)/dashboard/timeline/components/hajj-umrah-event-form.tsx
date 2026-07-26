'use client';

import React, { useState, useMemo } from 'react';
import {
  Plane, MapPin, Users, FileText, BookOpen, Image, FolderOpen, Eye, Scroll,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const PILGRIMAGE_TYPES = [
  { value: 'Hajj', label: 'Hajj' },
  { value: 'Umrah', label: 'Umrah' },
];

const PACKAGE_TYPES = [
  { value: 'Economy', label: 'Economy' },
  { value: 'Standard', label: 'Standard' },
  { value: 'VIP', label: 'VIP' },
  { value: 'Luxury', label: 'Luxury' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <BookOpen className="h-5 w-5" />, description: 'Basic pilgrimage info', fields: ['title', 'date', 'pilgrimageType', 'location'], required: true },
  { id: 'travel', title: 'Travel Details', icon: <Plane className="h-5 w-5" />, description: 'Flights and itinerary', fields: ['departureDate', 'returnDate', 'airline', 'flightNumber', 'departureCity', 'arrivalCity'] },
  { id: 'agency', title: 'Agency & Guide', icon: <Users className="h-5 w-5" />, description: 'Travel agency and guide info', fields: ['agencyName', 'agencyContact', 'guideName', 'guideContact', 'packageType'] },
  { id: 'documents', title: 'Documents', icon: <FileText className="h-5 w-5" />, description: 'Passport, visa, and health docs', fields: ['passportNumber', 'visaNumber', 'visaType', 'vaccinationProof', 'medicalCertificate'] },
  { id: 'rituals', title: 'Ritual Details', icon: <Scroll className="h-5 w-5" />, description: 'Accommodation and rites', fields: ['hotelMakkah', 'hotelMadinah', 'daysInMadinah', 'performedRites', 'spiritualExperience'] },
  { id: 'group', title: 'Travel Group', icon: <Users className="h-5 w-5" />, description: 'Companions and group info', fields: ['travelCompanions', 'groupLeader', 'totalPilgrims'] },
  { id: 'media', title: 'Photos & Videos', icon: <Image className="h-5 w-5" />, description: 'Pilgrimage photos and videos', fields: [] },
  { id: 'docs', title: 'Certificates & Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Official certificates and docs', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface HajjUmrahEventFormProps {
  eventType?: string;
  onComplete?: () => void;
}

export default function HajjUmrahEventForm({ eventType, onComplete }: HajjUmrahEventFormProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: 'Hajj/Umrah Pilgrimage',
    date: '',
    pilgrimageType: '',
    location: '',
    departureDate: '',
    returnDate: '',
    airline: '',
    flightNumber: '',
    departureCity: '',
    arrivalCity: 'Makkah',
    agencyName: '',
    agencyContact: '',
    guideName: '',
    guideContact: '',
    packageType: '',
    passportNumber: '',
    visaNumber: '',
    visaType: '',
    vaccinationProof: '',
    medicalCertificate: '',
    hotelMakkah: '',
    hotelMadinah: '',
    daysInMadinah: '',
    performedRites: '',
    spiritualExperience: '',
    travelCompanions: '',
    groupLeader: '',
    totalPilgrims: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'HAJJ',
    title: data.title,
    description: data.pilgrimageType ? `${data.pilgrimageType} Pilgrimage${data.location ? ` - ${data.location}` : ''}` : '',
    date: data.date ? new Date(data.date).toISOString() : undefined,
    location: data.location,
    visibility: data.visibility,
    info: {
      pilgrimageType: data.pilgrimageType,
      departureDate: data.departureDate,
      returnDate: data.returnDate,
      airline: data.airline,
      flightNumber: data.flightNumber,
      departureCity: data.departureCity,
      arrivalCity: data.arrivalCity,
      agencyName: data.agencyName,
      agencyContact: data.agencyContact,
      guideName: data.guideName,
      guideContact: data.guideContact,
      packageType: data.packageType,
      passportNumber: data.passportNumber,
      visaNumber: data.visaNumber,
      visaType: data.visaType,
      vaccinationProof: data.vaccinationProof,
      medicalCertificate: data.medicalCertificate,
      hotelMakkah: data.hotelMakkah,
      hotelMadinah: data.hotelMadinah,
      daysInMadinah: data.daysInMadinah,
      performedRites: data.performedRites,
      spiritualExperience: data.spiritualExperience,
      travelCompanions: data.travelCompanions,
      groupLeader: data.groupLeader,
      totalPilgrims: data.totalPilgrims,
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
    if (data.pilgrimageType) score += 10;
    if (data.location) score += 5;
    if (data.airline) score += 5;
    if (data.agencyName) score += 10;
    if (data.visaNumber) score += 10;
    if (data.hotelMakkah) score += 5;
    if (data.hotelMadinah) score += 5;
    if (data.performedRites) score += 10;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Hajj/Umrah Pilgrimage"
      subtitle="Record a pilgrimage journey"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'HAJJ'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Hajj/Umrah Pilgrimage" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Departure Date" required value={data.date} onChange={(v) => update('date', v)} />
                <Select label="Pilgrimage Type" options={PILGRIMAGE_TYPES} value={data.pilgrimageType} onChange={(v) => update('pilgrimageType', v)} placeholder="Select type" />
              </div>
              <TextInput label="Location" placeholder="e.g. Makkah, Saudi Arabia" value={data.location} onChange={(v) => update('location', v)} />
            </div>
          )}

          {activeSection === 'travel' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Departure Date" value={data.departureDate} onChange={(v) => update('departureDate', v)} />
                <DateInput label="Return Date" value={data.returnDate} onChange={(v) => update('returnDate', v)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Airline" placeholder="e.g. Saudi Airlines" value={data.airline} onChange={(v) => update('airline', v)} />
                <TextInput label="Flight Number" placeholder="e.g. SV101" value={data.flightNumber} onChange={(v) => update('flightNumber', v)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Departure City" placeholder="e.g. London" value={data.departureCity} onChange={(v) => update('departureCity', v)} />
                <TextInput label="Arrival City" placeholder="e.g. Makkah" value={data.arrivalCity} onChange={(v) => update('arrivalCity', v)} />
              </div>
            </div>
          )}

          {activeSection === 'agency' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Agency Name" placeholder="e.g. Al-Barakah Tours" value={data.agencyName} onChange={(v) => update('agencyName', v)} />
                <TextInput label="Agency Contact" placeholder="e.g. info@albarakah.com" value={data.agencyContact} onChange={(v) => update('agencyContact', v)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Guide Name" placeholder="e.g. Sheikh Ahmad" value={data.guideName} onChange={(v) => update('guideName', v)} />
                <TextInput label="Guide Contact" placeholder="e.g. +966501234567" value={data.guideContact} onChange={(v) => update('guideContact', v)} />
              </div>
              <Select label="Package Type" options={PACKAGE_TYPES} value={data.packageType} onChange={(v) => update('packageType', v)} placeholder="Select package" />
            </div>
          )}

          {activeSection === 'documents' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Passport Number" placeholder="e.g. AB1234567" value={data.passportNumber} onChange={(v) => update('passportNumber', v)} />
                <TextInput label="Visa Number" placeholder="e.g. VISA-2024-001" value={data.visaNumber} onChange={(v) => update('visaNumber', v)} />
              </div>
              <TextInput label="Visa Type" placeholder="e.g. Hajj Visa / Umrah Visa" value={data.visaType} onChange={(v) => update('visaType', v)} />
              <TextInput label="Vaccination Proof" placeholder="e.g. Meningitis ACWY, COVID-19" value={data.vaccinationProof} onChange={(v) => update('vaccinationProof', v)} />
              <TextInput label="Medical Certificate" placeholder="e.g. Fitness to travel certificate" value={data.medicalCertificate} onChange={(v) => update('medicalCertificate', v)} />
            </div>
          )}

          {activeSection === 'rituals' && (
            <div className="space-y-4">
              <TextInput label="Hotel in Makkah" placeholder="e.g. SwissÃ´tel Makkah" value={data.hotelMakkah} onChange={(v) => update('hotelMakkah', v)} />
              <TextInput label="Hotel in Madinah" placeholder="e.g. Hilton Suites Madinah" value={data.hotelMadinah} onChange={(v) => update('hotelMadinah', v)} />
              <TextInput label="Days in Madinah" type="number" placeholder="e.g. 5" value={data.daysInMadinah} onChange={(v) => update('daysInMadinah', v)} />
              <TextArea label="Performed Rites" placeholder="Describe the rites performed (Tawaf, Sa'i, Wuquf, etc.)" value={data.performedRites} onChange={(v) => update('performedRites', v)} rows={4} />
              <TextArea label="Spiritual Experience" placeholder="Share your spiritual reflections and experiences" value={data.spiritualExperience} onChange={(v) => update('spiritualExperience', v)} rows={4} />
            </div>
          )}

          {activeSection === 'group' && (
            <div className="space-y-4">
              <TextArea label="Travel Companions" placeholder="List family members or friends who traveled with you" value={data.travelCompanions} onChange={(v) => update('travelCompanions', v)} rows={4} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Group Leader" placeholder="e.g. Sheikh Ahmad" value={data.groupLeader} onChange={(v) => update('groupLeader', v)} />
                <TextInput label="Total Pilgrims" type="number" placeholder="e.g. 15" value={data.totalPilgrims} onChange={(v) => update('totalPilgrims', v)} />
              </div>
            </div>
          )}

          {activeSection === 'media' && (
            <MediaManager media={data.media} onChange={(media) => update('media', media)} />
          )}

          {activeSection === 'docs' && (
            <DocumentManager documents={data.documents} onChange={(docs) => update('documents', docs)} />
          )}

          {activeSection === 'review' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Event Summary</h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {data.title && <p><span className="font-medium text-slate-700 dark:text-slate-300">Title:</span> {data.title}</p>}
                  {data.pilgrimageType && <p><span className="font-medium text-slate-700 dark:text-slate-300">Type:</span> {data.pilgrimageType}</p>}
                  {data.date && <p><span className="font-medium text-slate-700 dark:text-slate-300">Departure:</span> {data.date}</p>}
                  {data.location && <p><span className="font-medium text-slate-700 dark:text-slate-300">Location:</span> {data.location}</p>}
                  {data.airline && <p><span className="font-medium text-slate-700 dark:text-slate-300">Airline:</span> {data.airline}</p>}
                  {data.agencyName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Agency:</span> {data.agencyName}</p>}
                  {data.packageType && <p><span className="font-medium text-slate-700 dark:text-slate-300">Package:</span> {data.packageType}</p>}
                  {data.hotelMakkah && <p><span className="font-medium text-slate-700 dark:text-slate-300">Hotel (Makkah):</span> {data.hotelMakkah}</p>}
                  {data.hotelMadinah && <p><span className="font-medium text-slate-700 dark:text-slate-300">Hotel (Madinah):</span> {data.hotelMadinah}</p>}
                  {data.totalPilgrims && <p><span className="font-medium text-slate-700 dark:text-slate-300">Total Pilgrims:</span> {data.totalPilgrims}</p>}
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
