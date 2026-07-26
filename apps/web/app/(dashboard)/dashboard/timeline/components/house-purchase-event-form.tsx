'use client';

import React, { useState, useMemo } from 'react';
import {
  Home, MapPin, DollarSign, Scale, Image, FolderOpen, Eye, Key,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const PROPERTY_TYPES = [
  { value: 'House', label: 'House' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'Plot', label: 'Plot' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Farmhouse', label: 'Farmhouse' },
  { value: 'Condo', label: 'Condo' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' },
];

const DEED_TYPES = [
  { value: 'Freehold', label: 'Freehold' },
  { value: 'Leasehold', label: 'Leasehold' },
  { value: 'Condominium', label: 'Condominium' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <Home className="h-5 w-5" />, description: 'Basic purchase info', fields: ['title', 'date', 'location'], required: true },
  { id: 'property', title: 'Address & Property', icon: <MapPin className="h-5 w-5" />, description: 'Property details and specs', fields: ['fullAddress', 'propertyType', 'bedrooms', 'bathrooms', 'areaSqft', 'yearBuilt'] },
  { id: 'location', title: 'Google Map', icon: <MapPin className="h-5 w-5" />, description: 'Location and nearby places', fields: ['googleMapUrl', 'neighborhood', 'nearbySchools', 'nearbyHospitals'] },
  { id: 'transaction', title: 'Transaction', icon: <DollarSign className="h-5 w-5" />, description: 'Price and agent details', fields: ['sellerName', 'sellerContact', 'purchasePrice', 'currency', 'agentName', 'agentContact'] },
  { id: 'legal', title: 'Legal', icon: <Scale className="h-5 w-5" />, description: 'Registry and deed info', fields: ['registryNumber', 'deedType', 'hasRegistry', 'hasTitleDeed', 'mortgageDetails'] },
  { id: 'media', title: 'Photos & Videos', icon: <Image className="h-5 w-5" />, description: 'Property photos and videos', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Legal and transaction documents', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface HousePurchaseEventFormProps {
  eventType?: string;
  onComplete?: () => void;
}

export default function HousePurchaseEventForm({ eventType, onComplete }: HousePurchaseEventFormProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: 'New Home Purchase',
    date: '',
    location: '',
    fullAddress: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    areaSqft: '',
    yearBuilt: '',
    googleMapUrl: '',
    neighborhood: '',
    nearbySchools: '',
    nearbyHospitals: '',
    sellerName: '',
    sellerContact: '',
    purchasePrice: '',
    currency: 'USD',
    agentName: '',
    agentContact: '',
    registryNumber: '',
    deedType: '',
    hasRegistry: false,
    hasTitleDeed: false,
    mortgageDetails: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'HOUSE_PURCHASE',
    title: data.title,
    description: data.fullAddress || (data.location ? `Home in ${data.location}` : ''),
    date: data.date ? new Date(data.date).toISOString() : undefined,
    location: data.location,
    visibility: data.visibility,
    info: {
      fullAddress: data.fullAddress,
      propertyType: data.propertyType,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      areaSqft: data.areaSqft,
      yearBuilt: data.yearBuilt,
      googleMapUrl: data.googleMapUrl,
      neighborhood: data.neighborhood,
      nearbySchools: data.nearbySchools,
      nearbyHospitals: data.nearbyHospitals,
      sellerName: data.sellerName,
      sellerContact: data.sellerContact,
      purchasePrice: data.purchasePrice,
      currency: data.currency,
      agentName: data.agentName,
      agentContact: data.agentContact,
      registryNumber: data.registryNumber,
      deedType: data.deedType,
      hasRegistry: data.hasRegistry,
      hasTitleDeed: data.hasTitleDeed,
      mortgageDetails: data.mortgageDetails,
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
    if (data.location) score += 10;
    if (data.fullAddress) score += 5;
    if (data.propertyType) score += 10;
    if (data.purchasePrice) score += 10;
    if (data.sellerName) score += 5;
    if (data.agentName) score += 5;
    if (data.registryNumber) score += 5;
    if (data.deedType) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="House Purchase"
      subtitle="Record a property purchase"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'HOUSE_PURCHASE'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. New Home Purchase" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Purchase Date" required value={data.date} onChange={(v) => update('date', v)} />
                <TextInput label="Location" placeholder="e.g. Brooklyn, NY" value={data.location} onChange={(v) => update('location', v)} />
              </div>
            </div>
          )}

          {activeSection === 'property' && (
            <div className="space-y-4">
              <TextInput label="Full Address" placeholder="e.g. 123 Main St, Brooklyn, NY 11201" value={data.fullAddress} onChange={(v) => update('fullAddress', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select label="Property Type" options={PROPERTY_TYPES} value={data.propertyType} onChange={(v) => update('propertyType', v)} placeholder="Select type" />
                <TextInput label="Year Built" type="number" placeholder="e.g. 2005" value={data.yearBuilt} onChange={(v) => update('yearBuilt', v)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <TextInput label="Bedrooms" type="number" placeholder="e.g. 3" value={data.bedrooms} onChange={(v) => update('bedrooms', v)} />
                <TextInput label="Bathrooms" type="number" placeholder="e.g. 2" value={data.bathrooms} onChange={(v) => update('bathrooms', v)} />
                <TextInput label="Area (sq ft)" type="number" placeholder="e.g. 1800" value={data.areaSqft} onChange={(v) => update('areaSqft', v)} />
              </div>
            </div>
          )}

          {activeSection === 'location' && (
            <div className="space-y-4">
              <TextInput label="Google Map URL" type="url" placeholder="https://maps.google.com/..." value={data.googleMapUrl} onChange={(v) => update('googleMapUrl', v)} />
              <TextInput label="Neighborhood" placeholder="e.g. Park Slope" value={data.neighborhood} onChange={(v) => update('neighborhood', v)} />
              <TextInput label="Nearby Schools" placeholder="e.g. PS 321, Brooklyn Tech" value={data.nearbySchools} onChange={(v) => update('nearbySchools', v)} />
              <TextInput label="Nearby Hospitals" placeholder="e.g. NYU Langone, Methodist" value={data.nearbyHospitals} onChange={(v) => update('nearbyHospitals', v)} />
            </div>
          )}

          {activeSection === 'transaction' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Seller Name" placeholder="e.g. John Smith" value={data.sellerName} onChange={(v) => update('sellerName', v)} />
                <TextInput label="Seller Contact" placeholder="e.g. john@example.com" value={data.sellerContact} onChange={(v) => update('sellerContact', v)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Purchase Price" type="number" placeholder="e.g. 450000" value={data.purchasePrice} onChange={(v) => update('purchasePrice', v)} />
                <Select label="Currency" options={CURRENCIES} value={data.currency} onChange={(v) => update('currency', v)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Agent Name" placeholder="e.g. Jane Doe" value={data.agentName} onChange={(v) => update('agentName', v)} />
                <TextInput label="Agent Contact" placeholder="e.g. jane@realestate.com" value={data.agentContact} onChange={(v) => update('agentContact', v)} />
              </div>
            </div>
          )}

          {activeSection === 'legal' && (
            <div className="space-y-4">
              <TextInput label="Registry Number" placeholder="e.g. REG-2024-001234" value={data.registryNumber} onChange={(v) => update('registryNumber', v)} />
              <Select label="Deed Type" options={DEED_TYPES} value={data.deedType} onChange={(v) => update('deedType', v)} placeholder="Select deed type" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Toggle label="Has Registry" checked={data.hasRegistry} onChange={(v) => update('hasRegistry', v)} />
                <Toggle label="Has Title Deed" checked={data.hasTitleDeed} onChange={(v) => update('hasTitleDeed', v)} />
              </div>
              <TextArea label="Mortgage Details" placeholder="Describe mortgage terms and lender info" value={data.mortgageDetails} onChange={(v) => update('mortgageDetails', v)} rows={3} />
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
                  {data.date && <p><span className="font-medium text-slate-700 dark:text-slate-300">Purchase Date:</span> {data.date}</p>}
                  {data.location && <p><span className="font-medium text-slate-700 dark:text-slate-300">Location:</span> {data.location}</p>}
                  {data.fullAddress && <p><span className="font-medium text-slate-700 dark:text-slate-300">Address:</span> {data.fullAddress}</p>}
                  {data.propertyType && <p><span className="font-medium text-slate-700 dark:text-slate-300">Type:</span> {data.propertyType}</p>}
                  {data.purchasePrice && <p><span className="font-medium text-slate-700 dark:text-slate-300">Price:</span> {data.currency} {data.purchasePrice}</p>}
                  {data.sellerName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Seller:</span> {data.sellerName}</p>}
                  {data.deedType && <p><span className="font-medium text-slate-700 dark:text-slate-300">Deed Type:</span> {data.deedType}</p>}
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
