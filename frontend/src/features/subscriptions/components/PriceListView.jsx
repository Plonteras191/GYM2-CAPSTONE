import React from 'react';
import { FiTag, FiPlus, FiEdit2, FiTrash2, FiLoader } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import IconButton from '../../../components/ui/IconButton';
import ColorTile from '../../../components/ui/ColorTile';
import SegmentedFilter from '../../../components/ui/SegmentedFilter';
import TableShell, { MobileCard } from '../../../components/ui/TableShell';
import { StatStrip, StatCell } from '../../../components/ui/StatStrip';
import { thClass, tdClass } from '../../../components/ui/field';
import { formatNumber } from '../../../utils/numberFormat';
import { getLocalDateString } from '../../../utils/dateFormat';
import { getPackageCategoryLabel, getPackageColor } from '../packageCategories';
import { countRunningSubscriptions } from '../pricing';

/** Walk-in packages are one-time visits: they are sold, not subscribed to. */
const isWalkInPackage = (plan) => plan.category === 'walk_in' || /walk|daily/i.test(plan.name || '');

/** Groups, in the order a customer usually asks about them. */
const GROUPS = [
  { id: 'normal', label: 'Monthly', match: plan => !isWalkInPackage(plan) && plan.category !== 'with_coach' },
  { id: 'with_coach', label: 'With coach', match: plan => !isWalkInPackage(plan) && plan.category === 'with_coach' },
  { id: 'walk_in', label: 'Walk-ins', match: isWalkInPackage },
];

/** "1 month", "1 year", "2 weeks" … with the exact number of days kept underneath. */
const formatDuration = (days) => {
  const value = Number(days);
  if (!Number.isFinite(value) || value <= 0) return { main: '—', exact: '' };
  const named = (count, unit) => `${count} ${unit}${count === 1 ? '' : 's'}`;
  let main = named(value, 'day');
  if (value % 365 === 0) main = named(value / 365, 'year');
  else if (value % 30 === 0) main = named(value / 30, 'month');
  else if (value % 7 === 0) main = named(value / 7, 'week');
  return { main, exact: main === named(value, 'day') ? '' : named(value, 'day') };
};

const isWalkInSale = (txn) => txn.status === 'Complete' && ['Walk-In', 'Walk-in Guest'].includes(txn.type);

function Usage({ plan, running, soldToday }) {
  if (isWalkInPackage(plan)) {
    return soldToday > 0
      ? <span className="font-medium text-ink">{soldToday} sold today</span>
      : <span className="text-muted">None sold today</span>;
  }
  return running > 0
    ? <span className="font-medium text-ink">{running} {running === 1 ? 'member' : 'members'}</span>
    : <span className="text-muted">No one right now</span>;
}

/**
 * Every package with its price, grouped by kind. Each package says how many
 * members are on it (or, for walk-ins, how many were sold today), so staff know
 * what a change affects before they make it.
 */
