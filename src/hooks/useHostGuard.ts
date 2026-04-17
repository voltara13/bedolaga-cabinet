import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Paths allowed on the apex (public) domain. Everything else is cabinet-only
 * and must live on the cabinet subdomain.
 */
const APEX_PATH_PREFIXES = [
  '/home',
  '/login',
  '/info',
  '/auth',
  '/verify-email',
  '/reset-password',
  '/merge',
];

function isApexPath(pathname: string): boolean {
  return APEX_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  );
}

/**
 * When VITE_CABINET_HOST is set and the SPA is currently rendered on a host
 * other than that cabinet host, any non-public route is redirected (full page)
 * to the same path on the cabinet host. Public landing/auth routes stay on the
 * apex host.
 *
 * Leave VITE_CABINET_HOST empty to disable (single-domain deployments).
 */
export function useHostGuard() {
  const location = useLocation();

  useEffect(() => {
    const cabinetHost = import.meta.env.VITE_CABINET_HOST;
    if (!cabinetHost) return;

    const currentHost = window.location.hostname;
    if (currentHost === cabinetHost) return;

    if (isApexPath(location.pathname)) return;

    const target = `${window.location.protocol}//${cabinetHost}${location.pathname}${location.search}${location.hash}`;
    window.location.replace(target);
  }, [location]);
}
