import { redirect, notFound } from 'next/navigation';

const API_BASE = process.env.API_URL || 'http://127.0.0.1:4000/api';

async function getProfileByDisplayId(displayId: string): Promise<{ profileSlug: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/profile/public/by-id/${displayId}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { profileSlug: data.profileSlug };
  } catch {
    return null;
  }
}

export default async function UserRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfileByDisplayId(id);

  if (!profile || !profile.profileSlug) {
    notFound();
  }

  redirect(`/member/${profile.profileSlug}`);
}
