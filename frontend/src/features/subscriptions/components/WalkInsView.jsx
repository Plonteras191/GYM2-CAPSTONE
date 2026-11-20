import React, { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiList, FiUser, FiSearch, FiX } from 'react-icons/fi';
import Pagination from '../../../components/ui/Pagination';
import SearchInput from '../../../components/ui/SearchInput';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import TableShell, { Toolbar, TableLoading, CardListLoading, MobileCard } from '../../../components/ui/TableShell';
import { StatStrip, StatCell } from '../../../components/ui/StatStrip';
import { thClass, tdClass } from '../../../components/ui/field';
import { getMediaUrl } from '../../../utils/mediaUrl';
import { getPaymentMethodLabel } from '../../../utils/paymentMethod';
import { getPackageDetails } from '../../../utils/packageDisplay';
import { formatNumber } from '../../../utils/numberFormat';
import { getLocalDateString } from '../../../utils/dateFormat';

const peso = (v) => `₱ ${formatNumber(v, Number.isInteger(Number(v)) ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2 })}`;

/** Completed walk-in sales (one-time visits). */
const isWalkInTransaction = (txn) => txn.status === 'Complete'
  && ['Walk-In', 'Walk-in Guest'].includes(txn.type);

const guestName = (txn) => (txn.member
  ? `${txn.member.first_name} ${txn.member.last_name}`
  : txn.member_name_snapshot || '');

const dayOf = (value) => String(value || '').slice(0, 10);

const formatDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const date = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function NoResults({ searchTerm, onClear, onAdd }) {
  const filtered = searchTerm.trim() !== '';
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-hover text-muted">
        {filtered ? <FiSearch size={20} aria-hidden="true" /> : <FiUser size={20} aria-hidden="true" />}
      </span>
      <div>
        <p className="text-[15px] font-medium text-ink">
          {filtered ? `No walk-ins match “${searchTerm.trim()}”` : 'No walk-ins yet'}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">
          {filtered ? 'Search by transaction ID, name or package, or clear the search.' : 'Walk-in visits you record will be listed here.'}
        </p>
      </div>
      {filtered
        ? <Button size="sm" variant="outline" icon={<FiX size={14} />} onClick={onClear}>Clear search</Button>
        : <Button size="sm" icon={<FiPlus size={14} />} onClick={onAdd}>Record a walk-in</Button>}
    </div>
  );
}

