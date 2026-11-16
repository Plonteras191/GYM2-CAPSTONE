import React from 'react';
import { FiTag, FiPlus, FiEdit2, FiTrash2, FiLoader } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import IconButton from '../../../components/ui/IconButton';
import ColorTile from '../../../components/ui/ColorTile';
import TableShell, { MobileCard } from '../../../components/ui/TableShell';
import { thClass, tdClass } from '../../../components/ui/field';
import { formatNumber } from '../../../utils/numberFormat';
import { getPackageCategoryLabel, getPackageColor } from '../packageCategories';
import { countRunningSubscriptions } from '../pricing';

const formatDuration = (days) => {
  const value = Number(days);
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value} ${value === 1 ? 'day' : 'days'}`;
};

function Members({ count }) {
  return count > 0
    ? <span className="font-medium text-ink">{count} {count === 1 ? 'member' : 'members'}</span>
    : <span className="text-muted">No one right now</span>;
}

/**
 * Every package with its price, in one list. Each package has visible Edit and
 * Delete buttons, and says how many members are on it, so staff know what a
 * change affects before they make it.
 */
export default function PriceListView({ plans, subscriptions, isLoading, deletingPlanId, onAdd, onEdit, onDelete }) {
  const rows = plans.map(plan => ({ plan, running: countRunningSubscriptions(plan, subscriptions) }));

  const actions = (plan, running) => (
    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
      <IconButton tone="warn" label={`Edit ${plan.name}`} icon={<FiEdit2 size={15} />} onClick={() => onEdit(plan)}>Edit</IconButton>
      <IconButton
        tone="danger"
        label={running > 0 ? `Delete ${plan.name} (${running} still subscribed)` : `Delete ${plan.name}`}
        icon={deletingPlanId === plan.id ? <FiLoader size={15} className="animate-spin" /> : <FiTrash2 size={15} />}
        onClick={() => onDelete(plan)}
        disabled={deletingPlanId === plan.id}
      >
        Delete
      </IconButton>
    </div>
  );

  const nameCell = (plan) => (
    <div className="flex min-w-0 items-center gap-3">
      <ColorTile color={getPackageColor(plan)} icon={FiTag} />
      <div className="min-w-0">
        <span className="block truncate text-[15px] font-medium text-ink">{plan.name}</span>
        <span className="mt-0.5 block truncate text-[13px] text-muted">{getPackageCategoryLabel(plan)}</span>
      </div>
    </div>
  );

  return (
    <TableShell
      index={2}
      title="Packages and prices"
      icon={FiTag}
      count={plans.length}
      action={<Button size="sm" icon={<FiPlus size={15} />} onClick={onAdd}>New package</Button>}
    >
      {isLoading && plans.length === 0 ? (
        <div className="px-6 py-14 text-center text-sm text-muted" role="status">Loading packages…</div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-hover text-muted"><FiTag size={20} aria-hidden="true" /></span>
          <div>
            <p className="text-[15px] font-medium text-ink">No packages yet</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">Create the packages you sell, such as Monthly or Annual, with their price and length.</p>
          </div>
          <Button size="sm" icon={<FiPlus size={14} />} onClick={onAdd}>New package</Button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden lg:block">
            <table className="w-full min-w-0 table-fixed border-collapse text-left align-middle">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[13%]" />
                <col className="w-[15%]" />
                <col className="w-[20%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line">
                  <th className={thClass}>Package</th>
                  <th className={thClass}>Lasts</th>
                  <th className={thClass}>Price</th>
                  <th className={thClass}>Subscribed now</th>
                  <th className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ plan, running }) => (
                  <tr key={plan.id} className="transition-colors duration-150 hover:bg-hover">
                    <td className={`${tdClass} overflow-hidden`}>{nameCell(plan)}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>{formatDuration(plan.duration_days)}</td>
                    <td className={`${tdClass} whitespace-nowrap font-display text-base font-semibold tabular-nums text-ink`}>₱{formatNumber(plan.price)}</td>
                    <td className={tdClass}><Members count={running} /></td>
                    <td className={`${tdClass} whitespace-nowrap text-right`}>{actions(plan, running)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-3 lg:hidden">
            {rows.map(({ plan, running }, index) => (
              <MobileCard key={plan.id} index={index}>
                {nameCell(plan)}
                <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3 text-sm">
                  <div><dt className="text-[13px] text-muted">Lasts</dt><dd className="text-ink-2">{formatDuration(plan.duration_days)}</dd></div>
                  <div><dt className="text-[13px] text-muted">Price</dt><dd className="font-semibold tabular-nums text-ink">₱{formatNumber(plan.price)}</dd></div>
                  <div><dt className="text-[13px] text-muted">Subscribed now</dt><dd><Members count={running} /></dd></div>
                </dl>
                <div className="mt-3 flex justify-end border-t border-line pt-3">{actions(plan, running)}</div>
              </MobileCard>
            ))}
          </div>
        </>
      )}
    </TableShell>
  );
}
