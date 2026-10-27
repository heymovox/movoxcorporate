import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Lock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSEO } from '../../lib/seo';
import { Reveal } from '../../components/Reveal';
import { siteUrl } from '../../lib/host';
import { useAuth } from '../../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
  remember: z.boolean().optional(),
});

export default function AdminLogin() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setStatus('submitting');
    setErrorMessage(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
        // Never leave the button spinning: a stalled API must surface an
        // error instead of a forever-pending promise.
        signal: AbortSignal.timeout(15_000),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        setStatus('success');
        setTimeout(() => login(data.token, data.user), 700);
      } else {
        setErrorMessage(
          res.status === 503
            ? (data.error ?? 'Sign in is unavailable right now.')
            : (data.error ?? 'Invalid email or password. Please try again.'),
        );
        setStatus('error');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')
          ? 'The request timed out. Please try again.'
          : 'Could not reach the server. Please try again.',
      );
      setStatus('error');
    }
  };

  const inputError = (field: keyof typeof errors) =>
    errors[field]?.message as string | undefined;

  const fieldClass = (hasError?: string) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${
      hasError ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-brand-300'
    }`;

  useSEO({
    title: 'Admin Login — MovoX',
    description: 'Sign in to the MovoX admin dashboard',
    path: '/login',
  });

return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: themed content panel */}
      <aside className="relative hidden overflow-hidden bg-brand-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 bg-brand-gradient opacity-90"
          aria-hidden="true"
        />
        <div
          className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-brand-300/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <a href={siteUrl('/')} aria-label="MovoX — Digital Growth, home">
            <img
              src="/images/brand/logo-white.png"
              alt="MovoX — Beyond Digital"
              className="h-10 w-auto object-contain"
              width="220"
              height="57"
            />
</a>
          </div>

          <div className="relative z-10 max-w-md">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-brand-200">
            Admin Access
          </p>
          <h1 className="mt-4 font-heading text-4xl font-extrabold leading-tight text-white">
            Manage every{' '}
            <span className="text-brand-200">enquiry</span> in one place.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-brand-100">
            Review incoming project requests, track analytics, and keep your
            pipeline moving — all from a single dashboard.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              'Track and reply to every project enquiry',
              'Monitor enquiry volume and trends',
              'Keep client details organised and searchable',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-brand-50">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-brand-200"
                  aria-hidden="true"
                />
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-brand-200/80">
          &copy; {new Date().getFullYear()} MovoX. All rights reserved.
        </p>
      </aside>

      {/* Right: form */}
      <main className="flex items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <a href={siteUrl('/')} className="mb-8 block" aria-label="MovoX — Digital Growth, home">
            <img
              src="/images/brand/logo-dark.png"
              alt="MovoX — Beyond Digital"
              className="h-10 w-auto object-contain"
              width="220"
              height="57"
            />
          </a>

          <Reveal>
            <div className="text-center mb-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_8px_24px_rgba(35,130,184,0.35)]">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <h2 id="login-heading" className="mt-5 font-heading text-2xl font-bold text-ink">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-600">Sign in to access the MovoX admin dashboard</p>
            </div>

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-6 text-center"
                  role="status"
                >
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
                  <h3 className="mt-3 font-heading text-lg font-bold text-emerald-800">Welcome back!</h3>
                  <p className="mt-2 text-sm text-emerald-700">Redirecting to dashboard...</p>
                </motion.div>
              ) : status === 'error' ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6 text-center"
                  role="alert"
                >
                  <AlertCircle className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
                  <h3 className="mt-3 font-heading text-lg font-bold text-red-700">Sign in failed</h3>
                  <p className="mt-2 text-sm text-red-600">Invalid email or password. Please try again.</p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block font-heading text-sm font-semibold text-ink">
                  Email <span className="text-brand-600" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@heymovox.com"
                    aria-invalid={Boolean(inputError('email'))}
                    aria-describedby={inputError('email') ? 'email-error' : undefined}
                    className={fieldClass(inputError('email'))}
                    {...register('email')}
                  />
                  {inputError('email') && (
                    <p id="email-error" role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      {inputError('email')}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block font-heading text-sm font-semibold text-ink">
                    Password <span className="text-brand-600" aria-hidden="true">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={Boolean(inputError('password'))}
                    aria-describedby={inputError('password') ? 'password-error' : undefined}
                    className={`${fieldClass(inputError('password'))} pr-12`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  {inputError('password') && (
                    <p id="password-error" role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      {inputError('password')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    {...register('remember')}
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
              </div>

              {status === 'error' && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{errorMessage ?? 'Invalid email or password. Please try again.'}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="btn btn-primary btn-lg w-full"
              >
                <span className="btn-content flex items-center justify-center gap-2">
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" aria-hidden="true" />
                      Sign in
                    </>
                  )}
                </span>
              </button>
            </form>
          </Reveal>
        </div>
      </main>
    </div>
  );
}