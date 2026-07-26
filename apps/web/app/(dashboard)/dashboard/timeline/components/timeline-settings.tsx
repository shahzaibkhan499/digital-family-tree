'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Monitor, Sun, Moon, LayoutGrid, List, CalendarDays } from 'lucide-react';

interface TimelineSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Settings {
  defaultView: 'timeline' | 'calendar' | 'list';
  density: 'compact' | 'comfortable' | 'cozy';
  showCompleted: boolean;
  showCancelled: boolean;
  defaultVisibility: string;
  animations: boolean;
  colorTheme: 'auto' | 'light' | 'dark';
  eventReminders: boolean;
  digestFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
  lazyLoadImages: boolean;
  preloadCount: number;
}

const DEFAULT_SETTINGS: Settings = {
  defaultView: 'timeline',
  density: 'comfortable',
  showCompleted: true,
  showCancelled: false,
  defaultVisibility: 'FAMILY',
  animations: true,
  colorTheme: 'auto',
  eventReminders: true,
  digestFrequency: 'weekly',
  lazyLoadImages: true,
  preloadCount: 10,
};

const STORAGE_KEY = 'timeline-settings';

function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            value === opt.id
              ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/20 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function TimelineSettings({ isOpen, onClose }: TimelineSettingsProps) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadSettings());
      setSaved(false);
    }
  }, [isOpen]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const applySettings = useCallback((s: Settings) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    const root = document.documentElement;
    root.style.setProperty('--timeline-density', s.density === 'compact' ? '0.5rem' : s.density === 'cozy' ? '1.25rem' : '0.875rem');
    if (s.colorTheme === 'dark') {
      root.classList.add('dark');
    } else if (s.colorTheme === 'light') {
      root.classList.remove('dark');
    }
    if (s.animations) {
      root.style.setProperty('--animation-duration', '0.3s');
    } else {
      root.style.setProperty('--animation-duration', '0s');
    }
  }, []);

  const save = () => {
    applySettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    applySettings(DEFAULT_SETTINGS);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Timeline Settings</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Customize your timeline experience</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* View */}
              <section>
                <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">View</h3>
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Choose how your timeline is displayed</p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Default View</label>
                    <RadioGroup
                      options={[
                        { id: 'timeline' as const, label: 'Timeline', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
                        { id: 'calendar' as const, label: 'Calendar', icon: <CalendarDays className="h-3.5 w-3.5" /> },
                        { id: 'list' as const, label: 'List', icon: <List className="h-3.5 w-3.5" /> },
                      ]}
                      value={settings.defaultView}
                      onChange={(v) => update('defaultView', v)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Density</label>
                    <RadioGroup
                      options={[
                        { id: 'compact' as const, label: 'Compact' },
                        { id: 'comfortable' as const, label: 'Comfortable' },
                        { id: 'cozy' as const, label: 'Cozy' },
                      ]}
                      value={settings.density}
                      onChange={(v) => update('density', v)}
                    />
                  </div>
                </div>
              </section>

              {/* Display */}
              <section>
                <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">Display</h3>
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Control what appears in your timeline</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Show Completed Events</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Display events marked as completed</p>
                    </div>
                    <Toggle enabled={settings.showCompleted} onToggle={() => update('showCompleted', !settings.showCompleted)} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Show Cancelled Events</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Display events that were cancelled</p>
                    </div>
                    <Toggle enabled={settings.showCancelled} onToggle={() => update('showCancelled', !settings.showCancelled)} />
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                    <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">Default Visibility</label>
                    <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Default visibility for new events</p>
                    <select
                      value={settings.defaultVisibility}
                      onChange={(e) => update('defaultVisibility', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="ONLY_ME">Only Me</option>
                      <option value="FAMILY">Family</option>
                      <option value="SUB_CLAN">Sub Clan</option>
                      <option value="CLAN">Clan</option>
                      <option value="COMMUNITY">Community</option>
                      <option value="PUBLIC">Public</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Animations */}
              <section>
                <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">Animations</h3>
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Control motion and transitions</p>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Enable Animations</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Smooth transitions and hover effects</p>
                  </div>
                  <Toggle enabled={settings.animations} onToggle={() => update('animations', !settings.animations)} />
                </div>
              </section>

              {/* Color Theme */}
              <section>
                <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">Color Theme</h3>
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Choose your preferred appearance</p>
                <RadioGroup
                  options={[
                    { id: 'auto' as const, label: 'Auto', icon: <Monitor className="h-3.5 w-3.5" /> },
                    { id: 'light' as const, label: 'Light', icon: <Sun className="h-3.5 w-3.5" /> },
                    { id: 'dark' as const, label: 'Dark', icon: <Moon className="h-3.5 w-3.5" /> },
                  ]}
                  value={settings.colorTheme}
                  onChange={(v) => update('colorTheme', v)}
                />
              </section>

              {/* Notifications */}
              <section>
                <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Manage event alerts and digests</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Event Reminders</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Get notified before events</p>
                    </div>
                    <Toggle enabled={settings.eventReminders} onToggle={() => update('eventReminders', !settings.eventReminders)} />
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                    <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">Activity Digest</label>
                    <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">How often to receive activity summaries</p>
                    <select
                      value={settings.digestFrequency}
                      onChange={(e) => update('digestFrequency', e.target.value as Settings['digestFrequency'])}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Performance */}
              <section>
                <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">Performance</h3>
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Optimize loading and rendering</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Lazy Load Images</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Load images only when visible</p>
                    </div>
                    <Toggle enabled={settings.lazyLoadImages} onToggle={() => update('lazyLoadImages', !settings.lazyLoadImages)} />
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                    <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">Preload Next Events</label>
                    <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Number of upcoming events to preload ({settings.preloadCount})</p>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={5}
                      value={settings.preloadCount}
                      onChange={(e) => update('preloadCount', Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      <span>Off</span>
                      <span>50</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex items-center justify-between">
                <button
                  onClick={resetDefaults}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to Defaults
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    className={`rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all ${
                      saved
                        ? 'bg-emerald-600 shadow-emerald-500/25'
                        : 'bg-emerald-500 shadow-emerald-500/25 hover:bg-emerald-600'
                    }`}
                  >
                    {saved ? 'Saved!' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
