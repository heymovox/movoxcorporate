/**
 * Responsive data list for admin sections.
 *
 * Desktop renders a real <table>. Below `sm` the same rows render as stacked
 * cards, which keeps long tables readable on a phone instead of forcing a
 * sideways scroll. One implementation so behaviour cannot drift between the
 * ten sections that list records.
 */
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type Column<T> = {
  /** Column heading on desktop. Empty string for an actions column. */
  header: string;
  cell: (row: T) => ReactNode;
  /**
   * On mobile this cell becomes the card's main line. Only one column
   * should set it.
   */
  primary?: boolean;
  /** On mobile this cell renders as a chip beneath the title. */
  chip?: boolean;
  /** Hide this column on smaller desktop widths. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'right';
};

const HIDE: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
};

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  cardClassName,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  cardClassName?: string;
}) {
  const primary = columns.find(c => c.primary);
  const chips = columns.filter(c => c.chip);
  const details = columns.filter(c => !c.primary && !c.chip);
  const actions = columns.filter(c => c.align === 'right');

  return (
    <>
      {/* ---------------- desktop table ---------------- */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col, i) => (
                <th
                  key={`${col.header}-${i}`}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500',
                    col.align === 'right' ? 'text-right' : 'text-left',
                    col.hideBelow && HIDE[col.hideBelow],
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(row => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors hover:bg-slate-50/50',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((col, i) => (
                  <td
                    key={`${col.header}-${i}`}
                    className={cn(
                      'px-4 py-4',
                      col.align === 'right' ? 'text-right' : 'text-left',
                      col.hideBelow && HIDE[col.hideBelow],
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------------- mobile cards ---------------- */}
      <ul className="space-y-3 sm:hidden">
        {rows.map(row => (
          <li
            key={rowKey(row)}
            className={cn(
              'rounded-2xl border border-slate-200 bg-white p-4 shadow-card',
              onRowClick && 'cursor-pointer active:bg-slate-50',
              cardClassName,
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {primary && (
                  <div className="text-sm font-semibold text-ink">{primary.cell(row)}</div>
                )}
              </div>

              {/* actions stay top-right, out of the card's way */}
              {actions.length > 0 && (
                <div
                  className="flex shrink-0 items-center gap-1"
                  onClick={e => e.stopPropagation()}
                >
                  {actions.map((col, i) => (
                    <div key={`action-${i}`}>{col.cell(row)}</div>
                  ))}
                </div>
              )}
            </div>

            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {chips.map((col, i) => (
                  <div key={`chip-${i}`}>{col.cell(row)}</div>
                ))}
              </div>
            )}

            {details.length > 0 && (
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
                {details.map((col, i) => (
                  <div key={`detail-${i}`} className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {col.header}
                    </dt>
                    <dd className="mt-0.5 truncate text-sm text-slate-600">{col.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}