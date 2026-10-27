import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { siteUrl, adminUrl } from '../../lib/host';
import { Logo } from '../../components/Header';
import { LETTERHEAD } from '../../components/admin/Letterhead';

export default function PortalLogin() {
  const { login, user, role } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Staff landing here are sent to the admin; clients go to the portal.
  if (user) {
    return <Navigate to={role === 'client' ? '/portal' : '/admin'} replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? ''}/api/admin/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          // Surface an error instead of a forever-pending Sign in spinner.
          signal: AbortSignal.timeout(15_000),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token) {
        setStatus('error');
        setMessage(data?.error ?? 'Sign in failed.');
        return;
      }
      // The API decides where they belong; the guard below sorts it out.
      login(data.token, data.user);
    } catch {
      setStatus('error');
      setMessage('Could not reach the server. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* left: brand panel */}
      <aside className="relative hidden overflow-hidden bg-brand-900 lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-brand-gradient opacity-90" aria-hidden="true" />
        <div
          className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10">
          <img
            src="/images/brand/logo-white.png"
            alt="MovoX — Beyond Digital"
            className="h-10 w-auto object-contain"
          />
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-heading text-4xl font-extrabold leading-tight text-white">
            Track your project,
            <br />
            <span className="text-brand-200">every step of the way.</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-brand-100">
            See live progress, send messages to your team, and request files —
            all in one place.
          </p>
          <ul className="mt-10 space-y-4">
            {[
              'Live project status and progress',
              'Direct messages to your MovoX team',
              'Download finalised files',
              'Urgent requests flagged immediately',
            ].map(item => (
              <li key={item} className="flex items-start gap-3 text-brand-50">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" aria-hidden="true" />
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 text-[11px] leading-relaxed text-brand-200/80">
          {LETTERHEAD.address.join(', ')}
          <br />
          {LETTERHEAD.phone} · {LETTERHEAD.email}
        </div>
      </aside>

      {/* right: form */}
      <main className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <a href={siteUrl('/')} className="mb-8 block lg:hidden" aria-label="MovoX home">
            <Logo />
          </a>

          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_8px_24px_rgba(35,130,184,0.35)]">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-heading text-2xl font-bold text-ink">Client portal</h2>
            <p className="mt-2 text-sm text-slate-600">
              Sign in with the credentials MovoX sent you
            </p>
          </div>

          {status === 'error' && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
              <p className="text-sm text-red-700">{message}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="portal-email"
                className="mb-1.5 block font-heading text-sm font-semibold text-ink"
              >
                Email
              </label>
              <input
                id="portal-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="portal-password"
                className="mb-1.5 block font-heading text-sm font-semibold text-ink"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="portal-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600"
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="btn btn-primary btn-lg w-full"
            >
              <span className="btn-content flex items-center justify-center gap-2">
                {status === 'submitting' && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                Sign in
              </span>
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            MovoX staff?{' '}
            <a
              href={adminUrl('/login')}
              className="font-semibold text-brand-700 hover:underline"
            >
              Use the admin sign-in
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}