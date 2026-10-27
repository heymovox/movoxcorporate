import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { api, type Setting } from '../../lib/adminApi';
import {
  PageHeader,
  Card,
  Spinner,
  ErrorState,
  TextInput,
  Toggle,
  IconButton,
  useToast,
  useResource,
  formatDate,
} from '../../components/admin/ui';

export default function AdminSettings() {
  const toast = useToast();
  const { items, loading, error, reload } = useResource<Setting>('settings');

  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const next: Record<string, unknown> = {};
    for (const s of items) next[s.key] = s.value;
    setDraft(next);
    setDirty(new Set());
  }, [items]);

  const setValue = (key: string, value: unknown) => {
    setDraft(d => ({ ...d, [key]: value }));
    setDirty(s => new Set(s).add(key));
  };

  const save = async (key: string) => {
    setSavingKey(key);
    try {
      await api.putSetting(key, draft[key]);
      toast.success('Setting saved.');
      setDirty(s => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSavingKey(null);
    }
  };

  const remove = async (key: string) => {
    try {
      await api.deleteSetting(key);
      toast.success('Setting removed.');
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed.');
    }
  };

  const add = async () => {
    const key = newKey.trim();
    if (!key) return toast.error('Key is required.');
    setAdding(true);
    try {
      await api.putSetting(key, newValue);
      toast.success('Setting added.');
      setNewKey('');
      setNewValue('');
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add setting.');
    } finally {
      setAdding(false);
    }
  };

  const groups = [...new Set(items.map(s => s.group_name))];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Site-wide configuration stored in the database."
      />

      {loading ? (
        <Card>
          <Spinner />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <Card key={group} className="p-6">
              <h2 className="mb-4 font-heading text-lg font-bold text-ink">{group}</h2>
              <div className="space-y-4">
                {items
                  .filter(s => s.group_name === group)
                  .map(s => {
                    const isDirty = dirty.has(s.key);
                    return (
                      <div
                        key={s.key}
                        className="flex flex-col gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-end sm:justify-between"
                      >
                        <div className="flex-1">
                          <label className="mb-1.5 block font-heading text-sm font-semibold text-ink">
                            {s.label || s.key}
                          </label>
                          {s.type === 'boolean' ? (
                            <Toggle
                              checked={Boolean(draft[s.key])}
                              onChange={v => setValue(s.key, v)}
                              label={Boolean(draft[s.key]) ? 'Enabled' : 'Disabled'}
                            />
                          ) : (
                            <TextInput
                              type={s.type === 'number' ? 'number' : 'text'}
                              value={
                                draft[s.key] === null || draft[s.key] === undefined
                                  ? ''
                                  : String(draft[s.key])
                              }
                              onChange={e =>
                                setValue(
                                  s.key,
                                  s.type === 'number' ? Number(e.target.value) : e.target.value,
                                )
                              }
                            />
                          )}
                          <p className="mt-1 text-xs text-slate-400">
                            {s.key} · updated {formatDate(s.updated_at)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => save(s.key)}
                            disabled={!isDirty || savingKey === s.key}
                            className="btn btn-primary btn-sm"
                          >
                            {savingKey === s.key ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <Save className="h-4 w-4" aria-hidden="true" />
                            )}
                            Save
                          </button>
                          <IconButton
                            icon={Trash2}
                            tone="danger"
                            label={`Delete ${s.key}`}
                            onClick={() => remove(s.key)}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          ))}

          <Card className="p-6">
            <h2 className="mb-1 font-heading text-lg font-bold text-ink">Add setting</h2>
            <p className="mb-4 text-sm text-slate-500">
              New keys are added to the General group. Use dot notation like
              <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs">seo.meta_title</code>
              for namespacing.
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <TextInput
                placeholder="Key (e.g. seo.meta_title)"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
              />
              <TextInput
                placeholder="Value"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
              />
              <button type="button" onClick={add} disabled={adding} className="btn btn-primary btn-sm">
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden="true" />
                )}
                Add
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}