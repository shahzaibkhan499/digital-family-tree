'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

function SectionHeader({ title, isOpen, onToggle }: { title: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex w-full items-center justify-between py-3 text-left">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <svg className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder, required = false, hint }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required = false }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
      />
    </div>
  );
}

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    images: true,
    basic: true,
    contact: false,
    personal: false,
    family: false,
    links: false,
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'error'; message: string }[]>([]);

  let toastCounter = 0;
  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const toggle = (section: string) => setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const [basic, setBasic] = useState({
    firstName: user?.firstName || '',
    middleName: user?.middleName || '',
    lastName: user?.lastName || '',
    displayName: user?.displayName || '',
    nickname: user?.nickname || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
    placeOfBirth: user?.placeOfBirth || '',
    bloodGroup: user?.bloodGroup || '',
    maritalStatus: user?.maritalStatus || '',
    nationality: user?.nationality || '',
    religion: user?.religion || '',
    languages: user?.languages || '',
  });

  const [contact, setContact] = useState({
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    alternativePhone: user?.alternativePhone || '',
    country: user?.country || '',
    province: user?.province || '',
    city: user?.city || '',
    postalCode: user?.postalCode || '',
    fullAddress: user?.fullAddress || '',
  });

  const [personal, setPersonal] = useState({
    bio: user?.bio || '',
    occupation: user?.occupation || '',
    company: user?.company || '',
    education: user?.education || '',
    skills: user?.skills || '',
    interests: user?.interests || '',
  });

  const [family, setFamily] = useState({
    fatherId: user?.fatherId || '',
    motherId: user?.motherId || '',
    spouseId: user?.spouseId || '',
    childrenIds: user?.childrenIds || '',
    siblingIds: user?.siblingIds || '',
  });

  const [links, setLinks] = useState({
    website: user?.website || '',
    socialLinks: user?.socialLinks || '',
  });

  const saveSection = async (section: string, data: Record<string, any>) => {
    setSaving(section);
    try {
      await api.profile.update(data);
      await refreshUser();
      addToast('success', `${section.charAt(0).toUpperCase() + section.slice(1)} saved!`);
    } catch (err: any) {
      addToast('error', err.message || 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'Image must be under 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      addToast('error', 'Only JPG, PNG, WebP allowed');
      return;
    }
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      await api.profile.uploadAvatar(file);
      await refreshUser();
      addToast('success', 'Avatar updated!');
    } catch (err: any) {
      setAvatarPreview(null);
      addToast('error', err.message || 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'Image must be under 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      addToast('error', 'Only JPG, PNG, WebP allowed');
      return;
    }
    setUploadingCover(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      await api.profile.uploadCover(file);
      await refreshUser();
      addToast('success', 'Cover photo updated!');
    } catch (err: any) {
      setCoverPreview(null);
      addToast('error', err.message || 'Upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await api.profile.removeAvatar();
      setAvatarPreview(null);
      await refreshUser();
      addToast('success', 'Avatar removed');
    } catch (err: any) {
      addToast('error', err.message || 'Failed');
    }
  };

  const handleRemoveCover = async () => {
    try {
      await api.profile.removeCover();
      setCoverPreview(null);
      await refreshUser();
      addToast('success', 'Cover removed');
    } catch (err: any) {
      addToast('error', err.message || 'Failed');
    }
  };

  const avatarUrl = avatarPreview || user?.avatar || null;
  const coverUrl = coverPreview || user?.coverPhoto || null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/profile" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Update your profile information</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6">
          <SectionHeader title="Photos" isOpen={openSections.images} onToggle={() => toggle('images')} />
        </div>
        {openSections.images && (
          <div className="border-t border-slate-100 px-6 pb-6 dark:border-slate-800">
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cover Photo</label>
              <div className="relative h-40 overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800">
                {coverUrl && <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />}
                <div className="absolute inset-0 flex items-center justify-center gap-2">
                  <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover} className="rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow hover:bg-white disabled:opacity-50 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-800">
                    {uploadingCover ? 'Uploading...' : coverUrl ? 'Change Cover' : 'Upload Cover'}
                  </button>
                  {coverUrl && (
                    <button onClick={handleRemoveCover} className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-600">
                      Remove
                    </button>
                  )}
                </div>
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverUpload} className="hidden" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Profile Photo</label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-slate-300 dark:text-slate-600">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                    {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                  </button>
                  {avatarUrl && (
                    <button onClick={handleRemoveAvatar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                      Remove Photo
                    </button>
                  )}
                  <p className="text-xs text-slate-400">JPG, PNG or WebP. Max 5MB.</p>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6">
          <SectionHeader title="Basic Information" isOpen={openSections.basic} onToggle={() => toggle('basic')} />
        </div>
        {openSections.basic && (
          <div className="border-t border-slate-100 px-6 pb-6 dark:border-slate-800">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label="First Name" value={basic.firstName} onChange={(v) => setBasic({ ...basic, firstName: v })} placeholder="John" />
              <InputField label="Middle Name" value={basic.middleName} onChange={(v) => setBasic({ ...basic, middleName: v })} placeholder="Michael" />
              <InputField label="Last Name" value={basic.lastName} onChange={(v) => setBasic({ ...basic, lastName: v })} placeholder="Doe" />
              <InputField label="Display Name" value={basic.displayName} onChange={(v) => setBasic({ ...basic, displayName: v })} placeholder="How you want to be known" />
              <InputField label="Nickname" value={basic.nickname} onChange={(v) => setBasic({ ...basic, nickname: v })} placeholder="Johnny" />
              <SelectField label="Gender" value={basic.gender} onChange={(v) => setBasic({ ...basic, gender: v })} options={[
                { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }, { value: 'prefer_not_to_say', label: 'Prefer not to say' },
              ]} />
              <InputField label="Date of Birth" value={basic.dateOfBirth} onChange={(v) => setBasic({ ...basic, dateOfBirth: v })} type="date" />
              <InputField label="Place of Birth" value={basic.placeOfBirth} onChange={(v) => setBasic({ ...basic, placeOfBirth: v })} placeholder="City, Country" />
              <SelectField label="Blood Group" value={basic.bloodGroup} onChange={(v) => setBasic({ ...basic, bloodGroup: v })} options={[
                { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' }, { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }, { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
              ]} />
              <SelectField label="Marital Status" value={basic.maritalStatus} onChange={(v) => setBasic({ ...basic, maritalStatus: v })} options={[
                { value: 'single', label: 'Single' }, { value: 'married', label: 'Married' }, { value: 'divorced', label: 'Divorced' },
                { value: 'widowed', label: 'Widowed' }, { value: 'engaged', label: 'Engaged' }, { value: 'complicated', label: 'Complicated' },
              ]} />
              <InputField label="Nationality" value={basic.nationality} onChange={(v) => setBasic({ ...basic, nationality: v })} placeholder="Pakistani" />
              <InputField label="Religion" value={basic.religion} onChange={(v) => setBasic({ ...basic, religion: v })} placeholder="Islam" />
              <div className="sm:col-span-2">
                <InputField label="Languages" value={basic.languages} onChange={(v) => setBasic({ ...basic, languages: v })} placeholder="English, Urdu, Arabic" hint="Comma-separated list" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => saveSection('basic', basic)} disabled={saving === 'basic'} className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving === 'basic' ? 'Saving...' : 'Save Basic Info'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6">
          <SectionHeader title="Contact Information" isOpen={openSections.contact} onToggle={() => toggle('contact')} />
        </div>
        {openSections.contact && (
          <div className="border-t border-slate-100 px-6 pb-6 dark:border-slate-800">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label="Phone" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} type="tel" placeholder="+1 234 567 890" />
              <InputField label="WhatsApp" value={contact.whatsapp} onChange={(v) => setContact({ ...contact, whatsapp: v })} type="tel" placeholder="+1 234 567 890" />
              <InputField label="Alternative Phone" value={contact.alternativePhone} onChange={(v) => setContact({ ...contact, alternativePhone: v })} type="tel" />
              <InputField label="Country" value={contact.country} onChange={(v) => setContact({ ...contact, country: v })} placeholder="Pakistan" />
              <InputField label="Province / State" value={contact.province} onChange={(v) => setContact({ ...contact, province: v })} placeholder="Punjab" />
              <InputField label="City" value={contact.city} onChange={(v) => setContact({ ...contact, city: v })} placeholder="Lahore" />
              <InputField label="Postal Code" value={contact.postalCode} onChange={(v) => setContact({ ...contact, postalCode: v })} placeholder="54000" />
              <div className="sm:col-span-2">
                <InputField label="Full Address" value={contact.fullAddress} onChange={(v) => setContact({ ...contact, fullAddress: v })} placeholder="123 Main St, Apt 4B" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => saveSection('contact', contact)} disabled={saving === 'contact'} className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving === 'contact' ? 'Saving...' : 'Save Contact Info'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6">
          <SectionHeader title="About & Occupation" isOpen={openSections.personal} onToggle={() => toggle('personal')} />
        </div>
        {openSections.personal && (
          <div className="border-t border-slate-100 px-6 pb-6 dark:border-slate-800">
            <div className="grid grid-cols-1 gap-4">
              <TextareaField label="Bio" value={personal.bio} onChange={(v) => setPersonal({ ...personal, bio: v })} placeholder="Tell others about yourself..." rows={4} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField label="Occupation" value={personal.occupation} onChange={(v) => setPersonal({ ...personal, occupation: v })} placeholder="Software Engineer" />
                <InputField label="Company" value={personal.company} onChange={(v) => setPersonal({ ...personal, company: v })} placeholder="Acme Inc." />
              </div>
              <InputField label="Education" value={personal.education} onChange={(v) => setPersonal({ ...personal, education: v })} placeholder="BS Computer Science, MIT" />
              <InputField label="Skills" value={personal.skills} onChange={(v) => setPersonal({ ...personal, skills: v })} placeholder="React, Node.js, Python" hint="Comma-separated" />
              <InputField label="Interests" value={personal.interests} onChange={(v) => setPersonal({ ...personal, interests: v })} placeholder="Photography, Travel, Cooking" hint="Comma-separated" />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => saveSection('personal', personal)} disabled={saving === 'personal'} className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving === 'personal' ? 'Saving...' : 'Save About Info'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6">
          <SectionHeader title="Family Links (by Member ID)" isOpen={openSections.family} onToggle={() => toggle('family')} />
        </div>
        {openSections.family && (
          <div className="border-t border-slate-100 px-6 pb-6 dark:border-slate-800">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label="Father Member ID" value={family.fatherId} onChange={(v) => setFamily({ ...family, fatherId: v })} placeholder="MEM-XXXXXXXX" hint="Search in your families" />
              <InputField label="Mother Member ID" value={family.motherId} onChange={(v) => setFamily({ ...family, motherId: v })} placeholder="MEM-XXXXXXXX" />
              <InputField label="Spouse Member ID" value={family.spouseId} onChange={(v) => setFamily({ ...family, spouseId: v })} placeholder="MEM-XXXXXXXX" />
              <InputField label="Sibling Member IDs" value={family.siblingIds} onChange={(v) => setFamily({ ...family, siblingIds: v })} placeholder="MEM-AAA,MEM-BBB" hint="Comma-separated" />
              <div className="sm:col-span-2">
                <InputField label="Children Member IDs" value={family.childrenIds} onChange={(v) => setFamily({ ...family, childrenIds: v })} placeholder="MEM-CCC,MEM-DDD" hint="Comma-separated" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => saveSection('family', family)} disabled={saving === 'family'} className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving === 'family' ? 'Saving...' : 'Save Family Links'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6">
          <SectionHeader title="Website & Social Links" isOpen={openSections.links} onToggle={() => toggle('links')} />
        </div>
        {openSections.links && (
          <div className="border-t border-slate-100 px-6 pb-6 dark:border-slate-800">
            <div className="grid grid-cols-1 gap-4">
              <InputField label="Website" value={links.website} onChange={(v) => setLinks({ ...links, website: v })} type="url" placeholder="https://yoursite.com" />
              <TextareaField label="Social Links" value={links.socialLinks} onChange={(v) => setLinks({ ...links, socialLinks: v })} placeholder={"LinkedIn: https://linkedin.com/in/johndoe\nTwitter: https://twitter.com/johndoe\nFacebook: https://facebook.com/johndoe"} rows={4} />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => saveSection('links', links)} disabled={saving === 'links'} className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving === 'links' ? 'Saving...' : 'Save Links'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
