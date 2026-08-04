'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit3,
  Trash2,
  Copy,
  Pin,
  Star,
  Share2,
  Globe,
  Lock,
  Eye,
  UserPlus,
  Check,
  X,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Activity,
  History,
  ArrowLeft,
  Download,
  ExternalLink,
  Tag,
  FolderOpen,
  AlertTriangle,
  MoreHorizontal,
  Bookmark,
  Bell,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
  EVENT_TYPE_CONFIG,
  STATUS_CONFIG,
  VISIBILITY_OPTIONS,
  getEventConfig,
  getStatusConfig,
  formatDate,
  formatTime,
  formatRelative,
  calcCountdown,
  EVENT_CATEGORIES,
} from '../components/constants';
import EventTagsPanel from '../components/event-tags-panel';
import EventRemindersPanel from '../components/event-reminders-panel';
import EventComments from '../components/event-comments';
import EventReactions from '../components/event-reactions';
import EventDocuments from '../components/event-documents';
import EventMediaGallery from '../components/event-media-gallery';
import EventActivityFeed from '../components/event-activity-feed';
import EventHistory from '../components/event-history';
import EventInvitationPanel from '../components/event-invitation-panel';
import EventRsvpPanel from '../components/event-rsvp-panel';
import EventNotificationCenter from '../components/event-notification-center';
import EventLocationMap from '../components/event-location-map';
import EventPrintPreview from '../components/event-print-preview';
import EventSharePanel from '../components/event-share-panel';

const TAB_DEFS = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'tags', label: 'Tags', icon: Bookmark },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'history', label: 'History', icon: History },
  { id: 'comments', label: 'Comments', icon: MessageSquare },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'share', label: 'Share', icon: Share2 },
  { id: 'print', label: 'Print', icon: Download },
  { id: 'people', label: 'People', icon: Users },
  { id: 'versions', label: 'Versions', icon: History },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'notifications', label: 'Alerts', icon: Bell },
] as const;

type TabId = (typeof TAB_DEFS)[number]['id'];

const VISIBILITY_BADGES: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ONLY_ME: {
    label: 'Only Me',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    icon: Lock,
  },
  FAMILY: {
    label: 'Family',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Users,
  },
  SUB_CLAN: {
    label: 'Sub Clan',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: Users,
  },
  CLAN: {
    label: 'Clan',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: Globe,
  },
  COMMUNITY: {
    label: 'Community',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    icon: Globe,
  },
  PUBLIC: {
    label: 'Public',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: Globe,
  },
};

const REACTION_EMOJIS = ['ðŸ‘', 'â¤ï¸', 'ðŸŽ‰', 'ðŸ˜¢', 'ðŸ”¥'];

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <SkeletonBlock className="h-5 w-1/3 mb-4" />
      <SkeletonBlock className="h-4 w-full mb-2" />
      <SkeletonBlock className="h-4 w-2/3 mb-2" />
      <SkeletonBlock className="h-4 w-1/2" />
    </div>
  );
}

interface EventParticipant {
  id?: string;
  name?: string;
  avatar?: string;
  rsvpStatus?: string;
  memberId?: string;
  member?: { name?: string; firstName?: string; lastName?: string; avatar?: string };
}

