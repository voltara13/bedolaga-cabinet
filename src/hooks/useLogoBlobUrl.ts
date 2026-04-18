import { useSyncExternalStore } from 'react';
import { getLogoBlobUrl, subscribeLogoBlob } from '@/api/branding';

const getServerSnapshot = (): string | null => null;

export function useLogoBlobUrl(): string | null {
  return useSyncExternalStore(subscribeLogoBlob, getLogoBlobUrl, getServerSnapshot);
}
