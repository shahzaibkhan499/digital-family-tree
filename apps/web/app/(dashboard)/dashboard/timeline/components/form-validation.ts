export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

export interface FieldValidation {
  [fieldName: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [fieldName: string]: string };
  warnings: { [fieldName: string]: string };
}

export function validateField(value: unknown, rules: ValidationRule): string | null {
  if (rules.required && (value === undefined || value === null || value === '')) {
    return 'This field is required';
  }
  if (value && rules.minLength && String(value).length < rules.minLength) {
    return `Minimum ${rules.minLength} characters`;
  }
  if (value && rules.maxLength && String(value).length > rules.maxLength) {
    return `Maximum ${rules.maxLength} characters`;
  }
  if (value !== undefined && rules.min !== undefined && Number(value) < rules.min) {
    return `Minimum value is ${rules.min}`;
  }
  if (value !== undefined && rules.max !== undefined && Number(value) > rules.max) {
    return `Maximum value is ${rules.max}`;
  }
  if (value && rules.pattern && !rules.pattern.test(String(value))) {
    return 'Invalid format';
  }
  if (value && rules.custom) {
    return rules.custom(value);
  }
  return null;
}

export function validateForm(data: Record<string, unknown>, rules: FieldValidation): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const error = validateField(data[field], rule);
    if (error) errors[field] = error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

export const EVENT_VALIDATION_RULES: Record<string, FieldValidation> = {
  BIRTH: {
    title: { required: true, minLength: 1, maxLength: 200 },
    date: { required: true },
  },
  MARRIAGE: {
    title: { required: true, minLength: 1, maxLength: 200 },
    date: { required: true },
  },
  DEATH: {
    title: { required: true, minLength: 1, maxLength: 200 },
    date: { required: true },
  },
  EDUCATION: {
    title: { required: true, minLength: 1, maxLength: 200 },
    date: { required: true },
  },
  JOB: {
    title: { required: true, minLength: 1, maxLength: 200 },
    date: { required: true },
  },
  MIGRATION: {
    title: { required: true, minLength: 1, maxLength: 200 },
    date: { required: true },
  },
  MILITARY_SERVICE: {
    title: { required: true, minLength: 1, maxLength: 200 },
    date: { required: true },
  },
  AWARD: {
    title: { required: true, minLength: 1, maxLength: 200 },
    date: { required: true },
  },
  BUSINESS: {
    title: { required: true, minLength: 1, maxLength: 200 },
    date: { required: true },
  },
};

export async function detectDuplicates(
  data: Record<string, unknown>,
  api: { timeline: { search: (q: string, page: number, limit: number) => Promise<{ events: Record<string, unknown>[] }> } },
): Promise<{ isDuplicate: boolean; existingEvents: Record<string, unknown>[] }> {
  const title = data.title;
  if (typeof title !== 'string' || title.length < 3) return { isDuplicate: false, existingEvents: [] };

  try {
    const results = await api.timeline.search(title, 1, 5);
    const events = results?.events || [];

    const duplicates = events.filter((e) => {
      if (e.eventType !== data.eventType) return false;
      const eDate = e.date;
      const dDate = data.date;
      if (typeof eDate === 'string' && typeof dDate === 'string') {
        const diff = Math.abs(new Date(eDate).getTime() - new Date(dDate).getTime());
        if (diff < 86400000) return true;
      }
      const eTitle = typeof e.title === 'string' ? e.title.toLowerCase() : '';
      const dTitle = typeof title === 'string' ? title.toLowerCase() : '';
      if (eTitle === dTitle) return true;
      if (eTitle.includes(dTitle) || dTitle.includes(eTitle)) return true;
      return false;
    });

    return { isDuplicate: duplicates.length > 0, existingEvents: duplicates };
  } catch {
    return { isDuplicate: false, existingEvents: [] };
  }
}
