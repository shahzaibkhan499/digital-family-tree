'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const status = (err as any).status ?? (err as any).statusCode ?? (err as any).data?.statusCode;
    const data = (err as any).data;

    if (status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
    if (status === 401) return 'Invalid email or password';
    if (status === 409) return 'This email is already registered. Please login instead.';

    if (data && typeof data === 'object') {
      const msg = data.message;
      if (typeof msg === 'string') {
        const cleaned = msg.replace(/^ThrottlerException:\s*/i, '');
        if (cleaned !== msg) return cleaned;
        if (msg === 'Invalid credentials') return 'Invalid email or password';
        if (msg === 'Email already registered')
          return 'This email is already registered. Please login instead.';
        return msg;
      }
      if (Array.isArray(msg)) return msg.join(', ');
      if (msg && typeof msg === 'object') {
        const nested = (msg as any).message;
        if (typeof nested === 'string') return nested.replace(/^ThrottlerException:\s*/i, '');
        if (Array.isArray(nested)) return nested.join(', ');
      }
    }

    const errMsg = (err as any).message;
    if (typeof errMsg === 'string') {
      const cleaned = errMsg.replace(/^ThrottlerException:\s*/i, '');
      if (cleaned === 'Invalid credentials') return 'Invalid email or password';
      if (cleaned === 'Email already registered')
        return 'This email is already registered. Please login instead.';
      return cleaned;
    }
    if (Array.isArray(errMsg)) return errMsg.join(', ');
  }
  return 'Something went wrong. Please try again.';
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password || password.length < 10) {
      errors.password =
        'Password must be at least 10 characters with uppercase, lowercase, number, and special character';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validate()) return;

    setLoading(true);

    try {
      await register(name.trim(), email.trim(), password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create Account</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Start building your family tree today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={`mt-1 w-full rounded-lg border bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 ${
                fieldErrors.name
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              placeholder="John Smith"
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`mt-1 w-full rounded-lg border bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 ${
                fieldErrors.email
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              placeholder="you@example.com"
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={10}
              autoComplete="new-password"
              className={`mt-1 w-full rounded-lg border bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 ${
                fieldErrors.password
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={10}
              autoComplete="new-password"
              className={`mt-1 w-full rounded-lg border bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 ${
                fieldErrors.confirmPassword
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
