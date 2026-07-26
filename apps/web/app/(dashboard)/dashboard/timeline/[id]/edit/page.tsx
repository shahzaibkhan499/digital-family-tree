'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, Loader2,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import EventFormLayout from '../../components/event-form-layout';
import {
  GeneralSection, PeopleSection, MediaSection, DocumentsSection,
  PrivacySection, NotificationsSection, ReviewSection, PublishSection,
} from '../../components/event-form-sections';
import { useEventFormAutoSave } from '../../components/event-form-auto-save';
import BirthEventForm from '../../components/birth-event-form';
import MarriageEventForm from '../../components/marriage-event-form';
import DeathEventForm from '../../components/death-event-form';
import EducationEventForm from '../../components/education-event-form';
import EmploymentEventForm from '../../components/employment-event-form';
import MigrationEventForm from '../../components/migration-event-form';
import MilitaryEventForm from '../../components/military-event-form';
import AwardEventForm from '../../components/award-event-form';
import BusinessEventForm from '../../components/business-event-form';
import GenericEventForm from '../../components/generic-event-form';

const SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'people', label: 'People' },
  { id: 'media', label: 'Media' },
  { id: 'documents', label: 'Documents' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'review', label: 'Review' },
  { id: 'publish', label: 'Publish' },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

const DEDICATED_FORMS: Record<string, React.ComponentType<any>> = {
  BIRTH: BirthEventForm,
  MARRIAGE: MarriageEventForm,
  ENGAGEMENT: MarriageEventForm,
  DEATH: DeathEventForm,
  EDUCATION: EducationEventForm,
  GRADUATION: EducationEventForm,
  JOB: EmploymentEventForm,
  PROMOTION: EmploymentEventForm,
  CAREER: EmploymentEventForm,
  RETIREMENT: EmploymentEventForm,
  MIGRATION: MigrationEventForm,
  MILITARY_SERVICE: MilitaryEventForm,
  AWARD: AwardEventForm,
  BUSINESS: BusinessEventForm,
};

