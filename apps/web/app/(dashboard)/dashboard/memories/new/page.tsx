'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const EVENT_TAGS = [
  'birthday', 'wedding', 'holiday', 'reunion', 'graduation', 'anniversary',
  'family-trip', 'first-day', 'milestone', 'everyday', 'tradition', 'celebration',
];

const VISIBILITY_OPTIONS = [
  { value: 'ONLY_ME', label: 'Only Me', icon: 'ðŸ”’', description: 'Only you can see this' },
  { value: 'FAMILY', label: 'Family', icon: 'ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦', description: 'Only family members can see this' },
  { value: 'SUB_CLAN', label: 'Sub Clan', icon: 'ðŸ˜ï¸', description: 'Members of your sub-clan can see this' },
  { value: 'CLAN', label: 'Clan', icon: 'ðŸ”ï¸', description: 'All clan members can see this' },
  { value: 'COMMUNITY', label: 'Community', icon: 'ðŸŒ', description: 'All community members can see this' },
  { value: 'PUBLIC', label: 'Public', icon: 'ðŸŒ', description: 'Everyone can see this' },
];

export default function CreateMemoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [families, setFamilies] = useState<any[]>([]);
  const [userClans, setUserClans] = useState<any[]>([]);
  const [userSubClans, setUserSubClans] = useState<any[]>([]);
  const [userCommunities, setUserCommunities] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    story: '',
    date: '',
    location: '',
    visibility: 'FAMILY',
    familyId: '',
    tags: [] as string[],
    mediaUrls: [] as { url: string; type: string; caption?: string }[],
    memberIds: [] as string[],
    subClanId: '',
    clanId: '',
    communityId: '',
  });
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState('IMAGE');
  const [newMediaCaption, setNewMediaCaption] = useState('');

  useEffect(() => {
    if (!user) return;
    api.families.list().then(setFamilies).catch(() => {});
    api.clans.user().then((data: any) => {
      const clanList = Array.isArray(data) ? data : data?.clans || [];
      setUserClans(clanList);
    }).catch(() => {});
    api.communities.user().then((data: any) => {
      const communityList = Array.isArray(data) ? data : data?.communities || [];
      setUserCommunities(communityList);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (form.clanId) {
      api.subclans.listByClan(form.clanId).then((data: any) => {
        const list = Array.isArray(data) ? data : data?.subclans || [];
        setUserSubClans(list);
      }).catch(() => {});
    } else {
      setUserSubClans([]);
    }
  }, [form.clanId]);

  useEffect(() => {
    if (form.familyId) {
      api.members.list(form.familyId).then(setFamilyMembers).catch(() => {});
    } else {
      setFamilyMembers([]);
    }
  }, [form.familyId]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const data: any = {
        title: form.title.trim(),
        visibility: form.visibility,
      };
      if (form.description.trim()) data.description = form.description.trim();
      if (form.story.trim()) data.story = form.story.trim();
      if (form.date) data.date = new Date(form.date).toISOString();
      if (form.location.trim()) data.location = form.location.trim();
      if (form.familyId) data.familyId = form.familyId;
      if (form.tags.length > 0) data.tags = form.tags;
      if (form.mediaUrls.length > 0) data.media = form.mediaUrls;
      if (form.memberIds.length > 0) data.memberIds = form.memberIds;
      if (form.subClanId) data.subClanId = form.subClanId;
      if (form.clanId) data.clanId = form.clanId;
      if (form.communityId) data.communityId = form.communityId;

      const memory = await api.memories.create(data);
      router.push(`/dashboard/memories/${memory.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create memory');
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const addMedia = () => {
    if (newMediaUrl.trim()) {
      setForm(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, { url: newMediaUrl.trim(), type: newMediaType, caption: newMediaCaption.trim() || undefined }],
      }));
      setNewMediaUrl('');
      setNewMediaCaption('');
    }
  };

  const removeMedia = (index: number) => {
    setForm(prev => ({ ...prev, mediaUrls: prev.mediaUrls.filter((_, i) => i !== index) }));
  };

  const toggleMember = (memberId: string) => {
    setForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter(id => id !== memberId)
        : [...prev.memberIds, memberId],
    }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/dashboard/memories" className="text-sm text-emerald-600 hover:text-emerald-700">
        â† Back to memories
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create a Memory</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Preserve a special moment or story</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Give this memory a title..."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Short Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="A brief summary..."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Story</label>
            <textarea
              value={form.story}
              onChange={(e) => setForm({ ...form, story: e.target.value })}
              rows={6}
              placeholder="Tell the full story of this memory..."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-y"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Where did this happen?"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Visibility</label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VISIBILITY_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setForm({ ...form, visibility: opt.value, subClanId: '', clanId: '', communityId: '' })} className={`rounded-xl border p-2.5 text-left transition-all ${
                  form.visibility === opt.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}>
                  <span className="text-lg">{opt.icon}</span>
                  <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">{opt.label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {(form.visibility === 'SUB_CLAN' || form.visibility === 'CLAN') && userClans.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Clan</label>
              <select value={form.clanId} onChange={(e) => setForm({ ...form, clanId: e.target.value, subClanId: '' })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="">Select a clan</option>
                {userClans.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {form.visibility === 'SUB_CLAN' && form.clanId && userSubClans.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Sub Clan</label>
              <select value={form.subClanId} onChange={(e) => setForm({ ...form, subClanId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="">Select a sub-clan</option>
                {userSubClans.map((sc: any) => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                ))}
              </select>
            </div>
          )}

          {form.visibility === 'COMMUNITY' && userCommunities.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Community</label>
              <select value={form.communityId} onChange={(e) => setForm({ ...form, communityId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="">Select a community</option>
                {userCommunities.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Family & Members</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Associate with Family</label>
            <select
              value={form.familyId}
              onChange={(e) => setForm({ ...form, familyId: e.target.value, memberIds: [] })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">No family (personal memory)</option>
              {families.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          {familyMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tag Members</label>
              <div className="flex flex-wrap gap-2">
                {familyMembers.map((m: any) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      form.memberIds.includes(m.id)
                        ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    {m.firstName} {m.lastName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Media</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Add image or video URLs to include in this memory.</p>
          {form.mediaUrls.length > 0 && (
            <div className="space-y-2">
              {form.mediaUrls.map((media, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{media.type}</span>
                  <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-300">{media.url}</span>
                  {media.caption && <span className="text-xs text-slate-400">{media.caption}</span>}
                  <button type="button" onClick={() => removeMedia(i)} className="text-slate-400 hover:text-red-500">Ã—</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <select value={newMediaType} onChange={(e) => setNewMediaType(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
            </select>
            <input
              type="url"
              value={newMediaUrl}
              onChange={(e) => setNewMediaUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="text"
              value={newMediaCaption}
              onChange={(e) => setNewMediaCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button type="button" onClick={addMedia} disabled={!newMediaUrl.trim()} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Add
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tags</h3>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 text-emerald-500 hover:text-emerald-700">Ã—</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Add a tag..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button type="button" onClick={addTag} disabled={!newTag.trim()} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EVENT_TAGS.filter(t => !form.tags.includes(t)).slice(0, 12).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }))}
                className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !form.title.trim()}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Memory'}
          </button>
          <Link
            href="/dashboard/memories"
            className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
