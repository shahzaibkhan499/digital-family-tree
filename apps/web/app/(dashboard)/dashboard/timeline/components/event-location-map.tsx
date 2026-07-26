'use client';

import { useState } from 'react';
import { MapPin, ExternalLink, Navigation, Share2, Copy, Check, Globe } from 'lucide-react';

interface EventLocationMapProps {
  location?: string;
  venue?: string;
  latitude?: number;
  longitude?: number;
  mapLink?: string;
  address?: string;
}

function formatCoordinates(lat?: number, lng?: number) {
  if (lat == null || lng == null) return null;
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(6)}Â° ${latDir}, ${Math.abs(lng).toFixed(6)}Â° ${lngDir}`;
}

function getGoogleMapsUrl(lat?: number, lng?: number, location?: string) {
  if (lat != null && lng != null) return `https://www.google.com/maps?q=${lat},${lng}&z=15`;
  if (location) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  return null;
}

export default function EventLocationMap({ location, venue, latitude, longitude, mapLink, address }: EventLocationMapProps) {
  const [copied, setCopied] = useState(false);
  const displayAddress = address || [venue, location].filter(Boolean).join(', ');
  const mapsUrl = mapLink || getGoogleMapsUrl(latitude, longitude, location);
  const embedUrl = (latitude != null && longitude != null)
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
    : location
      ? `https://maps.google.com/maps?q=${encodeURIComponent(location)}&z=15&output=embed`
      : null;

  if (!displayAddress && !mapsUrl) return null;

  const copyAddress = () => {
    if (displayAddress) {
      navigator.clipboard.writeText(displayAddress).then(() => {
        setCopied(true); setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const shareLocation = () => {
    if (navigator.share && displayAddress) {
      navigator.share({ title: 'Event Location', text: displayAddress, url: mapsUrl || undefined });
    } else { copyAddress(); }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-rose-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Location</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={shareLocation}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={copyAddress}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Map embed or placeholder */}
        {embedUrl ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <iframe
              src={embedUrl}
              className="h-48 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Event Location"
            />
          </div>
        ) : displayAddress ? (
          <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-slate-300 bg-gradient-to-br from-rose-50 to-orange-50 dark:border-slate-700 dark:from-rose-900/10 dark:to-orange-900/10">
            <div className="text-center">
              <MapPin className="mx-auto h-10 w-10 text-rose-400" />
              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">{displayAddress}</p>
            </div>
          </div>
        ) : null}

        {/* Address info */}
        {displayAddress && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{displayAddress}</p>
              {latitude != null && longitude != null && (
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                  {formatCoordinates(latitude, longitude)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex gap-2">
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
              <Navigation className="h-3.5 w-3.5" /> Open in Maps
            </a>
          )}
          {mapsUrl && (
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${latitude != null && longitude != null ? `${latitude},${longitude}` : encodeURIComponent(displayAddress)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
              <ExternalLink className="h-3.5 w-3.5" /> Directions
            </a>
          )}
          <button onClick={copyAddress}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
