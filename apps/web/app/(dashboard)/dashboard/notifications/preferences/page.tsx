'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

function Toggle({ enabled, onChange, label, description }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button onClick={() => onChange(!enabled)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${enabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.notifications.preferences.get().then((p) => { setPrefs(p); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const updatePref = async (key: string, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    try {
      await api.notifications.preferences.update({ [key]: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* empty */ }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-2xl bg-slate-200 dark:bg-slate-700" />)}
        </div>
      </div>
    );
  }

  if (!prefs) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notification Preferences</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose what notifications you want to receive</p>
        </div>
        <Link href="/dashboard/notifications" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-all">
          Back to Notifications
        </Link>
      </div>

      {saved && (
        <div className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          Preferences saved successfully
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Channels</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Control how you receive notifications</p>
        </div>
        <div className="px-6">
          <Toggle enabled={prefs.inAppNotifications} onChange={(v) => updatePref('inAppNotifications', v)} label="In-App Notifications" description="Notifications within the app" />
          <Toggle enabled={prefs.emailNotifications} onChange={(v) => updatePref('emailNotifications', v)} label="Email Notifications" description="Receive notifications via email" />
          <Toggle enabled={prefs.pushNotifications} onChange={(v) => updatePref('pushNotifications', v)} label="Push Notifications" description="Browser and mobile push notifications" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Categories</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Choose which notification types you want</p>
        </div>
        <div className="px-6">
          <Toggle enabled={prefs.birthdayReminders} onChange={(v) => updatePref('birthdayReminders', v)} label="Birthday Reminders" description="Get reminded about upcoming birthdays" />
          <Toggle enabled={prefs.anniversaryReminders} onChange={(v) => updatePref('anniversaryReminders', v)} label="Anniversary Reminders" description="Get reminded about death anniversaries" />
          <Toggle enabled={prefs.invitationNotifications} onChange={(v) => updatePref('invitationNotifications', v)} label="Invitation Notifications" description="Notifications about family invitations" />
          <Toggle enabled={prefs.familyUpdates} onChange={(v) => updatePref('familyUpdates', v)} label="Family Updates" description="Member changes, document uploads, and other family activity" />
          <Toggle enabled={prefs.securityAlerts} onChange={(v) => updatePref('securityAlerts', v)} label="Security Alerts" description="Login alerts, password changes, and suspicious activity" />
          <Toggle enabled={prefs.adminAnnouncements} onChange={(v) => updatePref('adminAnnouncements', v)} label="Admin Announcements" description="Important updates from the platform" />
          <Toggle enabled={prefs.marketingEmails} onChange={(v) => updatePref('marketingEmails', v)} label="Marketing" description="Product updates and special offers" />
        </div>
      </div>
    </div>
  );
}