export default function WalkInsView({ transactions, isLoading, onAdd }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const walkIns = useMemo(() => transactions.filter(isWalkInTransaction), [transactions]);
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return walkIns;
    return walkIns.filter(txn => [
      txn.transaction_id,
      guestName(txn) || 'walk-in guest',
      getPackageDetails(txn).title,
    ].some(value => String(value || '').toLowerCase().includes(term)));
  }, [walkIns, searchTerm]);

  const todayStr = getLocalDateString();
  const today = walkIns.filter(txn => dayOf(txn.transaction_date) === todayStr);
  const sum = (list) => list.reduce((total, txn) => total + Number(txn.amount || 0), 0);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  useEffect(() => {
    setCurrentPage(page => Math.max(1, Math.min(page, totalPages || 1)));
  }, [totalPages]);
  const pageRows = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const clear = () => setSearchTerm('');

  return (
    <div className="space-y-5 lg:space-y-6">
      <StatStrip index={1} columns="lg:grid-cols-3">
        <StatCell label="Walk-ins today" hint="Visits paid for today" tone="orange" isLoading={isLoading} value={today.length} />
        <StatCell label="Walk-in income today" hint="Collected today" tone="gold" isLoading={isLoading} value={sum(today)} format={peso} />
        <StatCell label="Walk-ins, all time" hint="Completed walk-in payments" tone="slate" isLoading={isLoading} value={walkIns.length} className="min-[360px]:col-span-2 lg:col-span-1" />
      </StatStrip>

      <Toolbar index={2} className="lg:flex-row lg:items-center">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={clear}
          placeholder="Search ID, name or package"
          containerClassName="relative w-full min-w-0 lg:flex-1"
        />
        <Button onClick={onAdd} icon={<FiPlus size={18} strokeWidth={2.5} />} className="w-full shrink-0 whitespace-nowrap lg:w-auto">
          Record a walk-in
        </Button>
      </Toolbar>

      <TableShell index={3} title="Walk-ins" icon={FiList} count={filtered.length}>
        <div className="hidden overflow-hidden xl:block">
          <table className="w-full min-w-0 table-fixed border-collapse text-left align-middle">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[26%]" />
              <col className="w-[24%]" />
              <col className="w-[14%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-line">
                <th className={`${thClass} whitespace-nowrap`}>Txn ID & Date</th>
                <th className={thClass}>Guest</th>
                <th className={thClass}>Package</th>
                <th className={thClass}>Method</th>
                <th className={`${thClass} text-right`}>Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <TableLoading colSpan={5} />
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={5}><NoResults searchTerm={searchTerm} onClear={clear} onAdd={onAdd} /></td></tr>
              ) : pageRows.map((txn, i) => {
                const name = guestName(txn);
                const pic = txn.member?.profile_pic || txn.member_profile_pic_snapshot;
                return (
                  <tr key={txn.id} className="rise transition-colors hover:bg-hover" style={{ '--i': Math.min(i, 8) * 0.5 + 3 }}>
                    <td className={`${tdClass} overflow-hidden whitespace-nowrap`}>
                      <div className="truncate font-mono text-[13px] text-ink">{txn.transaction_id}</div>
                      <div className="mt-0.5 truncate text-[13px] text-muted">{formatDate(txn.transaction_date)}</div>
                    </td>
                    <td className={`${tdClass} overflow-hidden`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar src={pic ? getMediaUrl(pic) : null} name={name} fallback={<FiUser size={15} />} />
                        <span className={`truncate font-medium ${name ? 'text-ink' : 'italic text-warn'}`}>{name || 'Walk-in Guest'}</span>
                      </div>
                    </td>
                    <td className={`${tdClass} overflow-hidden whitespace-nowrap`}>
                      <div className="truncate font-medium text-ink">{getPackageDetails(txn).title}</div>
                      <div className="mt-0.5 truncate text-[13px] text-muted">{getPackageDetails(txn).category}</div>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}><Badge variant="default">{getPaymentMethodLabel(txn.payment_method)}</Badge></td>
                    <td className={`${tdClass} whitespace-nowrap text-right font-display text-lg font-medium tabular-nums text-ink`}>{`₱ ${formatNumber(Number(txn.amount))}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 xl:hidden">
          {isLoading ? (
            <CardListLoading />
          ) : pageRows.length === 0 ? (
            <NoResults searchTerm={searchTerm} onClear={clear} onAdd={onAdd} />
          ) : pageRows.map((txn, i) => {
            const name = guestName(txn);
            const pic = txn.member?.profile_pic || txn.member_profile_pic_snapshot;
            return (
              <MobileCard key={txn.id} index={i}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={pic ? getMediaUrl(pic) : null} name={name} fallback={<FiUser size={16} />} />
                    <p className={`truncate font-medium ${name ? 'text-ink' : 'italic text-warn'}`}>{name || 'Walk-in Guest'}</p>
                  </div>
                  <span className="shrink-0 font-display text-lg font-medium tabular-nums text-ink">{`₱ ${formatNumber(Number(txn.amount))}`}</span>
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <p className="text-sm font-medium text-ink">{getPackageDetails(txn).title}</p>
                  <p className="mt-0.5 text-[13px] text-muted">{getPackageDetails(txn).category}</p>
                  <p className="mt-2 text-[13px] text-muted"><span className="font-mono text-ink-2">{txn.transaction_id}</span> · {formatDate(txn.transaction_date)}</p>
                  <div className="mt-2"><Badge variant="default">{getPaymentMethodLabel(txn.payment_method)}</Badge></div>
                </div>
              </MobileCard>
            );
          })}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          itemsLabel="walk-ins"
        />
      </TableShell>
    </div>
  );
}
