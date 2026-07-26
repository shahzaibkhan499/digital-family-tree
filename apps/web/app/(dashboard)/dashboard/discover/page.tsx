'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';

interface DiscoveryItem {
  id: string;
  type: string;
  confidence: number;
  matchReason: string;
  matchFactors: string[];
  viewed: boolean;
  data: any;
}

interface DiscoveryStats {
  possibleRelatives: number;
  nearbyFamilies: number;
  sharedSurnames: number;
}

interface SearchFormState {
  fullName: string;
  birthYearFrom: string;
  birthYearTo: string;
  birthPlace: string;
  city: string;
  country: string;
  clan: string;
  religion: string;
  nationality: string;
  phone: string;
  email: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 80) {
    return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">{score}% match</span>;
  }
  if (score >= 60) {
    return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">{score}% match</span>;
  }
  return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400">{score}% match</span>;
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

function DiscoveryCard({ item, index }: { item: DiscoveryItem; index: number }) {
  const name = item.data?.name || item.data?.firstName + ' ' + item.data?.lastName || 'Unknown';
  const initial = name.charAt(0).toUpperCase();
  const familyId = item.data?.family?.id || item.data?.familyId || '';
  const memberId = item.data?.id || '';

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
            {initial}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{item.matchReason}</p>
          </div>
        </div>
        <ConfidenceBadge score={item.confidence} />
      </div>
      {item.matchFactors && item.matchFactors.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.matchFactors.map((factor: string, fi: number) => (
            <span key={fi} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {factor}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Link
          href={familyId ? `/dashboard/families/${familyId}${memberId ? `?member=${memberId}` : ''}` : '#'}
          className="inline-block rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 0l3.659 2.578M12 2v4.114" />
      </svg>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No discoveries yet</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        We haven&apos;t found any potential relatives yet. Make sure your profile is complete for better matches.
      </p>
    </div>
  );
}

function getClanBanner(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 50%, 40%), hsl(${h2}, 55%, 55%))`;
}

function SuggestedClanCard({ clan }: { clan: any }) {
  const initials = (clan.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <Link
      href={`/dashboard/clans/${clan.slug || clan.id}`}
      className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative h-20 w-full" style={{ background: getClanBanner(clan.name) }}>
        {clan.bannerUrl && <img src={clan.bannerUrl} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="px-4 pb-4">
        <div className="-mt-6 mb-2 flex items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-bold text-white dark:border-slate-900">
            {clan.logoUrl ? <img src={clan.logoUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">{clan.name}</h3>
          </div>
        </div>
        {(clan.country || clan.region) && (
          <p className="text-xs text-slate-400 dark:text-slate-500">{clan.country || clan.region}</p>
        )}
      </div>
    </Link>
  );
}

function SearchResultCard({ member }: { member: any }) {
  const name = member?.firstName && member?.lastName ? `${member.firstName} ${member.lastName}` : member?.name || 'Unknown';
  const initial = name.charAt(0).toUpperCase();
  const familyId = member?.family?.id || member?.familyId || '';
  const memberId = member?.id || '';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
            {initial}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {member?.family?.name || 'No family'}
              {member?.city ? ` \u2022 ${member.city}` : ''}
              {member?.country ? `, ${member.country}` : ''}
            </p>
          </div>
        </div>
      </div>
      {(member?.email || member?.phone) && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          {member.email && <span>{member.email}</span>}
          {member.phone && <span>{member.phone}</span>}
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Link
          href={familyId ? `/dashboard/families/${familyId}${memberId ? `?member=${memberId}` : ''}` : '#'}
          className="inline-block rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

const INITIAL_SEARCH_STATE: SearchFormState = {
  fullName: '',
  birthYearFrom: '',
  birthYearTo: '',
  birthPlace: '',
  city: '',
  country: '',
  clan: '',
  religion: '',
  nationality: '',
  phone: '',
  email: '',
};

function SearchForm({ onSearch, isSearching }: { onSearch: (params: SearchFormState) => void; isSearching: boolean }) {
  const [form, setForm] = useState<SearchFormState>(INITIAL_SEARCH_STATE);

  const updateField = (field: keyof SearchFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(form);
  };

  const handleClear = () => {
    setForm(INITIAL_SEARCH_STATE);
    onSearch(INITIAL_SEARCH_STATE);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Advanced Search</h3>
        <button type="button" onClick={handleClear} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
          Clear All
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Birth Year From</label>
          <input
            type="number"
            value={form.birthYearFrom}
            onChange={(e) => updateField('birthYearFrom', e.target.value)}
            placeholder="e.g. 1950"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Birth Year To</label>
          <input
            type="number"
            value={form.birthYearTo}
            onChange={(e) => updateField('birthYearTo', e.target.value)}
            placeholder="e.g. 2000"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Birth Place</label>
          <input
            type="text"
            value={form.birthPlace}
            onChange={(e) => updateField('birthPlace', e.target.value)}
            placeholder="City or region..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">City</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="City..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Country</label>
          <input
            type="text"
            value={form.country}
            onChange={(e) => updateField('country', e.target.value)}
            placeholder="Country..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Clan</label>
          <input
            type="text"
            value={form.clan}
            onChange={(e) => updateField('clan', e.target.value)}
            placeholder="Clan name..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Religion</label>
          <input
            type="text"
            value={form.religion}
            onChange={(e) => updateField('religion', e.target.value)}
            placeholder="Religion..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nationality</label>
          <input
            type="text"
            value={form.nationality}
            onChange={(e) => updateField('nationality', e.target.value)}
            placeholder="Nationality..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Phone</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="Phone number..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
          <input
            type="text"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="Email address..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={isSearching}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSearching ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching...
            </span>
          ) : (
            'Search Members'
          )}
        </button>
      </div>
    </form>
  );
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const [discoveries, setDiscoveries] = useState<DiscoveryItem[]>([]);
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestedClans, setSuggestedClans] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [scanningDiscovery, setScanningDiscovery] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [discList, discStats] = await Promise.allSettled([
        api.discovery.list(),
        api.discovery.stats(),
      ]);
      if (discList.status === 'fulfilled') {
        const items = Array.isArray(discList.value) ? discList.value : discList.value?.items || discList.value?.discoveries || [];
        setDiscoveries(items);
      }
      if (discStats.status === 'fulfilled') {
        setStats(discStats.value);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load discoveries');
    } finally {
      setLoading(false);
    }

    const params: any = {};
    if (user?.country) params.country = user.country;
    api.clans.list({ ...params, limit: 6 }).then((data) => {
      const list = Array.isArray(data) ? data : data?.clans || [];
      setSuggestedClans(list);
    }).catch(() => {});
  }, [user?.country]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = async (form: SearchFormState) => {
    const parts: string[] = [];
    if (form.fullName) parts.push(form.fullName);
    if (form.birthPlace) parts.push(form.birthPlace);
    if (form.city) parts.push(form.city);
    if (form.country) parts.push(form.country);
    if (form.clan) parts.push(form.clan);
    if (form.religion) parts.push(form.religion);
    if (form.nationality) parts.push(form.nationality);
    if (form.phone) parts.push(form.phone);
    if (form.email) parts.push(form.email);
    if (form.birthYearFrom && form.birthYearTo) {
      parts.push(`birthYear:[${form.birthYearFrom} TO ${form.birthYearTo}]`);
    } else if (form.birthYearFrom) {
      parts.push(`birthYear:>=${form.birthYearFrom}`);
    } else if (form.birthYearTo) {
      parts.push(`birthYear:<=${form.birthYearTo}`);
    }
    const query = parts.join(' ').trim();

    if (!query) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await api.search.global(query, { type: 'members', limit: 50 });
      const members = Array.isArray(result) ? result : result?.members || [];
      setSearchResults(members);
    } catch (err: any) {
      setSearchError(err.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDiscoveryScan = async () => {
    setScanningDiscovery(true);
    try {
      await api.duplicates.detect();
      await loadData();
    } catch {
      /* empty */
    } finally {
      setScanningDiscovery(false);
    }
  };

  const relatives = discoveries.filter((d) => d.type === 'RELATIVE' || d.type === 'relative');
  const nearby = discoveries.filter((d) => d.type === 'NEARBY' || d.type === 'nearby');
  const shared = discoveries.filter((d) => d.type === 'SURNAME' || d.type === 'surname');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 dark:border-indigo-800/50 dark:from-indigo-900/20 dark:to-purple-900/20 flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Discover Your Family</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Explore potential relatives, nearby families, and shared surnames to expand your family tree.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {showSearch ? 'Hide Search' : 'Advanced Search'}
            </span>
          </button>
          <button
            onClick={handleDiscoveryScan}
            disabled={scanningDiscovery}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {scanningDiscovery ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scanning...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Run Full Discovery Scan
              </span>
            )}
          </button>
        </div>
      </div>

      {showSearch && (
        <SearchForm onSearch={handleSearch} isSearching={isSearching} />
      )}

      {searchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/10">
          <p className="text-sm text-red-600 dark:text-red-400">{searchError}</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            Search Results ({searchResults.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((member, i) => (
              <SearchResultCard key={member.id || i} member={member} />
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800/50 dark:bg-red-900/10">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={loadData} className="mt-2 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Possible Relatives"
              value={stats?.possibleRelatives ?? relatives.length}
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <StatCard
              label="Nearby Families"
              value={stats?.nearbyFamilies ?? nearby.length}
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <StatCard
              label="Shared Surnames"
              value={stats?.sharedSurnames ?? shared.length}
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            />
          </div>

          {discoveries.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {relatives.length > 0 && (
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Possible Relatives</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {relatives.map((item, i) => (
                      <DiscoveryCard key={item.id} item={item} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {nearby.length > 0 && (
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Nearby Families</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {nearby.map((item, i) => (
                      <DiscoveryCard key={item.id} item={item} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {shared.length > 0 && (
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Shared Surnames</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {shared.map((item, i) => (
                      <DiscoveryCard key={item.id} item={item} index={i} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      {suggestedClans.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Suggested Clans</h2>
            <Link href="/dashboard/clans" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedClans.map((clan: any) => (
              <SuggestedClanCard key={clan.id || clan.slug} clan={clan} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}