'use client';

import { useState } from 'react';
import {
  Share2, Copy, Check, Mail, MessageCircle, Facebook, Twitter, Link2,
  Code, Smartphone, QrCode, X, ExternalLink,
} from 'lucide-react';

interface EventSharePanelProps {
  eventId: string;
  eventTitle?: string;
  eventUrl?: string;
  onClose?: () => void;
}

const SHARE_OPTIONS = [
  { id: 'copy', label: 'Copy Link', icon: Link2, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  { id: 'email', label: 'Email', icon: Mail, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { id: 'twitter', label: 'Twitter', icon: Twitter, color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' },
];

export default function EventSharePanel({ eventId, eventTitle, eventUrl, onClose }: EventSharePanelProps) {
  const [copied, setCopied] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const shareUrl = eventUrl || (typeof window !== 'undefined' ? `${window.location.origin}/dashboard/timeline/${eventId}` : '');
  const shareText = eventTitle ? `Check out this event: ${eventTitle}` : 'Check out this event on Family Tree';
  const embedCode = `<iframe src="${shareUrl}" width="600" height="400" frameborder="0"></iframe>`;
  const deepLink = `familytree://event/${eventId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = (id: string) => {
    switch (id) {
      case 'copy': handleCopy(); break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(eventTitle || 'Event')}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Share Event</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Share buttons grid */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {SHARE_OPTIONS.map(opt => {
            const OIcon = opt.icon;
            const isCopy = opt.id === 'copy' && copied;
            return (
              <button key={opt.id} onClick={() => handleShare(opt.id)}
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${opt.color}`}>
                  {isCopy ? <Check className="h-5 w-5 text-emerald-500" /> : <OIcon className="h-5 w-5" />}
                </div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {isCopy ? 'Copied!' : opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* URL display */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
          <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
          <p className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-400">{shareUrl}</p>
          <button onClick={handleCopy}
            className="shrink-0 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 transition-colors">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Extra actions */}
        <div className="mt-3 flex gap-2">
          <button onClick={() => { setShowEmbed(!showEmbed); setShowQr(false); }}
            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors ${
              showEmbed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}>
            <Code className="h-3 w-3" /> Embed
          </button>
          <button onClick={() => { setShowQr(!showQr); setShowEmbed(false); }}
            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors ${
              showQr ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}>
            <QrCode className="h-3 w-3" /> QR Code
          </button>
          <a href={deepLink}
            className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
            <Smartphone className="h-3 w-3" /> App Link
          </a>
        </div>

        {/* Embed code */}
        {showEmbed && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-2">Embed Code</p>
            <code className="block rounded bg-white p-2 text-[11px] text-slate-700 break-all dark:bg-slate-900 dark:text-slate-300">
              {embedCode}
            </code>
            <button onClick={() => { navigator.clipboard.writeText(embedCode); }}
              className="mt-2 rounded-md bg-emerald-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-emerald-700">
              Copy Embed Code
            </button>
          </div>
        )}

        {/* QR Code */}
        {showQr && (
          <div className="mt-3 flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <img src={qrUrl} alt="QR Code" className="rounded-lg" width={200} height={200} />
            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">Scan to open event</p>
          </div>
        )}
      </div>
    </div>
  );
}
