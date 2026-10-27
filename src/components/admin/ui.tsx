/**
 * Shared admin UI primitives.
 *
 * Every section composes these so the layout, spacing, and interaction
 * behaviour stay identical across Works, Blogs, Team, Users, Invoices,
 * Agreements, Policies, and Settings.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { api, ApiError } from '../../lib/adminApi';
import { cn } from '../../lib/utils';

/* ------------------------------------------------------------------ */
/* toasts                                                             */
/* ------------------------------------------------------------------ */

interface Toast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

const ToastContext = createContext<{
  success: (m: string) => void;
  error: (m: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, kind, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const value = {
    success: useCallback((m: string) => push('success', m), [push]),
    error: useCallback((m: string) => push('error', m), [push]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              role="status"
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg',
                t.kind === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800',
              )}
            >
              {t.kind === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              <p className="text-sm font-medium">{t.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* ------------------------------------------------------------------ */
/* page scaffolding                                                    */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <Inbox className="h-12 w-12 text-slate-300" aria-hidden="true" />
      <p className="mt-4 font-heading text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-slate-500">
      <div className="relative flex items-center justify-center">
        <img
          src="/images/brand/logo-dark.png"
          alt="MovoX"
          className="h-16 w-auto animate-pulse"
          width="220"
          height="57"
        />
      </div>
      <span className="text-sm font-heading">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-red-400" aria-hidden="true" />
      <p className="mt-3 text-sm text-red-700">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-secondary btn-sm mt-4">
          Try again
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* buttons                                                             */
/* ------------------------------------------------------------------ */

export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn('btn btn-primary', className)}>
      {children}
    </button>
  );
}

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <PrimaryButton onClick={onClick}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      {label}
    </PrimaryButton>
  );
}

export function IconButton({
  icon: Icon,
  onClick,
  label,
  tone = 'default',
  disabled,
}: {
  icon: typeof Pencil;
  onClick: () => void;
  label: string;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'rounded-xl p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'danger'
          ? 'text-slate-500 hover:bg-red-50 hover:text-red-600'
          : 'text-slate-500 hover:bg-slate-100 hover:text-brand-700',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* badges + search                                                     */
/* ------------------------------------------------------------------ */

export function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'purple';
}) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'purple'; label: string }> = {
    published: { tone: 'green', label: 'Published' },
    draft: { tone: 'slate', label: 'Draft' },
    archived: { tone: 'slate', label: 'Archived' },
    sent: { tone: 'blue', label: 'Sent' },
    paid: { tone: 'green', label: 'Paid' },
    overdue: { tone: 'red', label: 'Overdue' },
    cancelled: { tone: 'slate', label: 'Cancelled' },
    signed: { tone: 'green', label: 'Signed' },
    expired: { tone: 'amber', label: 'Expired' },
    terminated: { tone: 'red', label: 'Terminated' },
    active: { tone: 'green', label: 'Active' },
    inactive: { tone: 'slate', label: 'Inactive' },
    admin: { tone: 'purple', label: 'Admin' },
    editor: { tone: 'blue', label: 'Editor' },
    viewer: { tone: 'slate', label: 'Viewer' },
  };
  const entry = map[status] ?? { tone: 'slate' as const, label: status };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-ink placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:w-64"
      />
    </div>
  );
}

export function SelectFilter({
  value,
  onChange,
  options,
  label,
  allLabel = 'All',
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
  allLabel?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={label}
      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
    >
      <option value="">{allLabel}</option>
      {options.map(o => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* form fields                                                         */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block font-heading text-sm font-semibold text-ink"
      >
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, 'min-h-[110px] resize-y', props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, props.className)} />;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-slate-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
      <span className="text-sm text-slate-600">{label}</span>
    </label>
  );
}

/** Editor for a string[] column: one entry per line. */
export function ListInput({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <TextArea
      value={value.join('\n')}
      onChange={e => onChange(e.target.value.split('\n').filter(line => line.trim() !== ''))}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

/** Repeating group editor for {label,value} style rows (results, metrics). */
export function Repeater<T extends object>({
  items,
  onChange,
  createItem,
  render,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  createItem: () => T;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              {render(
                item,
                patch => {
                  const next = [...items];
                  next[i] = { ...items[i], ...patch };
                  onChange(next);
                },
                i,
              )}
            </div>
            <IconButton
              icon={Trash2}
              tone="danger"
              label="Remove row"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, createItem()])}
        className="btn btn-secondary btn-sm"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add row
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* modal                                                               */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className={cn(
              'relative z-10 my-8 w-full rounded-2xl bg-white shadow-2xl',
              wide ? 'max-w-3xl' : 'max-w-lg',
            )}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 hover:text-ink transition-colors"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="btn btn-primary btn-sm !bg-red-600 hover:!bg-red-700"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* resource list hook                                                 */
/* ------------------------------------------------------------------ */

interface ResourceState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
}

/**
 * Load a collection from the admin API with loading/error state and a
 * manual `reload` for after-mutation refreshes.
 */
export function useResource<T>(resource: string, params: Record<string, any> = {}): ResourceState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(params);

  const reload = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .list<T>(resource, JSON.parse(key))
      .then(res => {
        // Defensive: a shape mismatch must degrade to "no rows", never crash.
        if (!cancelled) setItems(Array.isArray(res.items) ? res.items : []);
      })
      .catch((err: ApiError) => {
        if (!cancelled) {
          setItems([]);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resource, key]);

  useEffect(() => reload(), [reload]);

  return { items, loading, error, reload, setItems };
}

/* ------------------------------------------------------------------ */
/* misc helpers                                                        */
/* ------------------------------------------------------------------ */

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatMoney(amount: string | number, currency = 'INR'): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Slugify a title for use as a unique route key. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}