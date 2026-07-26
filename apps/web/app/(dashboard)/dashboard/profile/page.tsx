'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';

function Avatar({ src, name, size = 'lg' }: { src: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'h-32 w-32 text-4xl' : size === 'md' ? 'h-12 w-12 text-lg' : 'h-8 w-8 text-sm';
  if (src) return <img src={src} alt={name} className={`${dims} rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-lg`} />;
  return <div className={`${dims} rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center font-bold text-white shadow-lg`}>{name.charAt(0).toUpperCase()}</div>;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 text-emerald-500 dark:text-emerald-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-white break-words">{value}</p>
      </div>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>{children}</div>;
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{children}</h3>
      {action}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-6 py-5 text-sm text-slate-400 dark:text-slate-500 italic">{text}</p>;
}

function Pill({ children, color = 'emerald' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color] || colors.emerald}`}>{children}</span>;
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

const Icons = {
  user: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
  calendar: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
  location: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
  phone: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>,
  email: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
  globe: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
  briefcase: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>,
  heart: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>,
  family: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
  chart: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  clock: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  document: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  star: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
  check: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
  link: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.28-1.14a4.5 4.5 0 00-6.364-6.364L5.25 8.25" /></svg>,
  edit: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
  settings: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  trash: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  upload: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
  invite: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  privacy: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.286z" /></svg>,
  image: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>,
  storage: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>,
};

function parseSocialLinks(raw: string | null | undefined): { platform: string; url: string }[] {
  if (!raw) return [];
  const links: { platform: string; url: string }[] = [];
  const lines = raw.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^([^:]+):\s*(https?:\/\/.+)$/i);
    if (match) {
      links.push({ platform: match[1].trim(), url: match[2].trim() });
    } else if (trimmed.startsWith('http')) {
      links.push({ platform: 'Link', url: trimmed });
    }
  }
  if (links.length === 0 && raw.trim()) {
    links.push({ platform: 'Link', url: raw.trim() });
  }
  return links;
}

function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
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

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [families, setFamilies] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalFamilies: number; totalMembers: number } | null>(null);
  const [completion, setCompletion] = useState<{ percentage: number; missingFields: string[] } | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [familyLimit, setFamilyLimit] = useState<{ used: number; limit: number | null } | null>(null);

  useEffect(() => {
    api.families.list().then(setFamilies).catch(() => {});
    api.families.stats().then(setStats).catch(() => {});
    api.profile.getCompletion().then(setCompletion).catch(() => {});
    api.profile.getSessions().then(setSessions).catch(() => {});
    api.families.getLimit().then(setFamilyLimit).catch(() => {});
  }, []);

  if (!user) return null;

  const coverUrl = user.coverPhoto || null;
  const avatarUrl = user.avatar || null;
  const fullName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ') || user.name;
  const displayName = user.displayName || fullName;
  const location = [user.city, user.country].filter(Boolean).join(', ');
  const age = calcAge(user.dateOfBirth);
  const socialLinks = parseSocialLinks(user.socialLinks);
  const totalMembers = stats?.totalMembers ?? 0;
  const totalFamilies = stats?.totalFamilies ?? families.length;
  const accountAge = user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const genderLabel = user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1).replace(/_/g, ' ') : null;

  const activityItems = [
    { icon: Icons.user, text: 'Joined the platform', date: user.createdAt },
    ...(user.updatedAt && user.updatedAt !== user.createdAt ? [{ icon: Icons.edit, text: 'Updated profile', date: user.updatedAt }] : []),
    ...(user.lastLoginAt ? [{ icon: Icons.clock, text: 'Last login', date: user.lastLoginAt }] : []),
    ...sessions.slice(0, 3).map((s: any) => ({ icon: Icons.clock, text: `Logged in from ${s.ip || 'unknown device'}`, date: s.loggedAt })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-500">

      <Card className="overflow-hidden">
        <div className="relative h-48 sm:h-64 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 transition-all duration-700">
          {coverUrl && <img src={coverUrl} alt="Cover" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-16 sm:-mt-14">
            <div className="shrink-0">
              <Avatar src={avatarUrl} name={displayName} size="lg" />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{displayName}</h1>
                {user.emailVerified && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {Icons.check} Verified
                  </span>
                )}
              </div>
              {user.username && <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">@{user.username}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {user.displayId && <Pill>{user.displayId}</Pill>}
                {location && <span className="flex items-center gap-1">{Icons.location} {location}</span>}
                {user.createdAt && <span className="flex items-center gap-1">{Icons.calendar} Member since {formatDate(user.createdAt)}</span>}
                {user.plan && user.plan !== 'free' && <Pill color="amber">{user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}</Pill>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href="/dashboard/profile/edit" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/30 transition-all">
                {Icons.edit} Edit Profile
              </Link>
            </div>
          </div>
        </div>
        {completion && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Profile completion</span>
            <div className="flex items-center gap-3">
              <div className="h-2 w-32 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700" style={{ width: `${completion.percentage}%` }} />
              </div>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{completion.percentage}%</span>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          {(user.bio || user.interests || user.languages) && (
            <Card>
              <SectionTitle>About</SectionTitle>
              <div className="space-y-4 px-6 py-5">
                {user.bio && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Bio</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
                  </div>
                )}
                {user.interests && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.interests.split(',').map((i: string) => i.trim()).filter(Boolean).map((interest: string, idx: number) => (
                        <Pill key={idx} color="slate">{interest}</Pill>
                      ))}
                    </div>
                  </div>
                )}
                {user.languages && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.languages.split(',').map((l: string) => l.trim()).filter(Boolean).map((lang: string, idx: number) => (
                        <Pill key={idx} color="blue">{lang}</Pill>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card>
            <SectionTitle>Personal Information</SectionTitle>
            <div className="px-6 py-3 divide-y divide-slate-50 dark:divide-slate-800/50">
              <InfoRow icon={Icons.user} label="Full Name" value={fullName !== user.name ? fullName : null} />
              <InfoRow icon={Icons.user} label="Display Name" value={user.displayName} />
              <InfoRow icon={Icons.user} label="Nickname" value={user.nickname} />
              <InfoRow icon={Icons.user} label="Gender" value={genderLabel} />
              <InfoRow icon={Icons.calendar} label="Date of Birth" value={user.dateOfBirth ? formatDate(user.dateOfBirth) : null} />
              {age !== null && <InfoRow icon={Icons.calendar} label="Age" value={`${age} years`} />}
              <InfoRow icon={Icons.globe} label="Nationality" value={user.nationality} />
              <InfoRow icon={Icons.heart} label="Religion" value={user.religion} />
              <InfoRow icon={Icons.user} label="Blood Group" value={user.bloodGroup} />
              <InfoRow icon={Icons.heart} label="Marital Status" value={user.maritalStatus ? user.maritalStatus.charAt(0).toUpperCase() + user.maritalStatus.slice(1) : null} />
              <InfoRow icon={Icons.briefcase} label="Occupation" value={user.occupation ? [user.occupation, user.company].filter(Boolean).join(' at ') : null} />
              <InfoRow icon={Icons.document} label="Education" value={user.education} />
              <InfoRow icon={Icons.star} label="Skills" value={user.skills} />
              <InfoRow icon={Icons.location} label="Place of Birth" value={user.placeOfBirth} />
            </div>
            {!user.firstName && !user.gender && !user.dateOfBirth && !user.occupation && (
              <Empty text="No personal information added yet." />
            )}
          </Card>

          <Card>
            <SectionTitle>Contact Information</SectionTitle>
            <div className="px-6 py-3 divide-y divide-slate-50 dark:divide-slate-800/50">
              <InfoRow icon={Icons.email} label="Email" value={user.email} />
              <InfoRow icon={Icons.phone} label="Phone" value={user.phone} />
              <InfoRow icon={Icons.phone} label="WhatsApp" value={user.whatsapp} />
              <InfoRow icon={Icons.phone} label="Alternative Phone" value={user.alternativePhone} />
              <InfoRow icon={Icons.globe} label="Country" value={user.country} />
              <InfoRow icon={Icons.location} label="Province / State" value={user.province} />
              <InfoRow icon={Icons.location} label="City" value={user.city} />
              <InfoRow icon={Icons.location} label="Postal Code" value={user.postalCode} />
              <InfoRow icon={Icons.location} label="Full Address" value={user.fullAddress} />
              <InfoRow icon={Icons.globe} label="Website" value={user.website} />
            </div>
            {socialLinks.length > 0 && (
              <div className="px-6 pb-5 pt-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Social Links</p>
                <div className="space-y-1.5">
                  {socialLinks.map((link, idx) => (
                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
                      {Icons.link}
                      <span className="font-medium">{link.platform}:</span>
                      <span className="truncate">{link.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Documents</SectionTitle>
            <div className="px-6 py-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Certificates', icon: Icons.star, count: 0 },
                  { label: 'Photos', icon: Icons.image, count: 0 },
                  { label: 'Identity', icon: Icons.document, count: 0 },
                  { label: 'Family Docs', icon: Icons.family, count: 0 },
                ].map((doc) => (
                  <div key={doc.label} className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">{doc.icon}</div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{doc.label}</p>
                    <p className="text-lg font-bold text-slate-300 dark:text-slate-600">{doc.count}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">Document uploads coming soon.</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">

          <Card>
            <SectionTitle>Statistics</SectionTitle>
            <div className="px-4 py-4 grid grid-cols-2 gap-3">
              <StatCard label="Families" value={totalFamilies} icon={Icons.family} />
              <StatCard label="Members" value={totalMembers} icon={Icons.user} />
              <StatCard label="Photos" value={user.avatar ? 1 : 0} icon={Icons.image} />
              <StatCard label="Account Age" value={`${accountAge}d`} icon={Icons.clock} />
            </div>
            {familyLimit && familyLimit.limit !== null && (
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Family slots used</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{familyLimit.used}/{familyLimit.limit}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min((familyLimit.used / familyLimit.limit) * 100, 100)}%` }} />
                </div>
              </div>
            )}
          </Card>

          {families.length > 0 && (
            <Card>
              <SectionTitle action={<Link href="/dashboard/families" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">View all</Link>}>Families</SectionTitle>
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {families.slice(0, 4).map((f: any) => (
                  <Link key={f.id} href={`/dashboard/families/${f.id}`} className="block px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{f.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{f._count?.members || 0} members{f.description ? ` Â· ${f.description.slice(0, 40)}${f.description.length > 40 ? '...' : ''}` : ''}</p>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <SectionTitle>Timeline</SectionTitle>
            <div className="px-6 py-4">
              {activityItems.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-[15px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-4">
                    {activityItems.map((item, idx) => (
                      <div key={idx} className="flex gap-3 relative">
                        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0 z-10">{item.icon}</div>
                        <div className="min-w-0 pt-1">
                          <p className="text-sm text-slate-700 dark:text-slate-300">{item.text}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{formatRelative(item.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Empty text="No activity yet." />
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle>Quick Actions</SectionTitle>
            <div className="p-3 space-y-1">
              {[
                { href: '/dashboard/profile/edit', icon: Icons.edit, label: 'Edit Profile' },
                { href: '/dashboard/families/new', icon: Icons.family, label: 'Create Family' },
                { href: '/dashboard/families', icon: Icons.user, label: 'Manage Families' },
                { href: '/dashboard/settings', icon: Icons.settings, label: 'Settings' },
                { href: '/dashboard/settings', icon: Icons.privacy, label: 'Privacy' },
              ].map((action) => (
                <Link key={action.label} href={action.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-slate-400 dark:text-slate-500">{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>Account Info</SectionTitle>
            <div className="px-6 py-4 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">User ID</span><span className="font-mono font-medium text-slate-700 dark:text-slate-300">{user.displayId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Role</span><span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{user.role}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Plan</span><span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{user.plan}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Language</span><span className="font-medium text-slate-700 dark:text-slate-300 uppercase">{user.locale || 'EN'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Timezone</span><span className="font-medium text-slate-700 dark:text-slate-300">{user.timezone || 'UTC'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Status</span><span className="font-medium text-emerald-600 dark:text-emerald-400 capitalize">{user.accountStatus || 'Active'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">2FA</span><span className="font-medium text-slate-700 dark:text-slate-300">{user.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Created</span><span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(user.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Updated</span><span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(user.updatedAt)}</span></div>
            </div>
          </Card>

          {user.profileSlug && (
            <Card className="p-6 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Share your profile</p>
              <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-800/50">
                <span className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">/member/{user.profileSlug}</span>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/member/${user.profileSlug}`); }} className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">Copy</button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
