'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { api } from '@/lib/api-client';

interface UseEventFormAutoSaveOptions {
  data: Record<string, any>;
  draftId?: string | null;
  interval?: number;
  enabled?: boolean;
}

interface UseEventFormAutoSaveResult {
  save: () => Promise<string | null>;
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  saveError: Error | null;
  saveCount: number;
  triggerSave: () => Promise<void>;
}

export function useEventFormAutoSave({
  data,
  draftId: initialDraftId,
  interval = 5000,
  enabled = true,
}: UseEventFormAutoSaveOptions): UseEventFormAutoSaveResult {
  const draftIdRef = useRef<string | null>(initialDraftId || null);
  const lastDataRef = useRef<string>('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [saveCount, setSaveCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const save = useCallback(async (): Promise<string | null> => {
    if (!enabled) return null;

    const dataStr = JSON.stringify(dataRef.current);
    if (dataStr === lastDataRef.current) return draftIdRef.current;

    setIsSaving(true);
    setSaveError(null);

    try {
      const payload: Record<string, any> = {
        eventType: dataRef.current.eventType,
        title: dataRef.current.title || '',
        subtitle: dataRef.current.subtitle || '',
        description: dataRef.current.description || '',
        category: dataRef.current.category || '',
        date: dataRef.current.date || undefined,
        endDate: dataRef.current.endDate || undefined,
        time: dataRef.current.time || undefined,
        isAllDay: dataRef.current.isAllDay || false,
        timezone: dataRef.current.timezone || 'UTC',
        language: dataRef.current.language || 'en',
        country: dataRef.current.country || '',
        location: dataRef.current.location || '',
        venue: dataRef.current.venue || '',
        mapLink: dataRef.current.mapLink || '',
        coordinates: dataRef.current.coordinates || '',
        coverImage: dataRef.current.coverImage || '',
        status: dataRef.current.status || 'DRAFT',
        visibility: dataRef.current.visibility || 'FAMILY',
        familyId: dataRef.current.familyId || undefined,
        memberId: dataRef.current.memberId || undefined,
        participantIds: dataRef.current.participantIds || [],
        tags: dataRef.current.tags || [],
        keywords: dataRef.current.keywords || [],
        media: (dataRef.current.media || []).filter((m: any) => m.url),
        documents: dataRef.current.documents || [],
        subClanId: dataRef.current.subClanId || undefined,
        clanId: dataRef.current.clanId || undefined,
        communityId: dataRef.current.communityId || undefined,
        verified: dataRef.current.verified || false,
        pinned: dataRef.current.pinned || false,
        featured: dataRef.current.featured || false,
        recurrence: dataRef.current.recurrence || undefined,
        recurrenceRule: dataRef.current.recurrenceRule || undefined,
        seriesId: dataRef.current.seriesId || undefined,
        parentEventId: dataRef.current.parentEventId || undefined,
        maxAttendees: dataRef.current.maxAttendees || undefined,
        rsvpDeadline: dataRef.current.rsvpDeadline || undefined,
        color: dataRef.current.color || undefined,
      };

      let result: any;

      if (draftIdRef.current) {
        result = await api.timeline.update(draftIdRef.current, payload);
      } else {
        result = await api.timeline.saveDraft(payload);
      }

      if (mountedRef.current) {
        if (result?.id) {
          draftIdRef.current = result.id;
        }
        lastDataRef.current = dataStr;
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setSaveCount((c) => c + 1);
      }

      return draftIdRef.current;
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setSaveError(error);
        setHasUnsavedChanges(true);
      }
      return null;
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [enabled]);

  const triggerSave = useCallback(async () => {
    await save();
  }, [save]);

  // Debounced save: wait 2s after last change
  useEffect(() => {
    if (!enabled) return;

    const dataStr = JSON.stringify(data);
    if (dataStr !== lastDataRef.current) {
      setHasUnsavedChanges(true);
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      save();
    }, 2000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [data, enabled, save]);

  // Periodic save every `interval` ms
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      if (hasUnsavedChanges) {
        save();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, hasUnsavedChanges, save]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    save,
    lastSaved,
    isSaving,
    hasUnsavedChanges,
    saveError,
    saveCount,
    triggerSave,
  };
}