export default function PriceListView({ plans, subscriptions, transactions = [], isLoading, deletingPlanId, onAdd, onEdit, onDelete }) {
  const [group, setGroup] = React.useState('all');
  const todayStr = getLocalDateString();

  const soldTodayByName = React.useMemo(() => {
    const counts = new Map();
    transactions
      .filter(txn => isWalkInSale(txn) && String(txn.transaction_date || '').slice(0, 10) === todayStr)
      .forEach(txn => {
        const name = String(txn.package_name_snapshot || '').trim().toLowerCase();
        if (name) counts.set(name, (counts.get(name) || 0) + 1);
      });
    return counts;
  }, [transactions, todayStr]);

  const rows = plans.map(plan => ({
    plan,
    running: countRunningSubscriptions(plan, subscriptions),
    soldToday: soldTodayByName.get(String(plan.name || '').trim().toLowerCase()) || 0,
  }));
  const sections = GROUPS
    .map(section => ({
      ...section,
      rows: rows
        .filter(row => section.match(row.plan))
        .sort((a, b) => Number(a.plan.price) - Number(b.plan.price) || String(a.plan.name).localeCompare(String(b.plan.name))),
    }))
    .filter(section => section.rows.length > 0);
  const shownSections = group === 'all' ? sections : sections.filter(section => section.id === group);
  const shownCount = shownSections.reduce((total, section) => total + section.rows.length, 0);

  /* ── Summary ── */
  const membersOnPackages = rows.reduce((total, row) => total + (isWalkInPackage(row.plan) ? 0 : row.running), 0);
  const walkInsSoldToday = transactions.filter(txn => isWalkInSale(txn) && String(txn.transaction_date || '').slice(0, 10) === todayStr).length;
  const mostPopular = rows
    .filter(row => !isWalkInPackage(row.plan) && row.running > 0)
    .sort((a, b) => b.running - a.running)[0];

  const actions = (plan, running, withLabels = false) => (
    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
      <IconButton tone="warn" label={`Edit ${plan.name}`} icon={<FiEdit2 size={15} />} onClick={() => onEdit(plan)}>{withLabels && 'Edit'}</IconButton>
      <IconButton
        tone="danger"
        label={running > 0 ? `Delete ${plan.name} (${running} still subscribed)` : `Delete ${plan.name}`}
        icon={deletingPlanId === plan.id ? <FiLoader size={15} className="animate-spin" /> : <FiTrash2 size={15} />}
        onClick={() => onDelete(plan)}
        disabled={deletingPlanId === plan.id}
      >
        {withLabels && 'Delete'}
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

  const durationCell = (plan) => {
    const { main, exact } = formatDuration(plan.duration_days);
    return (
      <>
        <span className="block text-ink-2">{main}</span>
        {exact && <span className="mt-0.5 block text-[13px] text-muted">{exact}</span>}
      </>
    );
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <StatStrip index={1}>
        <StatCell label="Packages" hint="Offered right now" tone="slate" isLoading={isLoading && plans.length === 0} value={plans.length} />
        {/* A package name, not a number: shown smaller so it fits like the other cards. */}
        <StatCell
          label="Most popular"
          hint={mostPopular ? `${mostPopular.running} ${mostPopular.running === 1 ? 'member' : 'members'} on it now` : 'No running subscriptions yet'}
          tone="gold"
          isLoading={isLoading && plans.length === 0}
          value={mostPopular ? mostPopular.plan.name : '—'}
          compact
        />
        <StatCell label="Members on a package" hint="Running subscriptions" tone="orange" isLoading={isLoading && plans.length === 0} value={membersOnPackages} />
        <StatCell label="Walk-ins sold today" hint="One-time visits paid today" tone="red" isLoading={isLoading && plans.length === 0} value={walkInsSoldToday} />
      </StatStrip>

      <TableShell
        index={2}
        title="Packages and prices"
        icon={FiTag}
        count={shownCount}
        action={<Button size="sm" icon={<FiPlus size={15} />} onClick={onAdd}>New package</Button>}
      >
        {sections.length > 1 && (
          <div className="border-b border-line px-4 py-3 sm:px-5">
            <SegmentedFilter
              label="Show packages of one kind"
              value={group}
              onChange={setGroup}
              className="w-full overflow-x-auto sm:w-auto"
              options={[
                { value: 'all', label: 'All', count: rows.length },
                ...sections.map(section => ({ value: section.id, label: section.label, count: section.rows.length })),
              ]}
            />
          </div>
        )}

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
                  <col className="w-[38%]" />
                  <col className="w-[16%]" />
                  <col className="w-[15%]" />
                  <col className="w-[19%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-line">
                    <th className={thClass}>Package</th>
                    <th className={thClass}>Lasts</th>
                    <th className={thClass}>Price</th>
                    <th className={thClass}>In use</th>
                    <th className={`${thClass} text-right`}>Actions</th>
                  </tr>
                </thead>
                {shownSections.map(section => (
                  <tbody key={section.id} className="divide-y divide-line border-b border-line last:border-b-0">
                    <tr className="bg-field">
                      <th colSpan={5} scope="colgroup" className="px-4 py-2 text-left text-[13px] font-semibold text-ink-2">
                        {section.label} <span className="font-normal text-muted">· {section.rows.length}</span>
                      </th>
                    </tr>
                    {section.rows.map(({ plan, running, soldToday }) => (
                      <tr key={plan.id} className="transition-colors duration-150 hover:bg-hover">
                        <td className={`${tdClass} overflow-hidden`}>{nameCell(plan)}</td>
                        <td className={`${tdClass} whitespace-nowrap`}>{durationCell(plan)}</td>
                        <td className={`${tdClass} whitespace-nowrap font-display text-base font-semibold tabular-nums text-ink`}>₱{formatNumber(plan.price)}</td>
                        <td className={tdClass}><Usage plan={plan} running={running} soldToday={soldToday} /></td>
                        <td className={`${tdClass} whitespace-nowrap text-right`}>{actions(plan, running)}</td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>

            <div className="space-y-4 p-3 lg:hidden">
              {shownSections.map(section => (
                <section key={section.id} aria-label={section.label} className="space-y-3">
                  <h4 className="px-1 text-[13px] font-semibold text-ink-2">
                    {section.label} <span className="font-normal text-muted">· {section.rows.length}</span>
                  </h4>
                  {section.rows.map(({ plan, running, soldToday }, index) => (
                    <MobileCard key={plan.id} index={index}>
                      {nameCell(plan)}
                      <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3 text-sm">
                        <div><dt className="text-[13px] text-muted">Lasts</dt><dd>{durationCell(plan)}</dd></div>
                        <div><dt className="text-[13px] text-muted">Price</dt><dd className="font-semibold tabular-nums text-ink">₱{formatNumber(plan.price)}</dd></div>
                        <div><dt className="text-[13px] text-muted">In use</dt><dd><Usage plan={plan} running={running} soldToday={soldToday} /></dd></div>
                      </dl>
                      <div className="mt-3 flex justify-end border-t border-line pt-3">{actions(plan, running, true)}</div>
                    </MobileCard>
                  ))}
                </section>
              ))}
            </div>
          </>
        )}
      </TableShell>
    </div>
  );
}
