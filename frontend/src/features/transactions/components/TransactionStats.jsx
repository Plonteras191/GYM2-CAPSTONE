import React from 'react';
import { formatNumber } from '../../../utils/numberFormat';
import { StatStrip, StatCell } from '../../../components/ui/StatStrip';

const peso = (v) => `₱\u00A0${formatNumber(v, Number.isInteger(Number(v)) ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2 })}`;

export default function TransactionStats({ totalIncome, totalRefunds, netRevenue }) {
  return (
    <StatStrip columns="lg:grid-cols-3">
      <StatCell label="Total income" hint="Completed payments, all time" tone="gold" value={totalIncome} format={peso} />
      <StatCell label="Refunds" hint="Money returned to members" tone="crimson" value={totalRefunds} format={peso} />
      <StatCell label="Net revenue" hint="Income minus refunds" tone="slate" value={netRevenue} format={peso} className="min-[360px]:col-span-2 lg:col-span-1" />
    </StatStrip>
  );
}
