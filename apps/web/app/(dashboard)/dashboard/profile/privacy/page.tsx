'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const PRIVACY_FIELDS = [
  { fieldName: 'phone', label: 'Phone' },
  { fieldName: 'dateOfBirth', label: 'Date of Birth' },
  { fieldName: 'location', label: 'Location (City/Country)' },
  { fieldName: 'occupation', label: 'Occupation' },
  { fieldName: 'education', label: 'Education' },
  { fieldName: 'socialLinks', label: 'Social Links' },
  { fieldName: 'email', label: 'Email' },
  { fieldName: 'fullAddress', label: 'Full Address' },
  { fieldName: 'documents', label: 'Documents' },
  { fieldName: 'timeline', label: 'Timeline' },
  { fieldName: 'photos', label: 'Photos' },
  { fieldName: 'memories', label: 'Memories' },
  { fieldName: 'family', label: 'Family' },
  { fieldName: 'clan', label: 'Clan' },
];

const VISIBILITY_OPTIONS = [
  { value: 'ONLY_ME', label: 'Only Me' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'SUB_CLAN', label: 'Sub Clan' },
  { value: 'CLAN', label: 'Clan' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'PUBLIC', label: 'Public' },
];

export default function ProfilePrivacyPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api.profile.getFieldPrivacy()
      .then((data: any) => {
        const map: Record<string, string> = {};
        const fields = Array.isArray(data) ? data : data?.fields || [];
        fields.forEach((f: any) => {
          map[f.fieldName] = f.visibility;
        });
        PRIVACY_FIELDS.forEach(f => {
          if (!map[f.fieldName]) map[f.fieldName] = 'FAMILY';
        });
        setSettings(map);
      })
      .catch(() => {
        const defaults: Record<string, string> = {};
        PRIVACY_FIELDS.forEach(f => { defaults[f.fieldName] = 'FAMILY'; });
        setSettings(defaults);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleFieldChange = (fieldName: string, visibility: string) => {
    setSettings(prev => ({ ...prev, [fieldName]: visibility }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const fields = PRIVACY_FIELDS.map(f => ({
        fieldName: f.fieldName,
        visibility: settings[f.fieldName] || 'FAMILY',
      }));
      await api.profile.updateFieldPrivacy(fields);
      setMessage('Privacy settings saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/dashboard/settings" className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
        â† Back to Settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Privacy Settings</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Control who can see each field of your profile
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Field Visibility</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Choose who can see each piece of information on your profile</p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {PRIVACY_FIELDS.map(field => (
            <div key={field.fieldName} className="flex items-center justify-between px-6 py-4">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</span>
              <select
                value={settings[field.fieldName] || 'FAMILY'}
                onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {VISIBILITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save Privacy Settings'}
        </button>
        <Link href="/dashboard/settings" className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          Cancel
        </Link>
      </div>
    </div>
  );
}
