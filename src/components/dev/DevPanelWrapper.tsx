/**
 * DevPanelWrapper
 *
 * Connects the SubscriptionDevPanel to the OrganizationContext.
 * Only renders when there's a selected organization.
 */

'use client';

import { useOrganization } from '@/contexts/OrganizationContext';
import { SubscriptionDevPanel } from './SubscriptionDevPanel';

interface DevPanelWrapperProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function DevPanelWrapper({ position = 'bottom-right' }: DevPanelWrapperProps) {
  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const { currentOrgId, isLoading } = useOrganization();

  // Don't render if no org selected or still loading
  if (isLoading || !currentOrgId) {
    return null;
  }

  return <SubscriptionDevPanel orgId={currentOrgId} position={position} />;
}

export default DevPanelWrapper;
