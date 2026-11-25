import React from 'react';
import { formatNumber } from '../../../utils/numberFormat';
import { StatStrip, StatCell } from '../../../components/ui/StatStrip';

const peso = (v) => `₱ ${formatNumber(v, Number.isInteger(Number(v)) ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2 })}`;

// Muscle Bros does not refund, so total income is the revenue.
export default function TransactionStats({ totalIncome, paymentCount }) {
  return (
    <StatStrip columns="lg:grid-cols-2">
      <StatCell label="Total revenue" hint="Completed payments, all time" tone="gold" value={totalIncome} format={peso} />
      <StatCell label="Payments" hint="Completed payments recorded" tone="slate" value={paymentCount} format={formatNumber} />
    </StatStrip>
  );
}
