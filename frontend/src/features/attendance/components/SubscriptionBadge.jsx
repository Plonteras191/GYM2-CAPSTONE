import React from 'react';
import { FiPause } from 'react-icons/fi';
import Badge from '../../../components/ui/Badge';

/** Active / Paused / Expired badge for a member's subscription. */
export default function SubscriptionBadge({ status }) {
  if (status === 'Active') return <Badge variant="success" dot>Active</Badge>;
  if (status === 'Paused') return <Badge variant="warning"><FiPause size={11} aria-hidden="true" />Paused</Badge>;
  if (status === 'Expired') return <Badge variant="danger" dot>Expired</Badge>;
  return <Badge variant="default" dot>{status || 'Unknown'}</Badge>;
}