function SkeletonEdit() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 h-5 w-48 mb-6" />
      <div className="animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 h-20 w-full" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 h-96 w-full" />
        </div>
        <div className="space-y-4">
          <div className="animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentSection, setCurrentSection] = useState<SectionId>('general');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Record<string, any>>({
    eventType: 'CUSTOM_EVENT',
    title: '', subtitle: '', description: '',
    category: '', date: '', endDate: '', time: '', isAllDay: false,
    timezone: 'UTC', language: 'en', country: '', location: '', venue: '',
    mapLink: '', coordinates: '',
    familyId: '', memberId: '', participantIds: [],
    coverImage: '', media: [],
    documents: [],
    visibility: 'FAMILY', hideFromPublic: false, restrictScreenshots: false,
    notificationChannels: ['IN_APP'], notificationAudience: 'FAMILY',
    notificationMessage: '', scheduleNotification: false,
    notificationScheduleDate: '', notificationScheduleTime: '',
    tags: [], keywords: [],
    status: 'DRAFT', featured: false, pinned: false, verified: false,
    scheduleDate: '', scheduleTime: '',
  });

  const fetchedRef = useRef(false);

  const completionPercent = useCallback(() => {
    let score = 0;
    if (formData.title) score += 15;
    if (formData.date) score += 10;
    if (formData.category) score += 5;
    if (formData.familyId) score += 10;
    if ((formData.participantIds || []).length > 0) score += 5;
    if (formData.coverImage || (formData.media || []).length > 0) score += 10;
    if ((formData.media || []).length > 0) score += 5;
    if ((formData.documents || []).length > 0) score += 10;
    if (formData.visibility && formData.visibility !== 'FAMILY') score += 5;
    else if (formData.visibility) score += 5;
    if ((formData.notificationChannels || []).length > 0) score += 10;
    if (formData.tags && formData.tags.length > 0) score += 5;
    if (formData.status) score += 10;
    return Math.min(100, score);
  }, [formData]);

  const { save, lastSaved, isSaving: autoSaving, hasUnsavedChanges } = useEventFormAutoSave({
    data: formData,
    draftId: eventId,
    interval: 8000,
    enabled: !loading && !error,
  });

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    const load = async () => {
      try {
        const event = await api.timeline.get(eventId);
        if (event) {
          setFormData((prev) => ({
            ...prev,
            eventType: event.eventType || prev.eventType,
            title: event.title || '',
            subtitle: event.subtitle || '',
            description: event.description || '',
            category: event.category || '',
            date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
            endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
            time: event.time || '',
            isAllDay: event.isAllDay || false,
            timezone: event.timezone || 'UTC',
            language: event.language || 'en',
            country: event.country || '',
            location: event.location || '',
            venue: event.venue || '',
            mapLink: event.mapLink || '',
            coordinates: event.coordinates || '',
            familyId: event.familyId || '',
            memberId: event.memberId || '',
            participantIds: event.participantIds || (event.participants || []).map((p: any) => p.memberId || p.id) || [],
            coverImage: event.coverImage || '',
            media: event.media || [],
            documents: event.documents || [],
            visibility: event.visibility || 'FAMILY',
            hideFromPublic: event.hideFromPublic || false,
            restrictScreenshots: event.restrictScreenshots || false,
            notificationChannels: event.notificationChannels || ['IN_APP'],
            notificationAudience: event.notificationAudience || 'FAMILY',
            notificationMessage: event.notificationMessage || '',
            scheduleNotification: event.scheduleNotification || false,
            notificationScheduleDate: event.notificationScheduleDate || '',
            notificationScheduleTime: event.notificationScheduleTime || '',
            tags: event.tags || [],
            keywords: event.keywords || [],
            status: event.status || 'DRAFT',
            featured: event.featured || false,
            pinned: event.pinned || false,
            verified: event.verified || false,
            scheduleDate: event.scheduleDate || '',
            scheduleTime: event.scheduleTime || '',
          }));
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.title?.trim()) errs.title = 'Title is required';
    if (!formData.date) errs.date = 'Date is required';
    if (!formData.category) errs.category = 'Category is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const section = SECTIONS.find((s) => {
          if (s.id === 'general') return ['title', 'date', 'category', 'subtitle', 'description'].includes(firstErrorField);
          if (s.id === 'people') return ['familyId', 'memberId'].includes(firstErrorField);
          if (s.id === 'privacy') return ['visibility'].includes(firstErrorField);
          if (s.id === 'publish') return ['status'].includes(firstErrorField);
          return false;
        });
        if (section) setCurrentSection(section.id as SectionId);
      }
      return;
    }
    setSaving(true);
    try {
      await api.timeline.update(eventId, {
        eventType: formData.eventType,
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        category: formData.category,
        date: formData.date ? new Date(formData.date).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        time: formData.time,
        isAllDay: formData.isAllDay,
        timezone: formData.timezone,
        language: formData.language,
        country: formData.country,
        location: formData.location,
        venue: formData.venue,
        mapLink: formData.mapLink,
        coordinates: formData.coordinates,
        familyId: formData.familyId || undefined,
        memberId: formData.memberId || undefined,
        participantIds: formData.participantIds,
        coverImage: formData.coverImage,
        media: (formData.media || []).filter((m: any) => m.url),
        documents: formData.documents,
        visibility: formData.visibility,
        hideFromPublic: formData.hideFromPublic,
        restrictScreenshots: formData.restrictScreenshots,
        notificationChannels: formData.notificationChannels,
        notificationAudience: formData.notificationAudience,
        notificationMessage: formData.notificationMessage,
        scheduleNotification: formData.scheduleNotification,
        notificationScheduleDate: formData.notificationScheduleDate,
        notificationScheduleTime: formData.notificationScheduleTime,
        tags: formData.tags,
        keywords: formData.keywords,
        status: formData.status,
        featured: formData.featured,
        pinned: formData.pinned,
        verified: formData.verified,
        scheduleDate: formData.scheduleDate,
        scheduleTime: formData.scheduleTime,
      });
      router.push(`/dashboard/timeline/${eventId}`);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save:', err);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setFormData((prev) => ({ ...prev, status: 'PUBLISHED' }));
    await handleSave();
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) return;
    }
    router.push(`/dashboard/timeline/${eventId}`);
  };

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const updateFormData = (patch: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const navigateToSection = (sectionId: string) => {
    setCurrentSection(sectionId as SectionId);
  };

  if (loading) return <SkeletonEdit />;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Event Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">The event you're trying to edit doesn't exist or has been removed.</p>
        <button
          onClick={() => router.push('/dashboard/timeline')}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Timeline
        </button>
      </div>
    );
  }

  return (
    <EventFormLayout
      eventType={formData.eventType}
      eventId={eventId}
      currentSection={currentSection}
      completionPercent={completionPercent()}
      isSaving={saving || autoSaving}
      lastSaved={lastSaved}
      errors={errors}
      onSave={handleSave}
      onPreview={() => router.push(`/dashboard/timeline/${eventId}`)}
      onPublish={handlePublish}
      onCancel={handleCancel}
      onNavigateToSection={navigateToSection}
    >
      {(() => {
        const DedicatedForm = DEDICATED_FORMS[formData.eventType];
        if (DedicatedForm) {
          return (
            <DedicatedForm
              eventType={formData.eventType}
              onComplete={() => router.push(`/dashboard/timeline/${eventId}`)}
            />
          );
        }
        return (
          <>
            {currentSection === 'general' && (
              <GeneralSection data={formData} onUpdate={updateFormData} errors={errors} />
            )}
            {currentSection === 'people' && (
              <PeopleSection data={formData} onUpdate={updateFormData} errors={errors} />
            )}
            {currentSection === 'media' && (
              <MediaSection data={formData} onUpdate={updateFormData} errors={errors} />
            )}
            {currentSection === 'documents' && (
              <DocumentsSection data={formData} onUpdate={updateFormData} errors={errors} />
            )}
            {currentSection === 'privacy' && (
              <PrivacySection data={formData} onUpdate={updateFormData} errors={errors} />
            )}
            {currentSection === 'notifications' && (
              <NotificationsSection data={formData} onUpdate={updateFormData} errors={errors} />
            )}
            {currentSection === 'review' && (
              <ReviewSection data={formData} errors={errors} onNavigateToSection={navigateToSection} />
            )}
            {currentSection === 'publish' && (
              <PublishSection data={formData} onUpdate={updateFormData} errors={errors} />
            )}
          </>
        );
      })()}
    </EventFormLayout>
  );
}
