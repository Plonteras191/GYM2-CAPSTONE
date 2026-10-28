import React from 'react';

export default function PrintableTransactionReport({
  filteredTxns,
  filterType,
  searchTerm
}) {
  const totalIncome = filteredTxns
    .filter(transaction => Number(transaction.amount) > 0 && transaction.status === 'Complete')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const totalRefunds = filteredTxns
    .filter(transaction => transaction.type === 'Refund')
    .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0);
  const pendingAmount = filteredTxns
    .filter(transaction => transaction.status === 'Pending')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const netRevenue = totalIncome - totalRefunds;
  const formatCurrency = amount => `\u20B1 ${amount.toLocaleString()}`;

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: A4 landscape; margin: 12mm; }
          html, body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; margin: 0; background: white; color: black; }
          #printable-report thead { display: table-header-group; }
          #printable-report tr { break-inside: avoid; }
        `}
      </style>

      <div id="printable-report" className="hidden w-full bg-white font-sans text-black print:block">
        <div className="mb-5 flex items-end justify-between border-b-2 border-black pb-3">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide">Double Alpha Fitness Gym</h1>
            <p className="mt-1 text-xs font-medium text-gray-600">
              Transaction report · {filterType === 'All' ? 'All transaction types' : filterType}
              {searchTerm ? ` · Search: ${searchTerm}` : ''}
            </p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>Records: {filteredTxns.length.toLocaleString()}</p>
            <p>Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>

        <table className="mb-5 w-full border-collapse border border-black text-center">
          <thead>
            <tr className="border-b border-black bg-gray-100">
              <th className="border-r border-black py-1.5 text-xs font-bold uppercase">Total Income</th>
              <th className="border-r border-black py-1.5 text-xs font-bold uppercase">Refunds</th>
              <th className="border-r border-black py-1.5 text-xs font-bold uppercase">Net Revenue</th>
              <th className="py-1.5 text-xs font-bold uppercase">Pending</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r border-black py-2 text-lg font-black">{formatCurrency(totalIncome)}</td>
              <td className="border-r border-black py-2 text-lg font-black">{formatCurrency(totalRefunds)}</td>
              <td className="border-r border-black py-2 text-lg font-black">{formatCurrency(netRevenue)}</td>
              <td className="py-2 text-lg font-black">{formatCurrency(pendingAmount)}</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full table-fixed border-collapse border border-black text-left text-xs">
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[17%]" />
            <col className="w-[13%]" />
            <col className="w-[23%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="border-b-2 border-black bg-gray-100">
              <th className="px-2 py-2 font-bold uppercase">Transaction / Date</th>
              <th className="px-2 py-2 font-bold uppercase">Member</th>
              <th className="px-2 py-2 font-bold uppercase">Type</th>
              <th className="px-2 py-2 font-bold uppercase">Package / Details</th>
              <th className="px-2 py-2 font-bold uppercase">Method</th>
              <th className="px-2 py-2 text-right font-bold uppercase">Amount</th>
              <th className="px-2 py-2 font-bold uppercase">Status / Reference</th>
            </tr>
          </thead>
          <tbody>
            {filteredTxns.map((txn) => {
              const memberName = txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : 'Walk-in Guest';
              const amount = Number(txn.amount);
              const packageDetails = txn.membership?.plan_type || txn.description || '-';
              const formattedAmount = `${amount < 0 ? '-' : ''}${formatCurrency(Math.abs(amount))}`;
              return (
                <tr key={txn.id} className="border-b border-gray-400">
                  <td className="break-words px-2 py-2 font-medium">
                    <div className="font-bold">{txn.transaction_id}</div>
                    <div className="mt-0.5 text-[10px]">{txn.transaction_date}</div>
                  </td>
                  <td className="break-words px-2 py-2 font-medium">{memberName}</td>
                  <td className="break-words px-2 py-2 font-medium">{txn.type || '-'}</td>
                  <td className="break-words px-2 py-2 font-medium">{packageDetails}</td>
                  <td className="break-words px-2 py-2 font-medium">{txn.payment_method || '-'}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-bold">{formattedAmount}</td>
                  <td className="break-words px-2 py-2 font-medium">
                    <div>{txn.status || '-'}</div>
                    {txn.reference_number && <div className="mt-0.5 text-[10px]">{txn.reference_number}</div>}
                  </td>
                </tr>
              );
            })}
            {filteredTxns.length === 0 && (
              <tr>
                <td colSpan="7" className="py-8 text-center font-medium">
                  No transactions match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
