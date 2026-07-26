'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface MemoryMedia {
  id: string;
  url: string;
  type: string;
  caption: string | null;
}

interface MemoryMember {
  member: { id: string; firstName: string; lastName: string; avatar: string | null };
}

interface MemoryComment {
  id: string;
  content: string;
  userId: string;
  user: { id: string; name: string; avatar: string | null };
  createdAt: string;
}

interface MemoryReaction {
  id: string;
  type: string;
  userId: string;
  user: { id: string; name: string };
  createdAt: string;
}

interface Memory {
  id: string;
  displayId: string;
  title: string;
  description: string | null;
  story: string | null;
  date: string | null;
  location: string | null;
  visibility: string;
  tags: string[] | null;
  isHidden: boolean;
  userId: string;
  user: { id: string; name: string; avatar: string | null };
  familyId: string | null;
  family: { id: string; name: string } | null;
  media: MemoryMedia[];
  members: MemoryMember[];
  comments: MemoryComment[];
  reactions: MemoryReaction[];
  _count: { comments: number; reactions: number };
  createdAt: string;
  updatedAt: string;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatRelative(d: string | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDate(d);
}

const REACTION_TYPES = ['LIKE', 'LOVE', 'HEARTFELT', 'NOSTALGIC', 'CELEBRATION'];

const VISIBILITY_BADGES: Record<string, { label: string; color: string }> = {
  ONLY_ME: { label: 'Only Me', color: 'bg-gray-100 text-gray-700' },
  FAMILY: { label: 'Family', color: 'bg-blue-100 text-blue-700' },
  SUB_CLAN: { label: 'Sub Clan', color: 'bg-purple-100 text-purple-700' },
  CLAN: { label: 'Clan', color: 'bg-green-100 text-green-700' },
  COMMUNITY: { label: 'Community', color: 'bg-orange-100 text-orange-700' },
  PUBLIC: { label: 'Public', color: 'bg-emerald-100 text-emerald-700' },
};

function VisibilityBadge({ visibility }: { visibility: string }) {
  const badge = VISIBILITY_BADGES[visibility] || VISIBILITY_BADGES.FAMILY;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>;
}

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const memoryId = params.id as string;
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<number | null>(null);
  const [reactionType, setReactionType] = useState('LIKE');
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.memories.get(memoryId);
        setMemory(data);
      } catch {
        router.push('/dashboard/memories');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [memoryId, router]);

  const handleAddComment = async () => {
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const comment = await api.memories.addComment(memoryId, commentText.trim());
      setMemory(prev => prev ? {
        ...prev,
        comments: [...prev.comments, comment],
        _count: { ...prev._count, comments: prev._count.comments + 1 },
      } : null);
      setCommentText('');
    } catch { /* empty */ } finally {
      setSubmittingComment(false);
    }
  };

  const handleRemoveComment = async (commentId: string) => {
    try {
      await api.memories.removeComment(memoryId, commentId);
      setMemory(prev => prev ? {
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId),
        _count: { ...prev._count, comments: prev._count.comments - 1 },
      } : null);
    } catch { /* empty */ }
  };

  const handleReaction = async (type: string) => {
    try {
      const result = await api.memories.toggleReaction(memoryId, type);
      setMemory(prev => {
        if (!prev) return null;
        const existing = prev.reactions.find(r => r.userId === user?.id);
        let newReactions;
        if (existing) {
          newReactions = prev.reactions.filter(r => r.userId !== user?.id);
          if (existing.type !== type) {
            newReactions.push({ ...result, user: { id: user!.id, name: user!.name } });
          }
        } else {
          newReactions = [...prev.reactions, { ...result, user: { id: user!.id, name: user!.name } }];
        }
        return { ...prev, reactions: newReactions, _count: { ...prev._count, reactions: newReactions.length } };
      });
      setShowReactionPicker(false);
    } catch { /* empty */ }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this memory?')) return;
    try {
      await api.memories.delete(memoryId);
      router.push('/dashboard/memories');
    } catch { /* empty */ }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!memory) return null;

  const userReaction = memory.reactions.find(r => r.userId === user?.id);
  const reactionCounts = memory.reactions.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/dashboard/memories" className="text-sm text-emerald-600 hover:text-emerald-700">
        â† Back to memories
      </Link>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {memory.media && memory.media.length > 0 && (
          <div className="relative">
            {selectedMedia !== null ? (
              <div className="relative bg-black">
                <img src={memory.media[selectedMedia].url} alt={memory.media[selectedMedia].caption || memory.title} className="mx-auto max-h-[60vh] w-full object-contain" />
                <button onClick={() => setSelectedMedia(null)} className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                {memory.media[selectedMedia].caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-sm text-white">{memory.media[selectedMedia].caption}</p>
                  </div>
                )}
                {memory.media.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {memory.media.map((_, i) => (
                      <button key={i} onClick={() => setSelectedMedia(i)} className={`h-2 w-2 rounded-full transition-colors ${i === selectedMedia ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                )}
              </div>
            ) : memory.media.length === 1 ? (
              <div className="cursor-pointer" onClick={() => setSelectedMedia(0)}>
                <img src={memory.media[0].url} alt={memory.title} className="w-full max-h-80 object-cover" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {memory.media.slice(0, 4).map((m, i) => (
                  <div key={m.id} className="relative cursor-pointer" onClick={() => setSelectedMedia(i)}>
                    <img src={m.url} alt={m.caption || memory.title} className="h-40 w-full object-cover" />
                    {i === 3 && memory.media.length > 4 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-lg font-bold text-white">
                        +{memory.media.length - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{memory.title}</h1>
              {memory.displayId && (
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 font-mono">{memory.displayId}</p>
              )}
            </div>
            {memory.userId === user?.id && (
              <div className="flex gap-1">
                <button onClick={handleDelete} className="rounded p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 overflow-hidden">
                {memory.user?.avatar ? (
                  <img src={memory.user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  memory.user?.name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-300">{memory.user?.name}</span>
            </div>
            {memory.date && <span>{formatDate(memory.date)}</span>}
            {memory.location && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {memory.location}
              </span>
            )}
            {memory.family && (
              <Link href={`/dashboard/families/${memory.family.id}`} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                {memory.family.name}
              </Link>
            )}
            {memory.visibility && <VisibilityBadge visibility={memory.visibility} />}
          </div>

          {memory.description && (
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{memory.description}</p>
          )}

          {memory.story && (
            <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800/50">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Story</h3>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{memory.story}</div>
            </div>
          )}

          {memory.members && memory.members.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">People in this memory</h3>
              <div className="flex flex-wrap gap-2">
                {memory.members.map(({ member }) => (
                  <span key={member.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <div className="h-4 w-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[8px] font-bold text-emerald-700 dark:text-emerald-400 overflow-hidden">
                      {member.avatar ? <img src={member.avatar} alt="" className="h-full w-full object-cover" /> : member.firstName.charAt(0)}
                    </div>
                    {member.firstName} {member.lastName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {memory.tags && memory.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {memory.tags.map(tag => (
                <span key={tag} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">{tag}</span>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    userReaction
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {userReaction ? (
                    <span>{userReaction.type === 'LIKE' ? 'ðŸ‘' : userReaction.type === 'LOVE' ? 'â¤ï¸' : userReaction.type === 'HEARTFELT' ? 'ðŸ¥º' : userReaction.type === 'NOSTALGIC' ? 'ðŸ’­' : 'ðŸŽ‰'}</span>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  )}
                  {memory._count.reactions > 0 && <span>{memory._count.reactions}</span>}
                </button>
                {showReactionPicker && (
                  <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-xl bg-white p-2 shadow-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                    {REACTION_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => handleReaction(type)}
                        className={`rounded-lg px-2 py-1 text-lg transition-transform hover:scale-125 ${userReaction?.type === type ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}`}
                        title={type}
                      >
                        {type === 'LIKE' ? 'ðŸ‘' : type === 'LOVE' ? 'â¤ï¸' : type === 'HEARTFELT' ? 'ðŸ¥º' : type === 'NOSTALGIC' ? 'ðŸ’­' : 'ðŸŽ‰'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {Object.entries(reactionCounts).filter(([, count]) => count > 0).map(([type, count]) => (
                <span key={type} className="text-xs text-slate-500 dark:text-slate-400">
                  {type === 'LIKE' ? 'ðŸ‘' : type === 'LOVE' ? 'â¤ï¸' : type === 'HEARTFELT' ? 'ðŸ¥º' : type === 'NOSTALGIC' ? 'ðŸ’­' : 'ðŸŽ‰'} {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Comments ({memory._count.comments})</h3>
        </div>

        <div className="p-6">
          <div className="flex gap-3 mb-6">
            <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 overflow-hidden">
              {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                placeholder="Write a comment..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submittingComment ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>

          {memory.comments.length === 0 ? (
            <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">No comments yet. Be the first to share your thoughts.</p>
          ) : (
            <div className="space-y-4">
              {memory.comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 overflow-hidden">
                    {comment.user?.avatar ? <img src={comment.user.avatar} alt="" className="h-full w-full object-cover" /> : comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{comment.user?.name}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{formatRelative(comment.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{comment.content}</p>
                  </div>
                  {(comment.userId === user?.id || memory.userId === user?.id) && (
                    <button onClick={() => handleRemoveComment(comment.id)} className="text-slate-400 hover:text-red-500" title="Remove">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
