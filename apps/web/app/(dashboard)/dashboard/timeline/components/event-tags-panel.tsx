'use client';

import { useState } from 'react';
import { X, Plus, Tag, Bookmark, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';

interface EventTagsPanelProps {
  eventId: string;
  initialTags?: string[];
  initialKeywords?: string[];
  onUpdate?: (tags: string[], keywords: string[]) => void;
}

export default function EventTagsPanel({ eventId, initialTags = [], initialKeywords = [], onUpdate }: EventTagsPanelProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleAddTag = async () => {
    const val = tagInput.trim();
    if (!val || addingTag || tags.includes(val)) return;
    setAddingTag(true);
    try {
      await api.timeline.addTags(eventId, [val]);
      const next = [...tags, val];
      setTags(next);
      setTagInput('');
      onUpdate?.(next, keywords);
    } catch { /* empty */ } finally { setAddingTag(false); }
  };

  const handleRemoveTag = async (tag: string) => {
    setRemoving(tag);
    try {
      await api.timeline.removeTags(eventId, [tag]);
      const next = tags.filter(t => t !== tag);
      setTags(next);
      onUpdate?.(next, keywords);
    } catch { /* empty */ } finally { setRemoving(null); }
  };

  const handleAddKeyword = async () => {
    const val = keywordInput.trim();
    if (!val || addingKeyword || keywords.includes(val)) return;
    setAddingKeyword(true);
    try {
      await api.timeline.addKeywords(eventId, [val]);
      const next = [...keywords, val];
      setKeywords(next);
      setKeywordInput('');
      onUpdate?.(tags, next);
    } catch { /* empty */ } finally { setAddingKeyword(false); }
  };

  const handleRemoveKeyword = async (keyword: string) => {
    setRemoving(keyword);
    try {
      await api.timeline.removeKeywords(eventId, [keyword]);
      const next = keywords.filter(k => k !== keyword);
      setKeywords(next);
      onUpdate?.(tags, next);
    } catch { /* empty */ } finally { setRemoving(null); }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Tags</h4>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  disabled={removing === tag}
                  className="rounded-full p-0.5 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 transition-colors"
                >
                  {removing === tag ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
            placeholder="Add a tag..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            onClick={handleAddTag}
            disabled={!tagInput.trim() || addingTag}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {addingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Add
          </button>
        </div>
        {tags.length === 0 && !addingTag && (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">No tags added yet</p>
        )}
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <Bookmark className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Keywords</h4>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {keywords.map(keyword => (
              <span
                key={keyword}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
              >
                {keyword}
                <button
                  onClick={() => handleRemoveKeyword(keyword)}
                  disabled={removing === keyword}
                  className="rounded-full p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
                >
                  {removing === keyword ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
            placeholder="Add a keyword..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            onClick={handleAddKeyword}
            disabled={!keywordInput.trim() || addingKeyword}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {addingKeyword ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Add
          </button>
        </div>
        {keywords.length === 0 && !addingKeyword && (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">No keywords added yet</p>
        )}
      </div>
    </div>
  );
}
