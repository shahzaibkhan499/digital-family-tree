import { Injectable, NotFoundException } from '@nestjs/common';

export interface EventTemplate {
  eventType: string;
  requiredFields: string[];
  optionalFields: string[];
  defaultVisibility: string;
  defaultCategory: string;
  documents: string[];
  notifications: { immediate?: boolean; hours24?: boolean; days7?: boolean; days30?: boolean };
  color: string;
  icon: string;
  description: string;
}

@Injectable()
export class EventTemplateService {
  private readonly templates: Record<string, EventTemplate> = {
    BIRTH: {
      eventType: 'BIRTH',
      requiredFields: ['title', 'date'],
      optionalFields: ['time', 'location', 'venue', 'memberId', 'description'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Life Event',
      documents: ['Birth Certificate', 'Hospital Record', 'Vaccination Card'],
      notifications: { immediate: true, days7: true },
      color: 'green',
      icon: 'baby',
      description: 'Record the birth of a family member',
    },
    DEATH: {
      eventType: 'DEATH',
      requiredFields: ['title', 'date'],
      optionalFields: ['time', 'location', 'venue', 'memberId', 'description'],
      defaultVisibility: 'CLAN',
      defaultCategory: 'Life Event',
      documents: ['Death Certificate', 'Obituary'],
      notifications: { immediate: true },
      color: 'gray',
      icon: 'heart-broken',
      description: 'Record the passing of a family member',
    },
    MARRIAGE: {
      eventType: 'MARRIAGE',
      requiredFields: ['title', 'date', 'memberId'],
      optionalFields: ['time', 'location', 'venue', 'description'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Life Event',
      documents: ['Marriage Certificate', 'Wedding Photos'],
      notifications: { immediate: true, days30: true },
      color: 'pink',
      icon: 'ring',
      description: 'Record a marriage event',
    },
    ENGAGEMENT: {
      eventType: 'ENGAGEMENT',
      requiredFields: ['title', 'date', 'memberId'],
      optionalFields: ['time', 'location', 'venue', 'description'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Life Event',
      documents: ['Engagement Photos'],
      notifications: { immediate: true },
      color: 'rose',
      icon: 'ring',
      description: 'Record an engagement',
    },
    DIVORCE: {
      eventType: 'DIVORCE',
      requiredFields: ['title', 'date'],
      optionalFields: ['description', 'memberId'],
      defaultVisibility: 'ONLY_ME',
      defaultCategory: 'Life Event',
      documents: ['Divorce Decree'],
      notifications: {},
      color: 'slate',
      icon: 'document',
      description: 'Record a divorce',
    },
    GRADUATION: {
      eventType: 'GRADUATION',
      requiredFields: ['title', 'date'],
      optionalFields: ['time', 'location', 'venue', 'memberId', 'description'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Education',
      documents: ['Diploma', 'Transcript'],
      notifications: { immediate: true },
      color: 'blue',
      icon: 'academic-cap',
      description: 'Record a graduation achievement',
    },
    EDUCATION: {
      eventType: 'EDUCATION',
      requiredFields: ['title'],
      optionalFields: ['date', 'location', 'venue', 'memberId', 'description'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Education',
      documents: ['Certificate'],
      notifications: {},
      color: 'blue',
      icon: 'book-open',
      description: 'Record an education milestone',
    },
    JOB: {
      eventType: 'JOB',
      requiredFields: ['title'],
      optionalFields: ['company', 'description', 'date', 'memberId'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Career',
      documents: [],
      notifications: { immediate: true },
      color: 'purple',
      icon: 'briefcase',
      description: 'Record a new job or career milestone',
    },
    PROMOTION: {
      eventType: 'PROMOTION',
      requiredFields: ['title'],
      optionalFields: ['date', 'description', 'memberId'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Career',
      documents: [],
      notifications: { immediate: true },
      color: 'indigo',
      icon: 'arrow-up',
      description: 'Record a promotion',
    },
    RETIREMENT: {
      eventType: 'RETIREMENT',
      requiredFields: ['title', 'date'],
      optionalFields: ['description', 'memberId'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Career',
      documents: [],
      notifications: { immediate: true },
      color: 'amber',
      icon: 'sun',
      description: 'Record a retirement',
    },
    BUSINESS_OPENING: {
      eventType: 'BUSINESS_OPENING',
      requiredFields: ['title', 'date', 'location'],
      optionalFields: ['description', 'venue'],
      defaultVisibility: 'PUBLIC',
      defaultCategory: 'Business',
      documents: ['Business License'],
      notifications: { immediate: true },
      color: 'emerald',
      icon: 'building-storefront',
      description: 'Record a business opening',
    },
    BUSINESS_CLOSING: {
      eventType: 'BUSINESS_CLOSING',
      requiredFields: ['title', 'date'],
      optionalFields: ['location', 'description'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Business',
      documents: [],
      notifications: {},
      color: 'red',
      icon: 'x-circle',
      description: 'Record a business closing',
    },
    HOUSE_PURCHASE: {
      eventType: 'HOUSE_PURCHASE',
      requiredFields: ['title', 'date', 'location'],
      optionalFields: ['description', 'venue'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Milestone',
      documents: ['Property Deed', 'Title Insurance'],
      notifications: { immediate: true },
      color: 'teal',
      icon: 'home',
      description: 'Record a house or property purchase',
    },
    MIGRATION: {
      eventType: 'MIGRATION',
      requiredFields: ['title', 'date', 'location'],
      optionalFields: ['description'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Life Event',
      documents: ['Visa', 'Passport'],
      notifications: { immediate: true },
      color: 'cyan',
      icon: 'globe-alt',
      description: 'Record a migration or relocation',
    },
    AWARD: {
      eventType: 'AWARD',
      requiredFields: ['title', 'date'],
      optionalFields: ['location', 'description', 'memberId'],
      defaultVisibility: 'PUBLIC',
      defaultCategory: 'Achievement',
      documents: ['Award Certificate'],
      notifications: { immediate: true },
      color: 'amber',
      icon: 'trophy',
      description: 'Record an award or achievement',
    },
    MILITARY_SERVICE: {
      eventType: 'MILITARY_SERVICE',
      requiredFields: ['title', 'date'],
      optionalFields: ['description', 'memberId'],
      defaultVisibility: 'CLAN',
      defaultCategory: 'Service',
      documents: ['Service Record', 'Discharge Papers'],
      notifications: {},
      color: 'green',
      icon: 'shield-check',
      description: 'Record military service',
    },
    PILGRIMAGE: {
      eventType: 'PILGRIMAGE',
      requiredFields: ['title', 'date', 'location'],
      optionalFields: ['description', 'memberId'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Spiritual',
      documents: [],
      notifications: { immediate: true },
      color: 'yellow',
      icon: 'map',
      description: 'Record a pilgrimage or spiritual journey',
    },
    ILLNESS: {
      eventType: 'ILLNESS',
      requiredFields: ['title'],
      optionalFields: ['description', 'medicalNotes', 'date', 'memberId'],
      defaultVisibility: 'ONLY_ME',
      defaultCategory: 'Health',
      documents: [],
      notifications: {},
      color: 'red',
      icon: 'heart',
      description: 'Record an illness',
    },
    SURGERY: {
      eventType: 'SURGERY',
      requiredFields: ['title', 'date'],
      optionalFields: ['hospital', 'doctor', 'description', 'memberId'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Health',
      documents: [],
      notifications: { immediate: true },
      color: 'red',
      icon: 'medical-bag',
      description: 'Record a surgery',
    },
    RECOVERY: {
      eventType: 'RECOVERY',
      requiredFields: ['title', 'date'],
      optionalFields: ['description', 'memberId'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Health',
      documents: [],
      notifications: { immediate: true },
      color: 'green',
      icon: 'check-circle',
      description: 'Record a recovery milestone',
    },
    FUNERAL: {
      eventType: 'FUNERAL',
      requiredFields: ['title', 'date', 'location'],
      optionalFields: ['description', 'venue'],
      defaultVisibility: 'CLAN',
      defaultCategory: 'Life Event',
      documents: [],
      notifications: { immediate: true, days7: true },
      color: 'gray',
      icon: 'heart-broken',
      description: 'Record a funeral or memorial service',
    },
    FAMILY_REUNION: {
      eventType: 'FAMILY_REUNION',
      requiredFields: ['title', 'date', 'location'],
      optionalFields: ['description', 'venue', 'time'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Gathering',
      documents: [],
      notifications: { immediate: true, days30: true },
      color: 'emerald',
      icon: 'users',
      description: 'Record a family reunion event',
    },
    COMMUNITY_EVENT: {
      eventType: 'COMMUNITY_EVENT',
      requiredFields: ['title', 'date'],
      optionalFields: ['location', 'description', 'venue'],
      defaultVisibility: 'COMMUNITY',
      defaultCategory: 'Community',
      documents: [],
      notifications: { immediate: true },
      color: 'violet',
      icon: 'building-community',
      description: 'Record a community event',
    },
    HISTORICAL_EVENT: {
      eventType: 'HISTORICAL_EVENT',
      requiredFields: ['title', 'date'],
      optionalFields: ['location', 'description'],
      defaultVisibility: 'PUBLIC',
      defaultCategory: 'Historical',
      documents: [],
      notifications: {},
      color: 'amber',
      icon: 'book-open',
      description: 'Record a historical event',
    },
    CUSTOM_EVENT: {
      eventType: 'CUSTOM_EVENT',
      requiredFields: ['title'],
      optionalFields: ['date', 'time', 'location', 'venue', 'description', 'eventType', 'category'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Custom',
      documents: [],
      notifications: {},
      color: 'slate',
      icon: 'pencil',
      description: 'Create a custom event',
    },
    ANNIVERSARY: {
      eventType: 'ANNIVERSARY',
      requiredFields: ['title', 'date'],
      optionalFields: ['description', 'memberId', 'location'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Life Event',
      documents: [],
      notifications: { immediate: true, days30: true },
      color: 'rose',
      icon: 'heart',
      description: 'Record an anniversary',
    },
    BIRTHDAY: {
      eventType: 'BIRTHDAY',
      requiredFields: ['title', 'date'],
      optionalFields: ['description', 'memberId', 'location'],
      defaultVisibility: 'FAMILY',
      defaultCategory: 'Life Event',
      documents: [],
      notifications: { immediate: true, days30: true },
      color: 'pink',
      icon: 'cake',
      description: 'Record a birthday',
    },
  };

  getTemplate(eventType: string): EventTemplate {
    const template = this.templates[eventType];
    if (!template) {
      throw new NotFoundException(`Template not found for event type: ${eventType}`);
    }
    return template;
  }

  getAllTemplates(): Record<string, EventTemplate> {
    return this.templates;
  }

  getRequiredFields(eventType: string): string[] {
    return this.getTemplate(eventType).requiredFields;
  }

  validateEventData(
    eventType: string,
    data: Record<string, unknown>,
  ): { valid: boolean; missingFields: string[] } {
    const template = this.getTemplate(eventType);
    const missingFields: string[] = [];

    for (const field of template.requiredFields) {
      const value = data[field];
      if (value === undefined || value === null || value === '') {
        missingFields.push(field);
      }
    }

    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }
}
