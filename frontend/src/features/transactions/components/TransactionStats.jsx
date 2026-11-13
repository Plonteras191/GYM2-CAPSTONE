import React from 'react';
import { formatNumber } from '../../../utils/numberFormat';
import { StatStrip, StatCell } from '../../../components/ui/StatStrip';

const peso = (v) => `₱ ${formatNumber(v)}`;

export default function TransactionStats({ totalIncome, totalRefunds, netRevenue }) {
  return (
    <StatStrip columns="lg:grid-cols-3">
      <StatCell label="Total Income" tone="gold" value={totalIncome} format={peso} />
      <StatCell label="Refunds" tone="crimson" value={totalRefunds} format={peso} />
      <StatCell label="Net Revenue" tone="slate" value={netRevenue} format={peso} className="min-[360px]:col-span-2 lg:col-span-1" />
    </StatStrip>
  );
}
