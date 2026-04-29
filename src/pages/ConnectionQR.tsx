import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { useBranding } from '../hooks/useBranding';
import { AdminBackButton } from '@/components/admin';
import { CheckIcon, CopyIcon } from '../components/icons';
import { copyToClipboard } from '../utils/clipboard';

interface ConnectionQRState {
  url: string;
  hideLink: boolean;
  subscriptionId?: number;
}

function isValidState(state: unknown): state is ConnectionQRState {
  if (!state || typeof state !== 'object') return false;
  const s = state as Record<string, unknown>;
  return typeof s.url === 'string' && s.url.length > 0 && typeof s.hideLink === 'boolean';
}

export default function ConnectionQR() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { appName } = useBranding();
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const state = location.state as unknown;
  const validState = isValidState(state) ? state : null;
  const subId = validState?.subscriptionId;
  const connectionPath = subId ? `/connection?sub=${subId}` : '/connection';

  useEffect(() => {
    if (!validState) {
      navigate(connectionPath, { replace: true });
    }
  }, [validState, navigate, connectionPath]);

  useEffect(
    () => () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    },
    [],
  );

  const handleCopyLink = async () => {
    if (!validState) return;
    await copyToClipboard(validState.url);
    setCopied(true);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  if (!validState) {
    return null;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <AdminBackButton to={connectionPath} replace />
        <h1 className="text-2xl font-bold text-dark-100">{t('subscription.connection.qrTitle')}</h1>
      </div>

      <div className="flex flex-col items-center">
        <div className="flex w-full max-w-sm flex-col items-center px-6">
          {appName && (
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-dark-400">
              {appName}
            </p>
          )}

          <p className="mb-8 text-center text-sm text-dark-400">
            {t('subscription.connection.qrScanHint')}
          </p>

          <div className="rounded-3xl bg-white p-6">
            <QRCodeSVG
              value={validState.url}
              size={280}
              level="M"
              includeMargin={false}
              className="h-[280px] w-[280px] sm:h-[360px] sm:w-[360px]"
            />
          </div>

          {!validState.hideLink && (
            <button
              type="button"
              onClick={handleCopyLink}
              className={`mt-6 flex max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-left font-mono text-xs transition-colors ${
                copied
                  ? 'border-accent-500/30 bg-accent-500/10 text-accent-400'
                  : 'border-dark-700/70 bg-dark-800/60 text-dark-500 hover:border-dark-600 hover:text-dark-300'
              }`}
              title={copied ? t('subscription.connection.copied') : t('subscription.copyLink')}
            >
              <span className="min-w-0 truncate">{validState.url}</span>
              {copied ? (
                <CheckIcon className="h-4 w-4 shrink-0" />
              ) : (
                <CopyIcon className="h-4 w-4 shrink-0" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
