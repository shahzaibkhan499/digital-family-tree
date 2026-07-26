'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'EspaÃ±ol' },
  { value: 'fr', label: 'FranÃ§ais' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'PortuguÃªs' },
  { value: 'ar', label: 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©' },
  { value: 'ur', label: 'Ø§Ø±Ø¯Ùˆ' },
  { value: 'zh', label: 'ä¸­æ–‡' },
  { value: 'ja', label: 'æ—¥æœ¬èªž' },
  { value: 'ko', label: 'í•œêµ­ì–´' },
  { value: 'hi', label: 'à¤¹à¤¿à¤¨à¥à¤¦à¥€' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export default function SettingsPage() {
  const { refreshUser } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [emailForm, setEmailForm] = useState({ email: '', currentPassword: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [preferences, setPreferences] = useState({ locale: 'en', timezone: 'UTC' });
  const [usernameForm, setUsernameForm] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await api.profile.getSettings();
      setSettings(data);
      setPreferences({ locale: data.locale || 'en', timezone: data.timezone || 'UTC' });
      setEmailForm({ email: data.email || '', currentPassword: '' });
      setUsernameForm(data.username || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePreferences() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.profile.updateSettings(preferences);
      setMessage('Preferences saved successfully');
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeEmail() {
    if (!emailForm.email || !emailForm.currentPassword) {
      setError('Email and current password are required');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.users.updateEmail({ email: emailForm.email, currentPassword: emailForm.currentPassword });
      setEmailForm({ email: emailForm.email, currentPassword: '' });
      setMessage('Email updated successfully');
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to update email');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError('Both passwords are required');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.users.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password changed successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  async function handleClaimUsername() {
    if (!usernameForm || usernameForm.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.profile.claimUsername({ username: usernameForm });
      setMessage('Username claimed successfully');
      await refreshUser();
      await loadSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to claim username');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Manage your account preferences and security
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

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Username</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Your public profile URL will be /member/{usernameForm || 'your-username'}
        </p>
        <div className="mt-4 flex gap-3">
          <input
            type="text"
            value={usernameForm}
            onChange={(e) => setUsernameForm(e.target.value)}
            disabled={!!settings?.username}
            placeholder="Choose a username"
            className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          {!settings?.username && (
            <button
              onClick={handleClaimUsername}
              disabled={saving || !usernameForm}
              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Claim
            </button>
          )}
        </div>
        {settings?.username && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Username: {settings.username} | Profile: /member/{settings.profileSlug || settings.username}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Change Email</h2>
        <div className="mt-4 space-y-3">
          <input
            type="email"
            value={emailForm.email}
            onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
            placeholder="New email address"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <input
            type="password"
            value={emailForm.currentPassword}
            onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
            placeholder="Current password to confirm"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            onClick={handleChangeEmail}
            disabled={saving || !emailForm.email || !emailForm.currentPassword}
            className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Update Email
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Change Password</h2>
        <div className="mt-4 space-y-3">
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            placeholder="Current password"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            placeholder="New password (min 6 characters)"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            placeholder="Confirm new password"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            onClick={handleChangePassword}
            disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword}
            className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Change Password
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Preferences</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Language</label>
            <select
              value={preferences.locale}
              onChange={(e) => setPreferences({ ...preferences, locale: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Privacy</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Control who can see each field of your profile
        </p>
        <div className="mt-4 flex gap-3">
          <a href="/dashboard/profile/privacy" className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            Profile Privacy Settings
          </a>
          <a href="/dashboard/profile" className="rounded-lg border border-slate-200 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            View Profile
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          disabled
          className="mt-4 rounded-lg border border-red-300 px-6 py-2 text-sm font-medium text-red-600 opacity-50 cursor-not-allowed dark:border-red-800 dark:text-red-400"
        >
          Delete Account (Coming Soon)
        </button>
      </div>
    </div>
  );
}
