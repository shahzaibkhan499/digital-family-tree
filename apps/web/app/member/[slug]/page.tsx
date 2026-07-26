import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const API_BASE = process.env.API_URL || 'http://127.0.0.1:4000/api';

interface PublicProfile {
  id: string;
  displayId: string;
  name: string;
  profileSlug: string;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  occupation: string | null;
  company: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
}

async function getPublicProfile(slug: string): Promise<PublicProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/profile/public/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) return { title: 'Profile Not Found' };
  return {
    title: `${profile.name} - Digital Family Tree`,
    description: profile.bio || `View ${profile.name}'s public profile`,
  };
}

export default async function MemberProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);

  if (!profile) notFound();

  const location = [profile.city, profile.country].filter(Boolean).join(', ');
  const avatarUrl = profile.avatar || null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-6">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile.name}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {profile.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {profile.name}
              </h1>
              {profile.username && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  @{profile.username}
                </p>
              )}
              {profile.occupation && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {profile.occupation}
                  {profile.company ? ` at ${profile.company}` : ''}
                </p>
              )}
              {location && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {location}
                </p>
              )}
            </div>
          </div>

          {profile.bio && (
            <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
              <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">About</h2>
              <p className="mt-2 text-slate-700 dark:text-slate-300">{profile.bio}</p>
            </div>
          )}

          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            &larr; Back to Digital Family Tree
          </a>
        </div>
      </div>
    </div>
  );
}
