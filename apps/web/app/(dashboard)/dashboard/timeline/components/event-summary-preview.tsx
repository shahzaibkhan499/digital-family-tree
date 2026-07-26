'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Edit3, Copy, Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';

interface EventSummaryPreviewProps {
  eventId: string;
  eventType: string;
  data: Record<string, any>;
  onAccept?: () => void;
}

export function EventSummaryPreview({ eventId, eventType, data, onAccept }: EventSummaryPreviewProps) {
  const [summary, setSummary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateSummary();
  }, [eventId]);

  const generateSummary = async () => {
    if (!eventId) {
      setSummary(generateClientSummary(data, eventType));
      return;
    }
    setIsGenerating(true);
    try {
      const result = await api.timeline.generateSummary(eventId);
      setSummary(result?.generatedText || generateClientSummary(data, eventType));
    } catch {
      setSummary(generateClientSummary(data, eventType));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateClientSummary = (d: Record<string, any>, type: string): string => {
    const parts: string[] = [];
    const date = d.date
      ? new Date(d.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';

    if (date) parts.push(`On ${date},`);

    switch (type) {
      case 'BIRTH':
        if (d.babyName) parts.push(`${d.babyName} was born`);
        if (d.hospitalName) parts.push(`at ${d.hospitalName}`);
        if (d.birthPlace) parts.push(`in ${d.birthPlace}`);
        parts.push('.');
        if (d.birthWeight) parts.push(`Birth weight: ${d.birthWeight}${d.birthWeightUnit || 'kg'}.`);
        if (d.fatherName) parts.push(`Father: ${d.fatherName}.`);
        if (d.motherName) parts.push(`Mother: ${d.motherName}.`);
        break;
      case 'MARRIAGE':
        if (d.spouseName) parts.push(`${d.title || 'A marriage ceremony'} took place between the couple`);
        if (d.venue) parts.push(`at ${d.venue}`);
        parts.push('.');
        break;
      case 'DEATH':
        parts.push(`${d.title || 'A memorial event'}`);
        if (d.causeOfDeath) parts.push(`Cause: ${d.causeOfDeath}`);
        parts.push('.');
        break;
      default:
        parts.push(`${d.title || type} event.`);
        if (d.description) parts.push(d.description);
    }

    return parts.filter(Boolean).join(' ');
  };

  const handleSaveEdit = async () => {
    if (eventId) {
      await api.timeline.updateSummary(eventId, editedText);
    }
    setSummary(editedText);
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 p-6 backdrop-blur-xl dark:border-emerald-800/60 dark:from-emerald-900/20 dark:to-teal-900/20"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI-Generated Summary</h3>
            <p className="text-xs text-slate-500">This will be shown on the timeline</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={generateSummary}
            disabled={isGenerating}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/60 hover:text-slate-600 dark:hover:bg-slate-800/60"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setIsEditing(true);
              setEditedText(summary);
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/60 hover:text-slate-600 dark:hover:bg-slate-800/60"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={handleCopy}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/60 hover:text-slate-600 dark:hover:bg-slate-800/60"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full rounded-xl border border-emerald-200 bg-white/60 p-3 text-sm text-slate-700 backdrop-blur-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-800 dark:bg-slate-800/60 dark:text-white"
            rows={4}
          />
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
              Save
            </button>
            <button onClick={() => setIsEditing(false)} className="rounded-xl border border-slate-200 bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-white/60 p-4 backdrop-blur-sm dark:bg-slate-800/40">
          {isGenerating ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Generating summary...
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{summary}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
