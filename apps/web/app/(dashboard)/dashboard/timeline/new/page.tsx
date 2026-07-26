'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { EVENT_TYPE_CONFIG, EVENT_CATEGORIES } from '../components/constants';
import BirthEventForm from '../components/birth-event-form';
import MarriageEventForm from '../components/marriage-event-form';
import DeathEventForm from '../components/death-event-form';
import EducationEventForm from '../components/education-event-form';
import EmploymentEventForm from '../components/employment-event-form';
import MigrationEventForm from '../components/migration-event-form';
import MilitaryEventForm from '../components/military-event-form';
import AwardEventForm from '../components/award-event-form';
import BusinessEventForm from '../components/business-event-form';
import EngagementEventForm from '../components/engagement-event-form';
import DivorceEventForm from '../components/divorce-event-form';
import GraduationEventForm from '../components/graduation-event-form';
import PromotionEventForm from '../components/promotion-event-form';
import HousePurchaseEventForm from '../components/house-purchase-event-form';
import HajjUmrahEventForm from '../components/hajj-umrah-event-form';
import MilitaryAchievementEventForm from '../components/military-achievement-event-form';
import BirthdayEventForm from '../components/birthday-event-form';
import AnniversaryEventForm from '../components/anniversary-event-form';
import FamilyReunionEventForm from '../components/family-reunion-event-form';
import ClanGatheringEventForm from '../components/clan-gathering-event-form';
import CommunityEventForm from '../components/community-event-form';
import GenericEventForm from '../components/generic-event-form';

const DEDICATED_FORMS: Record<string, React.ComponentType<any>> = {
  BIRTH: BirthEventForm,
  MARRIAGE: MarriageEventForm,
  ENGAGEMENT: EngagementEventForm,
  DEATH: DeathEventForm,
  EDUCATION: EducationEventForm,
  GRADUATION: GraduationEventForm,
  JOB: EmploymentEventForm,
  PROMOTION: PromotionEventForm,
  CAREER: EmploymentEventForm,
  RETIREMENT: EmploymentEventForm,
  MIGRATION: MigrationEventForm,
  HOUSE_PURCHASE: HousePurchaseEventForm,
  MILITARY_SERVICE: MilitaryEventForm,
  MILITARY_ACHIEVEMENT: MilitaryAchievementEventForm,
  AWARD: AwardEventForm,
  BUSINESS: BusinessEventForm,
  DIVORCE: DivorceEventForm,
  HAJJ: HajjUmrahEventForm,
  UMRAH: HajjUmrahEventForm,
  BIRTHDAY: BirthdayEventForm,
  ANNIVERSARY: AnniversaryEventForm,
  FAMILY_REUNION: FamilyReunionEventForm,
  CLAN_GATHERING: ClanGatheringEventForm,
  COMMUNITY_EVENT: CommunityEventForm,
  ACHIEVEMENT: AwardEventForm,
};

