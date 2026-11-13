import React, { useState, useEffect } from 'react';
import { FiPlus, FiDownload, FiRotateCcw, FiList, FiPrinter, FiUser, FiLoader, FiCreditCard } from 'react-icons/fi';
import Pagination from '../../../components/ui/Pagination';
import { getMediaUrl } from '../../../utils/mediaUrl';
import { getPaymentMethodLabel } from '../../../utils/paymentMethod';
import { useNavigate } from 'react-router-dom';
import { getPackageDetails } from '../../../utils/packageDisplay';
import { formatNumber } from '../../../utils/numberFormat';
import StyledSelect from '../../../components/ui/StyledSelect';
import SearchInput from '../../../components/ui/SearchInput';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import IconButton from '../../../components/ui/IconButton';
import TableShell, { Toolbar, TableLoading, TableEmpty, CardListLoading, CardListEmpty, MobileCard } from '../../../components/ui/TableShell';
import { fieldClass, thClass, tdClass } from '../../../components/ui/field';

const statusVariant = (status) => {
  switch (status) {
    case 'Complete': return 'success';
    case 'Pending': return 'warning';
    case 'Refunded':
    case 'Failed': return 'danger';
    default: return 'default';
  }
};

const methodVariant = (method) => {
  const key = (method || '').toLowerCase();
  if (key === 'gcash') return 'info';
  if (key === 'cash') return 'success';
  return 'default';
};

const amountText = (txn) => (Number(txn.amount) > 0
  ? `₱ ${formatNumber(Number(txn.amount))}`
  : `-₱ ${formatNumber(Math.abs(Number(txn.amount)))}`);
const isNegative = (txn) => txn.status === 'Refunded' || Number(txn.amount) < 0;

function MemberDetails({ member, snapshot, profilePicSnapshot, emailSnapshot }) {
  const navigate = useNavigate();
  const memberName = member ? `${member.first_name} ${member.last_name}` : snapshot;
  const profilePic = member?.profile_pic || profilePicSnapshot;
  const linked = Boolean(member?.id);
  const content = (
    <>
      <Avatar src={profilePic ? getMediaUrl(profilePic) : null} name={memberName} fallback={<FiUser size={15} />} />
      <div className="min-w-0">
        <span className={`block truncate font-semibold ${memberName ? `text-ink${linked ? ' link-draw' : ''}` : 'italic text-warn'}`}>
          {memberName || 'Walk-in Guest'}
        </span>
        {(member?.email || emailSnapshot) && <span className="mt-0.5 block truncate text-xs text-muted">{member?.email || emailSnapshot}</span>}
      </div>
    </>
  );
  return linked
    ? <button type="button" onClick={() => navigate('/members', { state: { memberId: member.id } })} className="flex min-w-0 items-center gap-3 rounded-lg text-left">{content}</button>
    : <div className="flex min-w-0 items-center gap-3">{content}</div>;
}

