import React from 'react';

export default function PrintableTransactionReport({
  filteredTxns,
  totalIncome,
  totalRefunds,
  netRevenue,
  pendingAmount
}) {
  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 15mm; }
          html, body { background-color: white !important; -webkit-print-color-adjust: exact; }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; margin: 0; background: white; color: black; }
        `}
      </style>

      <div id="printable-report" className="hidden print:block bg-white text-black font-sans w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black uppercase tracking-widest mb-1">
            Double Alpha Fitness Transaction Records
          </h1>
          <p className="text-sm font-bold text-gray-600">
            Generated on: {new Date().toLocaleDateString()}
          </p>
        </div>

        <table className="w-full border-collapse border-2 border-black mb-8 text-center">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="py-2 text-sm font-bold uppercase tracking-widest border-r-2 border-black">Total Income</th>
              <th className="py-2 text-sm font-bold uppercase tracking-widest border-r-2 border-black">Refunds</th>
              <th className="py-2 text-sm font-bold uppercase tracking-widest border-r-2 border-black">Net Revenue</th>
              <th className="py-2 text-sm font-bold uppercase tracking-widest">Pending</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-4 text-2xl font-black border-r-2 border-black">&#8369; {totalIncome.toLocaleString()}</td>
              <td className="py-4 text-2xl font-black border-r-2 border-black">&#8369; {totalRefunds.toLocaleString()}</td>
              <td className="py-4 text-2xl font-black border-r-2 border-black">&#8369; {netRevenue.toLocaleString()}</td>
              <td className="py-4 text-2xl font-black">&#8369; {pendingAmount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse border-2 border-black text-center text-sm">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">TXN ID & DATE</th>
              <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">MEMBER</th>
              <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">DETAILS</th>
              <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">METHOD</th>
              <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">AMOUNT</th>
              <th className="py-2 font-bold uppercase tracking-widest">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredTxns.map((txn) => {
              const memberName = txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : 'Walk-in Guest';
              const amtStr = Number(txn.amount) > 0 ? `\u20B1 ${Number(txn.amount).toLocaleString()}` : `-\u20B1 ${Math.abs(Number(txn.amount)).toLocaleString()}`;
              return (
                <tr key={txn.id} className="border-b border-black last:border-0">
                  <td className="py-3 font-medium border-r-2 border-black">
                    <div className="font-bold">{txn.transaction_id}</div>
                    <div className="text-xs">{txn.transaction_date}</div>
                  </td>
                  <td className="py-3 font-medium border-r-2 border-black uppercase">{memberName}</td>
                  <td className="py-3 font-medium border-r-2 border-black uppercase">
                    <div className="font-bold">{txn.type}</div>
                    <div className="text-xs">{txn.description || '-'}</div>
                  </td>
                  <td className="py-3 font-medium border-r-2 border-black uppercase">{txn.payment_method}</td>
                  <td className="py-3 font-medium border-r-2 border-black uppercase">{amtStr}</td>
                  <td className="py-3 font-medium uppercase">{txn.status}</td>
                </tr>
              );
            })}
            {filteredTxns.length === 0 && (
              <tr>
                <td colSpan="6" className="py-8 font-medium">
                  No matching records found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