const EVENT_TEMPLATES: Record<string, Partial<Record<string, any>>> = {
  BIRTH: {
    title: 'Birth of [Name]',
    duration: '1 day',
    requiredDocuments: ['Birth Certificate', 'Hospital Record'],
    defaultNotificationChannels: ['IN_APP', 'EMAIL'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Life',
  },
  DEATH: {
    title: 'Passing of [Name]',
    duration: '1 day',
    requiredDocuments: ['Death Certificate'],
    defaultNotificationChannels: ['IN_APP', 'EMAIL'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Life',
  },
  MARRIAGE: {
    title: 'Wedding of [Name] & [Name]',
    duration: '1 day',
    requiredDocuments: ['Marriage Certificate'],
    defaultNotificationChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Life',
  },
  ENGAGEMENT: {
    title: 'Engagement of [Name] & [Name]',
    duration: '1 day',
    requiredDocuments: [],
    defaultNotificationChannels: ['IN_APP', 'EMAIL'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Life',
  },
  GRADUATION: {
    title: 'Graduation of [Name]',
    duration: '1 day',
    requiredDocuments: ['Academic Diploma'],
    defaultNotificationChannels: ['IN_APP'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Education',
  },
  JOB: {
    title: 'New Position - [Name]',
    duration: '1 day',
    requiredDocuments: [],
    defaultNotificationChannels: ['IN_APP'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Career',
  },
  MIGRATION: {
    title: 'Migration - [From] to [To]',
    duration: '1 day',
    requiredDocuments: ['Passport', 'National ID'],
    defaultNotificationChannels: ['IN_APP'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Location',
  },
  HOUSE_PURCHASE: {
    title: 'House Purchase - [Location]',
    duration: '1 day',
    requiredDocuments: ['Property Deed'],
    defaultNotificationChannels: ['IN_APP'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Life',
  },
  AWARD: {
    title: 'Award - [Name]',
    duration: '1 day',
    requiredDocuments: [],
    defaultNotificationChannels: ['IN_APP'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Achievement',
  },
  FAMILY_REUNION: {
    title: 'Family Reunion [Year]',
    duration: '1 day',
    requiredDocuments: [],
    defaultNotificationChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Social',
  },
  BIRTHDAY: {
    title: "Birthday - [Name]'s [Age]th Birthday",
    duration: '1 day',
    requiredDocuments: [],
    defaultNotificationChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Life',
  },
  ANNIVERSARY: {
    title: 'Anniversary - [Name] & [Name]',
    duration: '1 day',
    requiredDocuments: [],
    defaultNotificationChannels: ['IN_APP', 'EMAIL'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Life',
  },
  MILITARY_SERVICE: {
    title: 'Military Service - [Name]',
    duration: 'Custom',
    requiredDocuments: ['Military Record'],
    defaultNotificationChannels: ['IN_APP'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Service',
  },
  TRAVEL: {
    title: 'Travel - [Destination]',
    duration: 'Custom',
    requiredDocuments: ['Passport'],
    defaultNotificationChannels: ['IN_APP'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Location',
  },
  MEDICAL: {
    title: 'Medical Event - [Description]',
    duration: '1 day',
    requiredDocuments: [],
    defaultNotificationChannels: ['IN_APP'],
    defaultVisibility: 'ONLY_ME',
    defaultCategory: 'Health',
  },
  RELIGIOUS_EVENT: {
    title: 'Religious Event - [Name]',
    duration: '1 day',
    requiredDocuments: [],
    defaultNotificationChannels: ['IN_APP', 'EMAIL'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Cultural',
  },
  RETIREMENT: {
    title: 'Retirement of [Name]',
    duration: '1 day',
    requiredDocuments: [],
    defaultNotificationChannels: ['IN_APP', 'EMAIL'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Career',
  },
  CUSTOM_EVENT: {
    title: '',
    duration: '1 day',
    requiredDocuments: [],
    defaultNotificationChannels: ['IN_APP'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Other',
  },
  DIVORCE: {
    title: 'Divorce of [Name] & [Name]',
    duration: '1 day',
    requiredDocuments: ['Divorce Decree'],
    defaultNotificationChannels: ['IN_APP'],
    defaultVisibility: 'ONLY_ME',
    defaultCategory: 'Life',
  },
  HAJJ: {
    title: 'Hajj Pilgrimage - [Year]',
    duration: '2 weeks',
    requiredDocuments: ['Passport', 'Visa', 'Hajj Certificate'],
    defaultNotificationChannels: ['IN_APP', 'EMAIL'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Cultural',
  },
  UMRAH: {
    title: 'Umrah Pilgrimage - [Year]',
    duration: '1 week',
    requiredDocuments: ['Passport', 'Visa'],
    defaultNotificationChannels: ['IN_APP', 'EMAIL'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Cultural',
  },
  MILITARY_ACHIEVEMENT: {
    title: 'Military Achievement - [Name]',
    duration: '1 day',
    requiredDocuments: ['Certificate'],
    defaultNotificationChannels: ['IN_APP'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Service',
  },
  CLAN_GATHERING: {
    title: 'Clan Gathering - [Clan Name]',
    duration: '1 day',
    requiredDocuments: [],
    defaultNotificationChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    defaultVisibility: 'CLAN',
    defaultCategory: 'Cultural',
  },
  COMMUNITY_EVENT: {
    title: 'Community Event - [Name]',
    duration: '1 day',
    requiredDocuments: [],
    defaultNotificationChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    defaultVisibility: 'COMMUNITY',
    defaultCategory: 'Social',
  },
  ACHIEVEMENT: {
    title: 'Achievement - [Name]',
    duration: '1 day',
    requiredDocuments: ['Certificate'],
    defaultNotificationChannels: ['IN_APP'],
    defaultVisibility: 'FAMILY',
    defaultCategory: 'Achievement',
  },
};

export default function NewEventPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [useTemplate, setUseTemplate] = useState(false);
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);

  const filtered = useMemo(() =>
    Object.entries(EVENT_TYPE_CONFIG as Record<string, any>).filter(([key, val]) => {
      const matchesSearch = !searchQuery ||
        val.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || val.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }), [searchQuery, selectedCategory]);

  if (selectedType) {
    const config = EVENT_TYPE_CONFIG[selectedType as keyof typeof EVENT_TYPE_CONFIG] as any;
    const template = EVENT_TEMPLATES[selectedType];

    return (
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => { setSelectedType(null); setUseTemplate(false); setShowTemplateInfo(false); }}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to event types
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${config.color}`}>
            {config.icon}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create {config.label}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Fill in the details for this {config.label.toLowerCase()} event</p>
          </div>
        </div>

        {template && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-800/40">
                  <Sparkles className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Use Template</span>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-500">
                    Pre-fill form with {config.label.toLowerCase()} defaults (title pattern, required docs, notification settings)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUseTemplate(!useTemplate)}
                className={`relative h-6 w-11 rounded-full p-0.5 transition-colors ${useTemplate ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${useTemplate ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <AnimatePresence>
              {useTemplate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {template.title && (
                      <div className="rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase">Title Pattern</p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{template.title}</p>
                      </div>
                    )}
                    {template.duration && (
                      <div className="rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase">Duration</p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{template.duration}</p>
                      </div>
                    )}
                    {template.requiredDocuments && template.requiredDocuments.length > 0 && (
                      <div className="rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase">Required Docs</p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{template.requiredDocuments.join(', ')}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowTemplateInfo(!showTemplateInfo)}
                    className="mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    {showTemplateInfo ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {showTemplateInfo ? 'Hide' : 'Show'} all template defaults
                  </button>
                  {showTemplateInfo && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 rounded-lg bg-white p-3 dark:bg-slate-900"
                    >
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Default Visibility: </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{template.defaultVisibility}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Category: </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{template.defaultCategory}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400">Notifications: </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{(template.defaultNotificationChannels || []).join(', ')}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {(() => {
          const DedicatedForm = DEDICATED_FORMS[selectedType!];
          return DedicatedForm ? (
            <DedicatedForm eventType={selectedType} onComplete={() => router.push('/dashboard/timeline')} />
          ) : (
            <GenericEventForm eventType={selectedType} onComplete={() => router.push('/dashboard/timeline')} />
          );
        })()}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Event</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select an event type to get started</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event types..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_CATEGORIES.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === c.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map(([key, config], i) => (
          <motion.button
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            whileHover={{ y: -2 }}
            onClick={() => setSelectedType(key)}
            className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${config.color}`}>
              {config.icon}
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">{config.label}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{config.category}</span>
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-500">No event types match your search</p>
        </div>
      )}
    </div>
  );
}
