import React from 'react';
import { FiUserPlus, FiEdit2, FiTrash2, FiEye, FiLoader, FiUsers, FiSearch, FiX, FiChevronRight } from 'react-icons/fi';
import Pagination from '../../../components/ui/Pagination';
import SearchInput from '../../../components/ui/SearchInput';
import SegmentedFilter from '../../../components/ui/SegmentedFilter';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import IconButton from '../../../components/ui/IconButton';
import TableShell, { Toolbar, TableLoading, CardListLoading, MobileCard } from '../../../components/ui/TableShell';
import { thClass, tdClass } from '../../../components/ui/field';

const getStatusBadge = (status) => {
  if (status === 'Active') return <Badge variant="success" dot>Active</Badge>;
  if (status === 'Inactive') return <Badge variant="default" dot>Inactive</Badge>;
  return <Badge variant="danger" dot>Expired</Badge>;
};

const getActivePackageName = (member) => {
  const membership = member.activeMembership || member.active_membership;
  return membership?.plan?.name || membership?.plan_type || 'None';
};

function PackageName({ member }) {
  const name = getActivePackageName(member);
  return name === 'None'
    ? <span className="text-muted">No package</span>
    : <span className="font-medium text-ink">{name}</span>;
}

const fullName = (member) => `${member.firstName || ''} ${member.lastName || ''}`.trim();

/** Shown when the list is empty: different help for "nothing yet" and "nothing matches". */
function NoResults({ isFiltered, searchTerm, onClear, onAddMember }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-hover text-muted">
        {isFiltered ? <FiSearch size={20} aria-hidden="true" /> : <FiUsers size={20} aria-hidden="true" />}
      </span>
      <div>
        <p className="text-[15px] font-medium text-ink">
          {isFiltered ? (searchTerm.trim() ? `No members match “${searchTerm.trim()}”` : 'No members with this status') : 'No members yet'}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">
          {isFiltered ? 'Check the spelling, or search by email or phone number instead.' : 'Members you register will be listed here.'}
        </p>
      </div>
      {isFiltered
        ? <Button size="sm" variant="outline" icon={<FiX size={14} />} onClick={onClear}>Clear search and filters</Button>
        : <Button size="sm" icon={<FiUserPlus size={14} />} onClick={onAddMember}>Register a member</Button>}
    </div>
  );
}

const COLUMNS = [
  { label: 'Member', align: 'text-left', width: 'w-[24%]' },
  { label: 'Member ID', align: 'text-left', width: 'w-[8%]' },
  { label: 'Phone', align: 'text-left', width: 'w-[12%]' },
  { label: 'Package', align: 'text-left', width: 'w-[11%]' },
  { label: 'Attendance status', align: 'text-left', width: 'w-[12%]' },
  { label: 'Member since', align: 'text-left', width: 'w-[10%]' },
  { label: 'Address', align: 'text-left', width: 'w-[9%]' },
  { label: 'Actions', align: 'text-right', width: 'w-[14%]' },
];