export default function TransactionTable({
  transactions,
  isLoading,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  isExporting,
  refundingId,
  onAddTransaction,
  onRefundTransaction,
  onExportCSV,
  onPrintReceipt
}) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTxns = transactions.slice(indexOfFirstItem, indexOfLastItem);
  useEffect(() => {
    setCurrentPage(page => Math.max(1, Math.min(page, totalPages || 1)));
  }, [totalPages]);

  const rowActions = (txn, withLabels = false) => (
    <div className="inline-flex items-center gap-1.5">
      {txn.status === 'Complete' && txn.type !== 'Refund' && (
        <IconButton
          tone="danger"
          label="Refund transaction"
          icon={refundingId === txn.id ? <FiLoader size={15} className="animate-spin" /> : <FiRotateCcw size={15} />}
          onClick={() => onRefundTransaction(txn)}
          disabled={refundingId === txn.id}
        >
          {refundingId === txn.id ? 'Refunding…' : 'Refund'}
        </IconButton>
      )}
      <IconButton label="Print receipt" icon={<FiPrinter size={15} />} onClick={() => onPrintReceipt(txn)}>{withLabels && 'Receipt'}</IconButton>
    </div>
  );

  return (
    <div className="space-y-5 lg:space-y-6">
      <Toolbar index={1} className="lg:flex-row lg:items-center">
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center lg:flex-1">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            placeholder="Search by ID or member name"
            containerClassName="relative min-w-0 flex-1 sm:min-w-[15rem]"
          />
          <div className="min-w-0 sm:w-48">
            <StyledSelect
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filter transactions"
              className={fieldClass}
            >
              <option value="All">All Transactions</option>
              <option value="Subscription">Subscriptions</option>
              <option value="Walk-In">Walk-Ins</option>
              <option value="Refund">Refunds</option>
            </StyledSelect>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 lg:w-auto lg:flex">
          <Button onClick={onAddTransaction} icon={<FiPlus size={18} strokeWidth={2.5} />} className="min-w-0 whitespace-nowrap px-3">
            <span className="md:hidden">Record</span>
            <span className="hidden md:inline">Record Transaction</span>
          </Button>
          <Button variant="outline" onClick={onExportCSV} disabled={isExporting} isLoading={isExporting} icon={<FiDownload size={17} />} className="min-w-0 whitespace-nowrap px-3" title="Download filtered transactions as a spreadsheet">
            {isExporting ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Button variant="outline" onClick={() => window.print()} icon={<FiPrinter size={17} />} className="min-w-0 whitespace-nowrap px-3">Print All</Button>
        </div>
      </Toolbar>

      <TableShell index={2} title="Total Transactions" icon={FiList} count={transactions.length}>
        <div className="hidden overflow-hidden xl:block">
          <table className="w-full min-w-0 table-fixed border-collapse text-left align-middle">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[21%]" />
              <col className="w-[20%]" />
              <col className="w-[9%]" />
              <col className="w-[12%]" />
              <col className="w-[11%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-line">
                <th className={`${thClass} whitespace-nowrap`}>Txn ID & Date</th>
                <th className={thClass}>Member Details</th>
                <th className={thClass}>Details</th>
                <th className={thClass}>Method</th>
                <th className={`${thClass} text-right`}>Amount</th>
                <th className={`${thClass} text-center`}>Payment Status</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <TableLoading colSpan={7} />
              ) : currentTxns.length === 0 ? (
                <TableEmpty colSpan={7} icon={FiCreditCard}>No transactions found.</TableEmpty>
              ) : (
                currentTxns.map((txn, i) => (
                  <tr key={txn.id} className="rise transition-colors hover:bg-hover" style={{ '--i': Math.min(i, 8) * 0.5 + 2 }}>
                    <td className={`${tdClass} overflow-hidden whitespace-nowrap`}>
                      <div className="truncate font-semibold text-ink">{txn.transaction_id}</div>
                      <div className="mt-0.5 truncate text-xs text-muted">{txn.transaction_date}</div>
                    </td>
                    <td className={`${tdClass} overflow-hidden whitespace-nowrap`}>
                      <MemberDetails
                        member={txn.member}
                        snapshot={txn.member_name_snapshot}
                        profilePicSnapshot={txn.member_profile_pic_snapshot}
                        emailSnapshot={txn.member_email_snapshot}
                      />
                    </td>
                    <td className={`${tdClass} overflow-hidden whitespace-nowrap`}>
                      <div className="truncate font-semibold text-ink">{getPackageDetails(txn).title}</div>
                      <div className="mt-0.5 truncate text-xs text-muted">{getPackageDetails(txn).category}</div>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <Badge variant={methodVariant(txn.payment_method)}>{getPaymentMethodLabel(txn.payment_method)}</Badge>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-right font-display text-lg font-semibold tabular-nums ${isNegative(txn) ? 'text-negative' : 'text-ink'}`}>
                      {amountText(txn)}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-center`}>
                      <Badge variant={statusVariant(txn.status)}>{txn.status}</Badge>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-right`}>{rowActions(txn)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 xl:hidden">
          {isLoading ? (
            <CardListLoading />
          ) : currentTxns.length === 0 ? (
            <CardListEmpty>No transactions found.</CardListEmpty>
          ) : currentTxns.map((txn, i) => {
            const memberName = txn.member_name_snapshot || (txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : '');
            const profilePic = txn.member?.profile_pic || txn.member_profile_pic_snapshot;
            return (
              <MobileCard key={txn.id} index={i}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={profilePic ? getMediaUrl(profilePic) : null} name={memberName} fallback={<FiUser size={16} />} />
                    <div className="min-w-0">
                      {txn.member?.id ? (
                        <button type="button" onClick={() => navigate('/members', { state: { memberId: txn.member.id } })} className="link-draw truncate text-left font-semibold text-ink">
                          {txn.member.first_name} {txn.member.last_name}
                        </button>
                      ) : (
                        <p className={`truncate font-semibold ${memberName ? 'text-ink' : 'italic text-warn'}`}>{memberName || 'Walk-in Guest'}</p>
                      )}
                      {(txn.member?.email || txn.member_email_snapshot) && <p className="truncate text-xs text-muted">{txn.member?.email || txn.member_email_snapshot}</p>}
                    </div>
                  </div>
                  <span className={`shrink-0 font-display text-lg font-semibold tabular-nums ${isNegative(txn) ? 'text-negative' : 'text-ink'}`}>
                    {amountText(txn)}
                  </span>
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <p className="text-sm font-semibold text-ink">{getPackageDetails(txn).title}</p>
                  <p className="mt-0.5 text-xs text-muted">{getPackageDetails(txn).category}</p>
                  <p className="mt-2 text-xs text-muted"><span className="font-semibold text-ink-2">{txn.transaction_id}</span> · {txn.transaction_date}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={methodVariant(txn.payment_method)}>{getPaymentMethodLabel(txn.payment_method)}</Badge>
                    <Badge variant={statusVariant(txn.status)}>{txn.status}</Badge>
                  </div>
                </div>
                <div className="mt-3 flex justify-end border-t border-line pt-3">{rowActions(txn, true)}</div>
              </MobileCard>
            );
          })}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={transactions.length}
          itemsPerPage={itemsPerPage}
          itemsLabel="transactions"
        />
      </TableShell>
    </div>
  );
}
