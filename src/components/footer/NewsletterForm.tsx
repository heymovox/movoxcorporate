/**
 * Footer newsletter signup.
 *
 * Posts to /api/newsletter, which stores the subscriber in `enquiries` with
 * source='newsletter' so it shows up in the admin Enquiries screen.
 */
import { useState, type FormEvent } from 'react';
import { Check, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

type Status = 'idle' | 'loading' | 'done' | 'error';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  // Honeypot: hidden from users, tempting to bots.
  const [trap, setTrap] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'loading') return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), website: trap }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus('error');
        setMessage(data?.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setStatus('done');
      setMessage("You're on the list. We'll be in touch.");
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error. Please email info@heymovox.com.');
    }
  }

  if (status === 'done') {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/10 px-4 py-4"
        role="status"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-700">
          <Check className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="text-sm text-white">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-5">
      <label htmlFor="footer-newsletter-email" className="sr-only">
        Email address
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="footer-newsletter-email"
          type="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            if (status === 'error') {
              setStatus('idle');
              setMessage('');
            }
          }}
          placeholder="you@company.com"
          autoComplete="email"
          aria-invalid={status === 'error'}
          aria-describedby="footer-newsletter-msg"
          className={cn(
            'min-w-0 flex-1 rounded-xl border bg-white/10 px-4 py-3 text-sm text-white',
            'placeholder:text-brand-100/60 focus:outline-none focus:ring-2 focus:ring-white/70',
            status === 'error' ? 'border-red-300/80' : 'border-white/25 focus:border-white/60',
          )}
        />

        {/* honeypot */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="footer-newsletter-website">Website</label>
          <input
            id="footer-newsletter-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={trap}
            onChange={e => setTrap(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="btn-content flex items-center gap-2">
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Subscribing
              </>
            ) : (
              <>
                Subscribe
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </span>
        </button>
      </div>

      <p
        id="footer-newsletter-msg"
        role={status === 'error' ? 'alert' : undefined}
        className={cn(
          'mt-2 flex items-center gap-1.5 text-xs',
          status === 'error' ? 'text-red-200' : 'text-brand-100/70',
        )}
      >
        {status === 'error' && <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        {message || 'Design, build and growth insights. Roughly once a month.'}
      </p>
    </form>
  );
}