export default function MemberTable({
  members,
  allMembers = members,
  isLoading,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  deletingId,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onViewProfile,
}) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

  const totalPages = Math.ceil(members.length / itemsPerPage);
  const indexOfFirst = (currentPage - 1) * itemsPerPage;
  const currentMembers = members.slice(indexOfFirst, indexOfFirst + itemsPerPage);
  React.useEffect(() => {
    setCurrentPage(page => Math.max(1, Math.min(page, totalPages || 1)));
  }, [totalPages]);

  /* ── Display-only ── */
  const counts = React.useMemo(() => ({
    All: allMembers.length,
    Active: allMembers.filter(m => m.status === 'Active').length,
    Inactive: allMembers.filter(m => m.status === 'Inactive').length,
  }), [allMembers]);
  const isFiltered = searchTerm.trim() !== '' || filterStatus !== 'All';
  const clearFilters = () => { setSearchTerm(''); setFilterStatus('All'); };

  // Clicks on the action buttons must not also open the profile.
  const rowActions = (member, withLabels = false) => (
    <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <IconButton tone="info" label={`View ${fullName(member)}`} icon={<FiEye size={15} />} onClick={() => onViewProfile(member)}>{withLabels && 'View'}</IconButton>
      <IconButton tone="warn" label={`Edit ${fullName(member)}`} icon={<FiEdit2 size={15} />} onClick={() => onEditMember(member)} disabled={deletingId === member.id}>{withLabels && 'Edit'}</IconButton>
      <IconButton tone="danger" label={`Delete ${fullName(member)}`} icon={deletingId === member.id ? <FiLoader size={15} className="animate-spin" /> : <FiTrash2 size={15} />} onClick={() => onDeleteMember(member.id)} disabled={deletingId === member.id}>{withLabels && 'Delete'}</IconButton>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6 lg:space-y-6">
      <Toolbar index={0} className="lg:flex-row lg:items-center">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by name, email or phone"
          containerClassName="relative min-w-0 flex-1"
        />
        <SegmentedFilter
          label="Filter members by status"
          value={filterStatus}
          onChange={setFilterStatus}
          className="w-full lg:w-auto"
          options={[
            { value: 'All', label: 'All', count: counts.All },
            { value: 'Active', label: 'Active', count: counts.Active, dot: 'bg-positive' },
            { value: 'Inactive', label: 'Inactive', count: counts.Inactive, dot: 'bg-line-strong' },
          ]}
        />
        <Button onClick={onAddMember} icon={<FiUserPlus size={18} />} className="w-full whitespace-nowrap lg:w-auto">
          Register a member
        </Button>
      </Toolbar>

      <TableShell
        index={1}
        title={isFiltered ? 'Matching members' : 'All members'}
        icon={FiUsers}
        count={members.length}
        action={isFiltered && !isLoading && (
          <div className="flex items-center gap-3 text-[13px]">
            <span className="text-muted">Showing {members.length.toLocaleString()} of {allMembers.length.toLocaleString()}</span>
            <button type="button" onClick={clearFilters} className="press inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 font-medium text-ink-2 hover:bg-hover hover:text-ink">
              <FiX size={14} aria-hidden="true" /> Clear filters
            </button>
          </div>
        )}
      >
        {/* Desktop: a table where the whole row opens the member's profile */}
        <div className="hidden overflow-hidden xl:block">
          <table className="w-full min-w-0 table-fixed border-collapse text-left align-middle">
            <colgroup>
              {COLUMNS.map(col => <col key={col.label} className={col.width} />)}
            </colgroup>
            <thead>
              <tr className="border-b border-line">
                {COLUMNS.map(col => (
                  <th key={col.label} scope="col" className={`${thClass} whitespace-nowrap ${col.align}`}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <TableLoading colSpan={COLUMNS.length} />
              ) : currentMembers.length === 0 ? (
                <tr><td colSpan={COLUMNS.length}><NoResults isFiltered={isFiltered} searchTerm={searchTerm} onClear={clearFilters} onAddMember={onAddMember} /></td></tr>
              ) : (
                currentMembers.map((member, i) => (
                  <tr
                    key={member.id}
                    onClick={() => onViewProfile(member)}
                    className="rise group cursor-pointer transition-colors duration-150 hover:bg-hover"
                    style={{ '--i': Math.min(i, 8) * 0.5 + 1 }}
                  >
                    <td className={`${tdClass} overflow-hidden`}>
                      <div className="flex items-center gap-3">
                        <Avatar src={member.profilePicUrl} name={fullName(member)} />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onViewProfile(member); }}
                            className="link-draw block max-w-full truncate text-left text-[15px] font-medium text-ink"
                          >
                            {fullName(member)}
                          </button>
                          <div className="mt-0.5 truncate text-[13px] text-muted">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`${tdClass} font-mono text-[13px] text-muted`}>{member.id}</td>
                    <td className={`${tdClass} truncate whitespace-nowrap tabular-nums`}>{member.phone || <span className="text-muted">—</span>}</td>
                    <td className={`${tdClass} truncate`}><PackageName member={member} /></td>
                    <td className={`${tdClass} whitespace-nowrap`}>{getStatusBadge(member.status)}</td>
                    <td className={`${tdClass} whitespace-nowrap text-muted`}>{member.customerSince}</td>
                    <td className={`${tdClass} truncate text-muted`} title={member.address || undefined}>{member.address || '—'}</td>
                    <td className={`${tdClass} whitespace-nowrap text-right`}>{rowActions(member)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tablet and phone: cards; tapping the top of a card opens the profile */}
        <div className="space-y-3 p-3 xl:hidden">
          {isLoading ? (
            <CardListLoading />
          ) : currentMembers.length === 0 ? (
            <NoResults isFiltered={isFiltered} searchTerm={searchTerm} onClear={clearFilters} onAddMember={onAddMember} />
          ) : currentMembers.map((member, i) => (
            <MobileCard key={member.id} index={i} className="p-0">
              <button
                type="button"
                onClick={() => onViewProfile(member)}
                className="group press flex w-full items-start gap-3 rounded-t-xl p-4 text-left hover:bg-hover"
              >
                <Avatar size="lg" src={member.profilePicUrl} name={fullName(member)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink">{fullName(member)}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-muted">{member.email}</span>
                  <span className="mt-3 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-[13px]">
                    <span><span className="block text-muted">Member ID</span><span className="font-mono text-ink-2">{member.id}</span></span>
                    <span className="min-w-0"><span className="block text-muted">Phone</span><span className="block whitespace-nowrap tabular-nums text-ink-2">{member.phone || '—'}</span></span>
                    <span><span className="mb-0.5 block text-muted">Status</span>{getStatusBadge(member.status)}</span>
                    <span className="min-w-0"><span className="block text-muted">Package</span><span className="block truncate"><PackageName member={member} /></span></span>
                  </span>
                </span>
                <FiChevronRight size={18} aria-hidden="true" className="nudge mt-3 shrink-0 text-muted" />
              </button>
              <div className="flex justify-end border-t border-line px-4 py-3">{rowActions(member, true)}</div>
            </MobileCard>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={members.length}
          itemsPerPage={itemsPerPage}
          itemsLabel="members"
        />
      </TableShell>
    </div>
  );
}
