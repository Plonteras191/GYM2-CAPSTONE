import React from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiLoader, FiList, FiUsers } from 'react-icons/fi';
import Pagination from '../../../components/ui/Pagination';
import StyledSelect from '../../../components/ui/StyledSelect';
import SearchInput from '../../../components/ui/SearchInput';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import IconButton from '../../../components/ui/IconButton';
import TableShell, { Toolbar, TableLoading, TableEmpty, CardListLoading, CardListEmpty, MobileCard } from '../../../components/ui/TableShell';
import { fieldClass, thClass, tdClass } from '../../../components/ui/field';

const getStatusBadge = (status) => {
  if (status === 'Active') return <Badge variant="success">Active</Badge>;
  if (status === 'Inactive') return <Badge variant="default">Inactive</Badge>;
  return <Badge variant="danger">Expired</Badge>;
};

const getActivePackageName = (member) => {
  const membership = member.activeMembership || member.active_membership;
  return membership?.plan?.name || membership?.plan_type || 'None';
};

const COLUMNS = ['Member ID', 'Member Details', 'Phone Number', 'Address', 'Package Type', 'Customer Since', 'Attendance Status', 'Actions'];

export default function MemberTable({
  members,
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

  const rowActions = (member, withLabels = false) => (
    <div className="inline-flex items-center gap-1.5">
      <IconButton tone="info" label="View profile" icon={<FiEye size={15} />} onClick={() => onViewProfile(member)}>{withLabels && 'View'}</IconButton>
      <IconButton tone="warn" label="Edit member" icon={<FiEdit2 size={15} />} onClick={() => onEditMember(member)} disabled={deletingId === member.id}>{withLabels && 'Edit'}</IconButton>
      <IconButton tone="danger" label="Delete member" icon={deletingId === member.id ? <FiLoader size={15} className="animate-spin" /> : <FiTrash2 size={15} />} onClick={() => onDeleteMember(member.id)} disabled={deletingId === member.id}>{withLabels && 'Delete'}</IconButton>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6 lg:space-y-6">
      <Toolbar index={0} className="sm:flex-row sm:items-center">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search members"
          containerClassName="relative min-w-0 flex-1"
        />
        <div className="min-w-0 sm:w-44">
          <StyledSelect
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter members by status"
            className={fieldClass}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </StyledSelect>
        </div>
        <Button onClick={onAddMember} icon={<FiPlus size={18} strokeWidth={2.5} />} className="w-full whitespace-nowrap sm:w-auto">
          Add Member
        </Button>
      </Toolbar>

      <TableShell index={1} title="Total Members" icon={FiList} count={members.length}>
        <div className="hidden overflow-hidden xl:block">
          <table className="w-full min-w-0 table-fixed border-collapse text-left align-middle">
            <colgroup>
              <col className="w-[8%]" />
              <col className="w-[23%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[9%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-line">
                {COLUMNS.map((h, i) => (
                  <th key={h} scope="col" className={`${thClass} whitespace-nowrap${i === 0 || i === 6 ? ' text-center' : i === 7 ? ' text-right' : ' text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <TableLoading colSpan={8} />
              ) : currentMembers.length === 0 ? (
                <TableEmpty colSpan={8} icon={FiUsers}>No members found in the database.</TableEmpty>
              ) : (
                currentMembers.map((member, i) => (
                  <tr key={member.id} className="rise transition-colors hover:bg-hover" style={{ '--i': Math.min(i, 8) * 0.5 + 1 }}>
                    <td className={`${tdClass} text-center font-display text-base tabular-nums text-muted`}>{member.id}</td>
                    <td className={`${tdClass} overflow-hidden whitespace-nowrap`}>
                      <div className="flex items-center gap-3">
                        <Avatar src={member.profilePicUrl} name={`${member.firstName} ${member.lastName}`} />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-ink">{member.firstName} {member.lastName}</div>
                          <div className="mt-0.5 truncate text-xs text-muted">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`${tdClass} overflow-hidden whitespace-nowrap tabular-nums`}>{member.phone}</td>
                    <td className={`${tdClass} truncate`}>{member.address || '-'}</td>
                    <td className={`${tdClass} truncate font-semibold text-ink`}>{getActivePackageName(member)}</td>
                    <td className={`${tdClass} whitespace-nowrap text-muted`}>{member.customerSince}</td>
                    <td className={`${tdClass} whitespace-nowrap text-center`}>{getStatusBadge(member.status)}</td>
                    <td className={`${tdClass} whitespace-nowrap text-right`}>{rowActions(member)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 xl:hidden">
          {isLoading ? (
            <CardListLoading />
          ) : currentMembers.length === 0 ? (
            <CardListEmpty>No members found in the database.</CardListEmpty>
          ) : currentMembers.map((member, i) => (
            <MobileCard key={member.id} index={i}>
              <div className="flex items-start gap-3">
                <Avatar size="lg" src={member.profilePicUrl} name={`${member.firstName} ${member.lastName}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-semibold text-ink">{member.firstName} {member.lastName}</p>
                    {getStatusBadge(member.status)}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{member.email}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <div><dt className="text-muted">Member ID</dt><dd className="font-semibold tabular-nums text-ink-2">{member.id}</dd></div>
                    <div><dt className="text-muted">Phone</dt><dd className="font-semibold tabular-nums text-ink-2">{member.phone || '—'}</dd></div>
                    <div className="col-span-2"><dt className="text-muted">Package</dt><dd className="font-semibold text-ink-2">{getActivePackageName(member)}</dd></div>
                  </dl>
                </div>
              </div>
              <div className="mt-3 flex justify-end border-t border-line pt-3">{rowActions(member, true)}</div>
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
