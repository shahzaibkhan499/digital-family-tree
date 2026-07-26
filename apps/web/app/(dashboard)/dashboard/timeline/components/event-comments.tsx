'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Reply, Pencil, Trash2, Send, MoreHorizontal, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { formatRelative } from './constants';

interface Comment {
  id: string;
  content: string;
  parentId?: string | null;
  userId: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  replies?: Comment[];
  replyCount?: number;
  reactions?: Record<string, string[]>;
}

const QUICK_REACTIONS = ['ðŸ‘', 'â¤ï¸', 'ðŸ˜Š', 'ðŸŽ‰'];

function CommentSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  eventId,
  user,
  onReply,
  onDelete,
  onEdit,
  onReact,
  depth = 0,
  loadReplies,
}: {
  comment: Comment;
  eventId: string;
  user: any;
  onReply: (parentId: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  onReact: (commentId: string, emoji: string) => void;
  depth?: number;
  loadReplies?: (parentId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isOwn = user?.id === comment.userId;

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onEdit(comment.id, editContent.trim());
      setEditing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={depth > 0 ? 'ml-8 sm:ml-12' : ''}
    >
      <div className="group relative rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <div className="flex gap-3">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            {comment.userAvatar ? (
              <img src={comment.userAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {(comment.userName || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {comment.userName || 'Unknown'}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {formatRelative(comment.createdAt)}
              </span>
              {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">(edited)</span>
              )}
            </div>

            {editing ? (
              <div className="mt-1">
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditing(false); setEditContent(comment.content); }}
                    className="rounded-md px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{comment.content}</p>
            )}

            {/* Quick reactions display */}
            {comment.reactions && Object.keys(comment.reactions).length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {Object.entries(comment.reactions).map(([emoji, users]) => (
                  <span
                    key={emoji}
                    className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] dark:bg-slate-700"
                  >
                    <span>{emoji}</span>
                    <span className="text-slate-500 dark:text-slate-400">{users.length}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            {!editing && (
              <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative">
                  <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="rounded-md px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                  >
                    React
                  </button>
                  <AnimatePresence>
                    {showReactions && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                      >
                        {QUICK_REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => { onReact(comment.id, emoji); setShowReactions(false); }}
                            className="rounded-md p-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={() => onReply(comment.id)}
                  className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </button>
                {isOwn && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute right-0 top-full z-10 mt-1 w-32 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                        >
                          <button
                            onClick={() => { setEditing(true); setShowMenu(false); }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => { onDelete(comment.id); setShowMenu(false); }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Load more replies */}
      {comment.replyCount != null && comment.replyCount > 0 && (!comment.replies || comment.replies.length < comment.replyCount) && depth < 3 && (
        <button
          onClick={() => loadReplies?.(comment.id)}
          className="ml-11 mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          <ChevronDown className="h-3 w-3" />
          Load {comment.replyCount - (comment.replies?.length || 0)} more {comment.replyCount - (comment.replies?.length || 0) === 1 ? 'reply' : 'replies'}
        </button>
      )}
    </motion.div>
  );
}

export default function EventComments({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchComments = useCallback(async (p: number, append = false) => {
    try {
      const res = await api.timeline.getComments(eventId, p, 20);
      const newComments = Array.isArray(res?.comments) ? res.comments : [];
      setComments(prev => append ? [...prev, ...newComments] : newComments);
      setTotalPages(res?.totalPages || 1);
      setTotal(res?.total || 0);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchComments(1); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.timeline.addComment(eventId, newComment.trim());
      setNewComment('');
      setPage(1);
      await fetchComments(1);
    } catch {
      /* empty */
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      await api.timeline.addComment(eventId, replyContent.trim(), parentId);
      setReplyContent('');
      setReplyTo(null);
      await fetchComments(page);
    } catch {
      /* empty */
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      await api.timeline.updateComment(commentId, content);
      setComments(prev =>
        prev.map(c => c.id === commentId ? { ...c, content, updatedAt: new Date().toISOString() } : c)
      );
    } catch {
      /* empty */
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.timeline.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setTotal(prev => Math.max(0, prev - 1));
      setDeleteConfirm(null);
    } catch {
      /* empty */
    }
  };

  const handleReact = async (commentId: string, emoji: string) => {
    try {
      setComments(prev =>
        prev.map(c => {
          if (c.id !== commentId) return c;
          const reactions = { ...(c.reactions || {}) };
          const users: string[] = reactions[emoji] || [];
          const uid = user?.id || '';
          if (users.includes(uid)) {
            reactions[emoji] = users.filter(id => id !== uid);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...users, uid];
          }
          return { ...c, reactions };
        })
      );
    } catch {
      /* empty */
    }
  };

  const loadMoreReplies = async (parentId: string) => {
    try {
      const res = await api.timeline.getComments(eventId, 1, 50);
      const allComments = Array.isArray(res?.comments) ? res.comments : [];
      setComments(prev =>
        prev.map(c => {
          if (c.id !== parentId) return c;
          const existingReplies = c.replies || [];
          const newReplies = allComments.filter(
            (r: Comment) => r.parentId === parentId && !existingReplies.find((e: Comment) => e.id === r.id)
          );
          return { ...c, replies: [...existingReplies, ...newReplies] };
        })
      );
    } catch {
      /* empty */
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchComments(nextPage, true);
  };

  const rootComments = comments.filter(c => !c.parentId);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <MessageCircle className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Comments</span>
        {total > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {total}
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Comment input */}
        <div className="flex gap-3 mb-4">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {(user?.name || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-3 w-3" />
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>

        {/* Inline reply box */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 ml-11 overflow-hidden"
            >
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-900/10">
                <div className="flex gap-2">
                  <textarea
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    autoFocus
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                  />
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => { setReplyTo(null); setReplyContent(''); }}
                    className="rounded-md px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReply(replyTo)}
                    disabled={!replyContent.trim() || submittingReply}
                    className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    {submittingReply ? 'Sending...' : 'Reply'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete confirmation */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-900/20">
                <p className="text-sm text-rose-700 dark:text-rose-300">Are you sure you want to delete this comment?</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="rounded-md bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="rounded-md px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments list */}
        {loading ? (
          <CommentSkeleton />
        ) : rootComments.length === 0 ? (
          <div className="py-8 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
              No comments yet. Be the first to comment!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {rootComments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  eventId={eventId}
                  user={user}
                  onReply={(parentId) => { setReplyTo(parentId); setReplyContent(''); }}
                  onDelete={setDeleteConfirm}
                  onEdit={handleEdit}
                  onReact={handleReact}
                  loadReplies={loadMoreReplies}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load more */}
        {!loading && page < totalPages && (
          <div className="mt-3 text-center">
            <button
              onClick={loadMore}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Load more comments
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
