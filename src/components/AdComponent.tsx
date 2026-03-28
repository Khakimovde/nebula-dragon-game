import { useEffect, useRef, useState, useCallback } from 'react';

// Ad types: monetag and onclicka, shown alternately
type AdType = 'monetag' | 'onclicka';

// Track which ad to show next
let nextAdType: AdType = 'monetag';

// Monetag SDK loader
function loadMonetagScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[data-zone="10793560"]')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = '//munqu.com/sdk.js';
    script.dataset.zone = '10793560';
    script.dataset.sdk = 'show_10793560';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Monetag script failed'));
    document.head.appendChild(script);
  });
}

// OnClickA SDK loader
function loadOnClickAScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="onclckvd.com"]')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.onclckvd.com/in-stream-ad-admanager/tma.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('OnClickA script failed'));
    document.head.appendChild(script);
  });
}

interface AdComponentProps {
  onReward?: () => void;
  onError?: (err: any) => void;
  className?: string;
  children?: React.ReactNode;
}

export default function AdComponent({ onReward, onError, className, children }: AdComponentProps) {
  const showAdRef = useRef<(() => Promise<void>) | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const onClickAInitialized = useRef(false);

  useEffect(() => {
    // Load both SDKs
    Promise.all([
      loadMonetagScript().catch(() => {}),
      loadOnClickAScript().catch(() => {}),
    ]).then(() => {
      // Init OnClickA
      try {
        // @ts-expect-error admanager global
        window.initCdTma?.({ id: 6115139 })
          .then((show: any) => {
            showAdRef.current = show;
            onClickAInitialized.current = true;
            setReady(true);
          })
          .catch(() => setReady(true));
      } catch {
        setReady(true);
      }
    });
  }, []);

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    const currentAdType = nextAdType;
    // Alternate for next time
    nextAdType = currentAdType === 'monetag' ? 'onclicka' : 'monetag';

    try {
      if (currentAdType === 'onclicka' && showAdRef.current) {
        await showAdRef.current();
        onReward?.();
      } else {
        // Monetag - trigger via SDK
        try {
          const showMonetag = (window as any)[`show_10793560`];
          if (typeof showMonetag === 'function') {
            await showMonetag();
          }
        } catch {}
        // Give reward after short delay (monetag doesn't have reliable callback)
        await new Promise(r => setTimeout(r, 2000));
        onReward?.();
      }
    } catch (err) {
      onError?.(err);
      // Still give reward on error for better UX in development
      onReward?.();
    } finally {
      setLoading(false);
    }
  }, [loading, onReward, onError]);

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`watch-ad ${className || 'btn-gold w-full'}`}
    >
      {loading ? '⏳ Reklama yuklanmoqda...' : (children || '📺 Reklama ko\'rish')}
    </button>
  );
}