interface EventDetail {
  id: string;
  title: string;
  subtitle?: string;
  eventType: string;
  date?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  visibility?: string;
  location?: string;
  venue?: string;
  description?: string;
  story?: string;
  coverImage?: string;
  mapLink?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  organizer?: { name?: string; avatar?: string };
  organizerId?: string;
  userId?: string;
  family?: { name?: string; id?: string };
  familyId?: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  language?: string;
  country?: string;
  media?: { url: string; type: string }[];
  mediaUrls?: { url: string; type: string }[];
  documents?: { name?: string; title?: string; url?: string }[];
  participants?: EventParticipant[];
  participantIds?: string[];
  pinned?: boolean;
  featured?: boolean;
  verified?: boolean;
  displayId?: string;
  userRsvpStatus?: string;
  _count?: { comments?: number; reactions?: number; documents?: number; media?: number };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

function UserAvatar({
  user: u,
  size = 'sm',
}: {
  user: { name?: string; firstName?: string; avatar?: string } | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dims =
    size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'md' ? 'h-9 w-9 text-xs' : 'h-12 w-12 text-sm';
  return (
    <div
      className={`${dims} shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-400 overflow-hidden`}
    >
      {u?.avatar ? (
        <img src={u.avatar} alt={u.name || ''} className="h-full w-full object-cover" />
      ) : (
        (u?.name || u?.firstName || 'U').charAt(0).toUpperCase()
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.color}`}
    >
      {status === 'CANCELLED' && <X className="h-3 w-3" />}
      {cfg.label}
    </span>
  );
}

function VisBadge({ visibility }: { visibility: string }) {
  const badge = VISIBILITY_BADGES[visibility] || VISIBILITY_BADGES.FAMILY;
  const Icon = badge.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color}`}
    >
      <Icon className="h-3 w-3" />
      {badge.label}
    </span>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [deleting, setDeleting] = useState(false);

  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [participantStats, setParticipantStats] = useState<{
    accepted?: number;
    pending?: number;
    declined?: number;
  } | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [submittingRsvp, setSubmittingRsvp] = useState(false);

  const [documents, setDocuments] = useState<
    {
      id?: string;
      title?: string;
      name?: string;
      url?: string;
      description?: string;
      isPrivate?: boolean;
    }[]
  >([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docPrivate, setDocPrivate] = useState(false);
  const [submittingDoc, setSubmittingDoc] = useState(false);

  const [mediaItems, setMediaItems] = useState<{ url: string; type?: string }[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');

  const [activities, setActivities] = useState<
    { id?: string; type?: string; action?: string; createdAt?: string; user?: { name?: string } }[]
  >([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityHasMore, setActivityHasMore] = useState(true);

  const [historyItems, setHistoryItems] = useState<
    { id?: string; action?: string; field?: string; createdAt?: string; user?: { name?: string } }[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasMore, setHistoryHasMore] = useState(true);

  const [comments, setComments] = useState<
    {
      id: string;
      content: string;
      userId?: string;
      createdAt?: string;
      user?: { name?: string };
      replies?: { id: string; content: string }[];
    }[]
  >([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [commentReactions, setCommentReactions] = useState<Record<string, string[]>>({});
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsHasMore, setCommentsHasMore] = useState(true);
  const [commentTotal, setCommentTotal] = useState(0);

  const [reactions, setReactions] = useState<{ emoji: string; userId: string; id?: string }[]>([]);
  const [groupedReactions, setGroupedReactions] = useState<
    Record<string, { emoji: string; userId: string }[]>
  >({});
  const [userReaction, setUserReaction] = useState<string | null>(null);

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const eventsFetched = useRef(false);
  const tabsFetched = useRef<Set<string>>(new Set());

  const isOwner =
    event?.userId === user?.id ||
    event?.organizerId === user?.id ||
    event?.createdById === user?.id;

  useEffect(() => {
    if (eventsFetched.current) return;
    eventsFetched.current = true;
    const load = async () => {
      try {
        const data = await api.timeline.get(eventId);
        setEvent(data);
        setRsvpStatus(data.userRsvpStatus || null);
        if (data.participants) setParticipants(data.participants);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    api.timeline
      .participants(eventId)
      .then((r) => {
        setParticipants(r.participants || []);
        setParticipantStats(r.stats || null);
      })
      .catch(() => {});
    api.timeline
      .getReactions(eventId)
      .then((r) => {
        setReactions(r.reactions || []);
        setGroupedReactions(r.grouped || {});
        if (user) {
          const myReaction = (r.reactions || []).find((rx) => rx.userId === user.id);
          setUserReaction(myReaction?.emoji || null);
        }
      })
      .catch(() => {});
  }, [eventId, user]);

  const fetchTabData = useCallback(
    (tab: TabId) => {
      if (tabsFetched.current.has(tab)) return;
      tabsFetched.current.add(tab);

      if (tab === 'documents') {
        setDocsLoading(true);
        api.timeline
          .getDocuments(eventId)
          .then((r) => {
            setDocuments(r.documents || []);
          })
          .catch(() => {})
          .finally(() => setDocsLoading(false));
      }
      if (tab === 'media') {
        setMediaLoading(true);
        const media = event?.media || event?.mediaUrls || [];
        setTimeout(() => {
          setMediaItems(media);
          setMediaLoading(false);
        }, 300);
      }
      if (tab === 'activity') {
        setActivityLoading(true);
        api.timeline
          .getActivity(eventId, 1, 20)
          .then((r) => {
            setActivities(r.activities || []);
            setActivityTotal(r.total || 0);
            setActivityHasMore((r.activities || []).length >= 20);
            setActivityPage(1);
          })
          .catch(() => {})
          .finally(() => setActivityLoading(false));
      }
      if (tab === 'history') {
        setHistoryLoading(true);
        api.timeline
          .getHistory(eventId, 1, 20)
          .then((r) => {
            setHistoryItems(r.history || []);
            setHistoryHasMore((r.history || []).length >= 20);
            setHistoryPage(1);
          })
          .catch(() => {})
          .finally(() => setHistoryLoading(false));
      }
      if (tab === 'comments') {
        setCommentsLoading(true);
        api.timeline
          .getComments(eventId, 1, 20)
          .then((r) => {
            setComments(r.comments || []);
            setCommentTotal(r.total || 0);
            setCommentsHasMore((r.comments || []).length >= 20);
            setCommentsPage(1);
          })
          .catch(() => {})
          .finally(() => setCommentsLoading(false));
      }
    },
    [eventId, event],
  );

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    fetchTabData(tab);
  };

  const loadMoreActivity = async () => {
    const nextPage = activityPage + 1;
    setActivityLoading(true);
    try {
      const r = await api.timeline.getActivity(eventId, nextPage, 20);
      setActivities((prev) => [...prev, ...(r.activities || [])]);
      setActivityPage(nextPage);
      setActivityHasMore((r.activities || []).length >= 20);
    } catch {
      /* empty */
    } finally {
      setActivityLoading(false);
    }
  };

  const loadMoreHistory = async () => {
    const nextPage = historyPage + 1;
    setHistoryLoading(true);
    try {
      const r = await api.timeline.getHistory(eventId, nextPage, 20);
      setHistoryItems((prev) => [...prev, ...(r.history || [])]);
      setHistoryPage(nextPage);
      setHistoryHasMore((r.history || []).length >= 20);
    } catch {
      /* empty */
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadMoreComments = async () => {
    const nextPage = commentsPage + 1;
    setCommentsLoading(true);
    try {
      const r = await api.timeline.getComments(eventId, nextPage, 20);
      setComments((prev) => [...prev, ...(r.comments || [])]);
      setCommentsPage(nextPage);
      setCommentsHasMore((r.comments || []).length >= 20);
    } catch {
      /* empty */
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleRsvp = async (status: string) => {
    setSubmittingRsvp(true);
    try {
      await api.timeline.rsvp(eventId, status);
      setRsvpStatus(status);
    } catch {
      /* empty */
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      await api.timeline.addReaction(eventId, emoji);
      const r = await api.timeline.getReactions(eventId);
      setReactions(r.reactions || []);
      setGroupedReactions(r.grouped || {});
      setUserReaction(emoji);
    } catch {
      /* empty */
    }
  };

  const handlePublish = async () => {
    try {
      await api.timeline.publish(eventId);
      setEvent((p) => ({ ...p, status: 'PUBLISHED' }) as EventDetail);
    } catch {
      /* empty */
    }
  };

  const handleArchive = async () => {
    try {
      await api.timeline.archive(eventId);
      setEvent((p) => ({ ...p, status: 'ARCHIVED' }) as EventDetail);
    } catch {
      /* empty */
    }
  };

  const handlePin = async () => {
    try {
      await api.timeline.pin(eventId);
      setEvent((p) => ({ ...p, pinned: !p?.pinned }) as EventDetail);
    } catch {
      /* empty */
    }
  };

  const handleFeature = async () => {
    try {
      await api.timeline.feature(eventId);
      setEvent((p) => ({ ...p, featured: !p?.featured }) as EventDetail);
    } catch {
      /* empty */
    }
  };

  const handleDuplicate = async () => {
    try {
      const dup = await api.timeline.duplicate(eventId);
      router.push(`/dashboard/timeline/${dup.id}`);
    } catch {
      /* empty */
    }
  };

  const handleExportPdf = async () => {
    try {
      await api.timeline.exportPdf(eventId);
      window.open(`/dashboard/timeline/${eventId}/print`, '_blank');
      showToast('Print version generated');
    } catch {
      showToast('Export failed');
    }
  };

  const handleExportJson = async () => {
    try {
      await api.timeline.exportJson(eventId);
      showToast('JSON export started');
    } catch {
      showToast('Export failed');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard');
    } catch {
      showToast('Failed to copy link');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.'))
      return;
    setDeleting(true);
    try {
      await api.timeline.delete(eventId);
      router.push('/dashboard/timeline');
    } catch {
      /* empty */
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const c = await api.timeline.addComment(eventId, commentText.trim());
      setComments((prev) => [c, ...prev]);
      setCommentText('');
      setCommentTotal((p) => p + 1);
    } catch {
      /* empty */
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      const c = await api.timeline.addComment(eventId, replyText.trim(), parentId);
      setComments((prev) =>
        prev.map((cm) =>
          cm.id === parentId ? { ...cm, replies: [...(cm.replies || []), c] } : cm,
        ),
      );
      setReplyText('');
      setReplyTo(null);
    } catch {
      /* empty */
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.timeline.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentTotal((p) => Math.max(0, p - 1));
    } catch {
      /* empty */
    }
  };

  const handleAddDocument = async () => {
    if (!docTitle.trim() || !docUrl.trim() || submittingDoc) return;
    setSubmittingDoc(true);
    try {
      const doc = await api.timeline.addDocument(eventId, {
        title: docTitle.trim(),
        description: docDesc.trim() || undefined,
        url: docUrl.trim(),
        isPrivate: docPrivate,
      });
      setDocuments((prev) => [doc, ...prev]);
      setDocTitle('');
      setDocDesc('');
      setDocUrl('');
      setDocPrivate(false);
      setShowDocForm(false);
    } catch {
      /* empty */
    } finally {
      setSubmittingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <SkeletonBlock className="h-5 w-48 mb-6" />
        <SkeletonBlock className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Event Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/dashboard/timeline"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Timeline
        </Link>
      </div>
    );
  }

  const config = getEventConfig(event.eventType);
  const statusCfg = getStatusConfig(event.status || 'PUBLISHED');
  const countdown = event.date ? calcCountdown(event.date) : '';
  const media = event.media || event.mediaUrls || [];
  const tags = event.tags || [];
  const acceptedCount =
    participantStats?.accepted || participants.filter((p) => p.rsvpStatus === 'ACCEPTED').length;
  const pendingCount =
    participantStats?.pending ||
    participants.filter((p) => p.rsvpStatus === 'PENDING' || !p.rsvpStatus).length;
  const declinedCount =
    participantStats?.declined || participants.filter((p) => p.rsvpStatus === 'DECLINED').length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-0">
      {/* Premium Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        {/* Back to Timeline */}
        <Link
          href="/dashboard/timeline"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors dark:text-slate-400 dark:hover:text-emerald-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Timeline
        </Link>

        {/* Cover Image / Gradient Banner */}
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient}`}
        >
          {event.coverImage ? (
            <div className="relative h-[280px] w-full md:h-[320px]">
              <img
                src={event.coverImage}
                alt={event.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-md shadow-lg">
                  {config.icon}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative flex h-[180px] items-center justify-center overflow-hidden md:h-[220px]">
              <div className="absolute inset-0 opacity-[0.07]">
                <div className="absolute right-8 top-6 text-[110px] leading-none">
                  {config.icon}
                </div>
                <div className="absolute bottom-4 left-10 text-[80px] leading-none opacity-60">
                  {config.icon}
                </div>
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 text-4xl backdrop-blur-sm shadow-lg ring-1 ring-white/10">
                {config.icon}
              </div>
            </div>
          )}
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.color}`}
          >
            <span>{config.icon}</span>
            {config.label}
          </span>
          <StatusBadge status={event.status || 'PUBLISHED'} />
          <VisBadge visibility={event.visibility || 'FAMILY'} />
          {countdown && event.status !== 'COMPLETED' && event.status !== 'CANCELLED' && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                countdown === 'Today' || countdown === 'Tomorrow'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 animate-pulse'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Clock className="h-3 w-3" />
              {countdown}
            </span>
          )}
          {event.pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <Pin className="h-3 w-3" /> Pinned
            </span>
          )}
          {event.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
              <Star className="h-3 w-3" /> Featured
            </span>
          )}
          {event.displayId && (
            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 rounded-full px-2 py-0.5">
              {event.displayId}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
            {event.title}
          </h1>
          {event.subtitle ? (
            <p className="mt-1.5 text-base text-slate-500 dark:text-slate-400">{event.subtitle}</p>
          ) : event.description ? (
            <p className="mt-1.5 text-base text-slate-500 dark:text-slate-400 line-clamp-2">
              {event.description}
            </p>
          ) : null}
        </div>

        {/* Meta Info Row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
          {event.date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              {formatDate(event.date)}
            </span>
          )}
          {(event.location || event.venue) && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              {event.venue || event.location}
            </span>
          )}
          {event.organizer && (
            <span className="flex items-center gap-1.5">
              <UserAvatar user={event.organizer} size="sm" />
              <span>{event.organizer.name || 'Unknown'}</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {!isOwner && event.status !== 'COMPLETED' && event.status !== 'CANCELLED' && (
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
              {[
                { s: 'ACCEPTED', l: 'Going', icon: Check },
                { s: 'PENDING', l: 'Interested', icon: Star },
                { s: 'DECLINED', l: "Can't Go", icon: X },
              ].map(({ s, l, icon: Icon }) => (
                <button
                  key={s}
                  onClick={() => handleRsvp(s)}
                  disabled={submittingRsvp}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    rsvpStatus === s
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {l}
                </button>
              ))}
            </div>
          )}

          {isOwner && (
            <Link
              href={`/dashboard/timeline/new?edit=${event.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Link>
          )}

          <div className="relative">
            <button
              onClick={() => {
                setShowShareMenu(!showShareMenu);
                setShowActionsMenu(false);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            {showShareMenu && (
              <div className="absolute left-0 top-12 z-50 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <button
                  onClick={() => {
                    handleShare();
                    setShowShareMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Share2 className="h-4 w-4" /> Copy Link
                </button>
                <button
                  onClick={() => {
                    handleExportPdf();
                    setShowShareMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" /> Export PDF
                </button>
                <button
                  onClick={() => {
                    handleExportJson();
                    setShowShareMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" /> Export JSON
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => handleTabChange('print')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Print
          </button>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowActionsMenu(!showActionsMenu);
                  setShowShareMenu(false);
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showActionsMenu && (
                <div className="absolute left-0 top-12 z-50 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  {event.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => {
                        handlePublish();
                        setShowActionsMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Globe className="h-4 w-4" /> Publish
                    </button>
                  )}
                  {event.status !== 'ARCHIVED' && (
                    <button
                      onClick={() => {
                        handleArchive();
                        setShowActionsMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <FolderOpen className="h-4 w-4" /> Archive
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handlePin();
                      setShowActionsMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Pin className="h-4 w-4" /> {event.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={() => {
                      handleFeature();
                      setShowActionsMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Star className="h-4 w-4" /> {event.featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button
                    onClick={() => {
                      handleDuplicate();
                      setShowActionsMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Copy className="h-4 w-4" /> Duplicate
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowActionsMenu(false);
                    }}
                    disabled={deleting}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
                  >
                    <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex overflow-x-auto scrollbar-hide -mb-px">
          {TAB_DEFS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.id === 'documents' && documents.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {documents.length}
                  </span>
                )}
                {tab.id === 'comments' && commentTotal > 0 && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {commentTotal}
                  </span>
                )}
                {tab.id === 'activity' && activityTotal > 0 && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {activityTotal}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="pt-6"
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Event Details Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                    Event Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {event.date && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                          <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Date</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {formatDate(event.date)}
                          </p>
                        </div>
                      </div>
                    )}
                    {(event.time || event.startTime) && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Time</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {event.time
                              ? formatTime(event.time)
                              : event.startTime
                                ? formatTime(event.startTime)
                                : ''}
                            {event.endTime && ` - ${formatTime(event.endTime)}`}
                          </p>
                        </div>
                      </div>
                    )}
                    {(event.location || event.venue) && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20">
                          <MapPin className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                          {event.mapLink ? (
                            <a
                              href={event.mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400 flex items-center gap-1"
                            >
                              {event.venue || event.location} <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {event.venue || event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {event.organizer && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
                          <UserPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Organizer</p>
                          <div className="flex items-center gap-1.5">
                            <UserAvatar user={event.organizer} size="sm" />
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {event.organizer.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {event.category && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                          <Tag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Category</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {event.category}
                          </p>
                        </div>
                      </div>
                    )}
                    {event.family && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/20">
                          <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Family</p>
                          <Link
                            href={`/dashboard/families/${event.familyId || event.family?.id}`}
                            className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                          >
                            {event.family?.name || 'Family'}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description Card */}
                {(event.description || event.story) && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                      About This Event
                    </h3>
                    {event.description && (
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {event.description}
                      </p>
                    )}
                    {event.story && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-5 dark:bg-slate-800/50">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          Story
                        </h4>
                        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {event.story}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* People Section */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      People ({participants.length})
                    </h3>
                    {participantStats && (
                      <div className="flex gap-3 text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {acceptedCount} accepted
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {pendingCount} pending
                        </span>
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {declinedCount} declined
                        </span>
                      </div>
                    )}
                  </div>
                  {event.organizer && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 mb-3">
                      <UserAvatar user={event.organizer} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {event.organizer.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Organizer</p>
                      </div>
                    </div>
                  )}
                  {participants.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                      No participants yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {participants.map((p) => {
                        const member = p.member || p;
                        return (
                          <div
                            key={p.id || member.name}
                            className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50"
                          >
                            <UserAvatar user={member} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                                {member.name || ''}
                              </p>
                              {p.rsvpStatus && (
                                <span
                                  className={`text-[10px] font-semibold ${
                                    p.rsvpStatus === 'ACCEPTED'
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : p.rsvpStatus === 'DECLINED'
                                        ? 'text-red-500 dark:text-red-400'
                                        : 'text-amber-500 dark:text-amber-400'
                                  }`}
                                >
                                  {p.rsvpStatus === 'ACCEPTED'
                                    ? 'Going'
                                    : p.rsvpStatus === 'DECLINED'
                                      ? 'Declined'
                                      : 'Maybe'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <Tag className="h-3 w-3" /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event Reactions */}
                <Suspense fallback={<SkeletonBlock className="h-20" />}>
                  <EventReactions eventId={eventId} />
                </Suspense>
              </div>

              {/* Right Column (1/3) */}
              <div className="space-y-6">
                {/* Quick Info Sidebar */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                    Quick Info
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Event Type', value: config.label, icon: config.icon },
                      {
                        label: 'Status',
                        value: statusCfg.label,
                        badge: true,
                        status: event.status || 'PUBLISHED',
                      },
                      {
                        label: 'Visibility',
                        value: VISIBILITY_BADGES[event.visibility || '']?.label || 'Family',
                      },
                      {
                        label: 'Created',
                        value: event.createdAt ? formatRelative(event.createdAt) : '',
                      },
                      {
                        label: 'Updated',
                        value: event.updatedAt ? formatRelative(event.updatedAt) : '',
                      },
                      { label: 'Language', value: event.language || 'English' },
                      { label: 'Country', value: event.country || 'Not specified' },
                    ]
                      .filter((i) => i.value)
                      .map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {item.label}
                          </span>
                          {item.badge ? (
                            <StatusBadge status={item.status} />
                          ) : (
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {item.icon && <span className="mr-1">{item.icon}</span>}
                              {item.value}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Map */}
                {(event.mapLink || event.location) && (
                  <Suspense fallback={<SkeletonBlock className="h-40 rounded-xl" />}>
                    <EventLocationMap
                      location={event.location}
                      venue={event.venue}
                      latitude={event.latitude}
                      longitude={event.longitude}
                      mapLink={event.mapLink}
                      address={event.address}
                    />
                  </Suspense>
                )}

                {/* Related Events */}
                {event.family && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                      Related Events
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      More events from {event.family?.name || 'this family'}
                    </p>
                    <Link
                      href={`/dashboard/families/${event.familyId || event.family?.id}/timeline`}
                      className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                    >
                      <Calendar className="h-4 w-4" /> View All Family Events
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <Suspense fallback={<SkeletonCard />}>
              <EventDocuments eventId={eventId} isOwner={isOwner} />
            </Suspense>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <Suspense fallback={<SkeletonBlock className="h-40 rounded-xl" />}>
              <EventMediaGallery eventId={eventId} isOwner={isOwner} />
            </Suspense>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <Suspense fallback={<SkeletonCard />}>
              <EventActivityFeed eventId={eventId} />
            </Suspense>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <Suspense fallback={<SkeletonCard />}>
              <EventHistory eventId={eventId} />
            </Suspense>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Tags & Keywords
              </h3>
              <EventTagsPanel
                eventId={eventId}
                initialTags={event.tags || []}
                initialKeywords={event.keywords || []}
              />
            </div>
          )}

          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <EventRemindersPanel eventId={eventId} />
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <Suspense fallback={<SkeletonCard />}>
              <EventComments eventId={eventId} />
            </Suspense>
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <Suspense fallback={<SkeletonBlock className="h-64 rounded-xl" />}>
              <EventLocationMap
                location={event.location}
                venue={event.venue}
                latitude={event.latitude}
                longitude={event.longitude}
                mapLink={event.mapLink}
                address={event.address}
              />
            </Suspense>
          )}

          {/* Share Tab */}
          {activeTab === 'share' && (
            <Suspense fallback={<SkeletonCard />}>
              <EventSharePanel
                eventId={eventId}
                eventTitle={event.title}
                eventUrl={typeof window !== 'undefined' ? window.location.href : undefined}
              />
            </Suspense>
          )}

          {/* Print Preview Tab */}
          {activeTab === 'print' && (
            <Suspense fallback={<SkeletonCard />}>
              <EventPrintPreview
                event={event}
                documents={documents}
                participants={participants}
                onClose={() => setActiveTab('overview')}
              />
            </Suspense>
          )}

          {/* People Tab */}
          {activeTab === 'people' && (
            <Suspense fallback={<SkeletonCard />}>
              <EventRsvpPanel eventId={eventId} isOwner={isOwner} />
            </Suspense>
          )}

          {/* Versions Tab */}
          {activeTab === 'versions' && (
            <Suspense fallback={<SkeletonCard />}>
              <EventHistory eventId={eventId} />
            </Suspense>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {event._count?.comments || 0}
                  </p>
                  <p className="text-xs text-slate-500">Comments</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {event._count?.reactions || 0}
                  </p>
                  <p className="text-xs text-slate-500">Reactions</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {event._count?.documents || 0}
                  </p>
                  <p className="text-xs text-slate-500">Documents</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {event._count?.media || 0}
                  </p>
                  <p className="text-xs text-slate-500">Media</p>
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                  Event Timeline
                </h3>
                <p className="text-sm text-slate-500">
                  Created {event.createdAt ? formatRelative(event.createdAt) : ''} Â· Last updated{' '}
                  {event.updatedAt ? formatRelative(event.updatedAt) : ''}
                </p>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Suspense fallback={<SkeletonCard />}>
              <EventNotificationCenter eventId={eventId} />
            </Suspense>
          )}
        </motion.div>
      </AnimatePresence>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          {toast}
        </div>
      )}
    </div>
  );
}
