'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Users, DollarSign, FileText, Image, FolderOpen, Eye, Scale,
} from 'lucide-react';
import AccordionFormLayout, { FormSection } from './accordion-form-layout';
import { TextInput, TextArea, Select, DateInput, Toggle } from './form-field';
import { MediaManager, MediaItem } from './media-manager';
import { DocumentManager, DocumentItem } from './document-manager';
import { api } from '@/lib/api-client';
import { VISIBILITY_OPTIONS } from './constants';

const LEGAL_STRUCTURES = [
  { value: 'LLC', label: 'LLC' },
  { value: 'Corporation', label: 'Corporation' },
  { value: 'Partnership', label: 'Partnership' },
  { value: 'Sole Proprietorship', label: 'Sole Proprietorship' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' },
];

const SECTIONS: FormSection[] = [
  { id: 'general', title: 'General', icon: <Building2 className="h-5 w-5" />, description: 'Basic registration info', fields: ['title', 'registrationDate', 'location', 'website'], required: true },
  { id: 'business', title: 'Business Details', icon: <Building2 className="h-5 w-5" />, description: 'Name, type, and structure', fields: ['businessName', 'businessType', 'industry', 'legalStructure'] },
  { id: 'operations', title: 'Operations', icon: <Users className="h-5 w-5" />, description: 'Products, services, and market', fields: ['productsServices', 'targetMarket', 'employeeCount'] },
  { id: 'financial', title: 'Financial', icon: <DollarSign className="h-5 w-5" />, description: 'Investment and revenue', fields: ['initialInvestment', 'annualRevenue', 'profitMargin'] },
  { id: 'people', title: 'People', icon: <Users className="h-5 w-5" />, description: 'Co-founders and partners', fields: ['coFounders', 'partners'] },
  { id: 'milestones', title: 'Milestones', icon: <FileText className="h-5 w-5" />, description: 'Key achievements and growth', fields: ['keyAchievements', 'growthTimeline'] },
  { id: 'legal', title: 'Legal', icon: <Scale className="h-5 w-5" />, description: 'Registration and licenses', fields: ['registrationNumber', 'taxId', 'licenses', 'permits'] },
  { id: 'media', title: 'Media', icon: <Image className="h-5 w-5" />, description: 'Office and product photos', fields: [] },
  { id: 'documents', title: 'Documents', icon: <FolderOpen className="h-5 w-5" />, description: 'Registration and license docs', fields: [] },
  { id: 'review', title: 'Review & Publish', icon: <Eye className="h-5 w-5" />, description: 'Review and publish your event', fields: [] },
];

interface BusinessEventFormProps {
  eventType?: string;
  onComplete?: () => void;
}

export default function BusinessEventForm({ eventType, onComplete }: BusinessEventFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [data, setData] = useState<Record<string, any>>({
    title: '',
    registrationDate: '',
    location: '',
    website: '',
    businessName: '',
    businessType: '',
    industry: '',
    legalStructure: '',
    productsServices: '',
    targetMarket: '',
    employeeCount: '',
    initialInvestment: '',
    currency: 'USD',
    annualRevenue: '',
    profitMargin: '',
    coFounders: '',
    partners: '',
    keyAchievements: '',
    growthTimeline: '',
    registrationNumber: '',
    taxId: '',
    licenses: '',
    permits: '',
    media: [] as MediaItem[],
    documents: [] as DocumentItem[],
    visibility: 'FAMILY',
  });

  const update = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const buildPayload = () => ({
    eventType: eventType || 'BUSINESS',
    title: data.title,
    description: data.businessName ? `${data.businessName} - ${data.industry || data.businessType || 'Business'}` : '',
    date: data.registrationDate ? new Date(data.registrationDate).toISOString() : undefined,
    location: data.location,
    visibility: data.visibility,
    info: {
      registrationDate: data.registrationDate,
      location: data.location,
      website: data.website,
      businessName: data.businessName,
      businessType: data.businessType,
      industry: data.industry,
      legalStructure: data.legalStructure,
      productsServices: data.productsServices,
      targetMarket: data.targetMarket,
      employeeCount: data.employeeCount,
      initialInvestment: data.initialInvestment,
      currency: data.currency,
      annualRevenue: data.annualRevenue,
      profitMargin: data.profitMargin,
      coFounders: data.coFounders,
      partners: data.partners,
      keyAchievements: data.keyAchievements,
      growthTimeline: data.growthTimeline,
      registrationNumber: data.registrationNumber,
      taxId: data.taxId,
      licenses: data.licenses,
      permits: data.permits,
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
    if (data.businessName) score += 15;
    if (data.registrationDate) score += 5;
    if (data.industry) score += 10;
    if (data.legalStructure) score += 10;
    if (data.productsServices) score += 10;
    if (data.initialInvestment) score += 5;
    if (data.registrationNumber) score += 5;
    if (data.taxId) score += 5;
    if (data.media.length > 0) score += 10;
    if (data.documents.length > 0) score += 10;
    if (data.location) score += 5;
    return Math.min(100, score);
  }, [data]);

  return (
    <AccordionFormLayout
      title="Business Event"
      subtitle="Record a business or venture"
      sections={SECTIONS}
      data={data}
      onChange={setData}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      lastSaved={lastSaved}
      isDirty={isDirty}
      completionPercentage={completion}
      eventType={eventType || 'BUSINESS'}
    >
      {(activeSection: string) => (
        <>
          {activeSection === 'general' && (
            <div className="space-y-4">
              <TextInput label="Event Title" required placeholder="e.g. Founding of Acme Corp" value={data.title} onChange={(v) => update('title', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateInput label="Registration Date" required value={data.registrationDate} onChange={(v) => update('registrationDate', v)} />
                <TextInput label="Location" placeholder="e.g. San Francisco, CA" value={data.location} onChange={(v) => update('location', v)} />
              </div>
              <TextInput label="Website" type="url" placeholder="https://www.example.com" value={data.website} onChange={(v) => update('website', v)} />
            </div>
          )}

          {activeSection === 'business' && (
            <div className="space-y-4">
              <TextInput label="Business Name" placeholder="e.g. Acme Corporation" value={data.businessName} onChange={(v) => update('businessName', v)} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Business Type" placeholder="e.g. Tech Startup" value={data.businessType} onChange={(v) => update('businessType', v)} />
                <TextInput label="Industry" placeholder="e.g. Software" value={data.industry} onChange={(v) => update('industry', v)} />
              </div>
              <Select label="Legal Structure" options={LEGAL_STRUCTURES} value={data.legalStructure} onChange={(v) => update('legalStructure', v)} placeholder="Select structure" />
            </div>
          )}

          {activeSection === 'operations' && (
            <div className="space-y-4">
              <TextArea label="Products / Services" placeholder="Describe products and services offered" value={data.productsServices} onChange={(v) => update('productsServices', v)} rows={4} />
              <TextInput label="Target Market" placeholder="e.g. Small businesses in North America" value={data.targetMarket} onChange={(v) => update('targetMarket', v)} />
              <TextInput label="Employee Count" type="number" placeholder="e.g. 50" value={data.employeeCount} onChange={(v) => update('employeeCount', v)} />
            </div>
          )}

          {activeSection === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Initial Investment" type="number" placeholder="e.g. 250000" value={data.initialInvestment} onChange={(v) => update('initialInvestment', v)} />
                <Select label="Currency" options={CURRENCIES} value={data.currency} onChange={(v) => update('currency', v)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="Annual Revenue" type="number" placeholder="e.g. 5000000" value={data.annualRevenue} onChange={(v) => update('annualRevenue', v)} />
                <TextInput label="Profit Margin" placeholder="e.g. 15%" value={data.profitMargin} onChange={(v) => update('profitMargin', v)} />
              </div>
            </div>
          )}

          {activeSection === 'people' && (
            <div className="space-y-4">
              <TextArea label="Co-Founders" placeholder="List co-founders and their roles" value={data.coFounders} onChange={(v) => update('coFounders', v)} rows={4} />
              <TextArea label="Partners" placeholder="List key partners and their contributions" value={data.partners} onChange={(v) => update('partners', v)} rows={4} />
            </div>
          )}

          {activeSection === 'milestones' && (
            <div className="space-y-4">
              <TextArea label="Key Achievements" placeholder="List major milestones and achievements" value={data.keyAchievements} onChange={(v) => update('keyAchievements', v)} rows={4} />
              <TextArea label="Growth Timeline" placeholder="Describe the growth trajectory" value={data.growthTimeline} onChange={(v) => update('growthTimeline', v)} rows={4} />
            </div>
          )}

          {activeSection === 'legal' && (
            <div className="space-y-4">
              <TextInput label="Registration Number" placeholder="e.g. EIN 12-3456789" value={data.registrationNumber} onChange={(v) => update('registrationNumber', v)} />
              <TextInput label="Tax ID" placeholder="e.g. 12-3456789" value={data.taxId} onChange={(v) => update('taxId', v)} />
              <TextArea label="Licenses" placeholder="List business licenses" value={data.licenses} onChange={(v) => update('licenses', v)} rows={3} />
              <TextArea label="Permits" placeholder="List required permits" value={data.permits} onChange={(v) => update('permits', v)} rows={3} />
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
                  {data.businessName && <p><span className="font-medium text-slate-700 dark:text-slate-300">Business:</span> {data.businessName}</p>}
                  {data.industry && <p><span className="font-medium text-slate-700 dark:text-slate-300">Industry:</span> {data.industry}</p>}
                  {data.legalStructure && <p><span className="font-medium text-slate-700 dark:text-slate-300">Structure:</span> {data.legalStructure}</p>}
                  {data.registrationDate && <p><span className="font-medium text-slate-700 dark:text-slate-300">Registered:</span> {data.registrationDate}</p>}
                  {data.location && <p><span className="font-medium text-slate-700 dark:text-slate-300">Location:</span> {data.location}</p>}
                  {data.initialInvestment && <p><span className="font-medium text-slate-700 dark:text-slate-300">Investment:</span> {data.currency} {data.initialInvestment}</p>}
                  {data.annualRevenue && <p><span className="font-medium text-slate-700 dark:text-slate-300">Revenue:</span> {data.currency} {data.annualRevenue}</p>}
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
