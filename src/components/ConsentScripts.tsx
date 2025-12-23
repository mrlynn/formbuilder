'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { useConsentScript } from '@/contexts/ConsentContext';

/**
 * Google Analytics Script - Only loads when analytics consent is given
 */
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const canLoad = useConsentScript('analytics');

  if (!canLoad) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  );
}

/**
 * Facebook Pixel - Only loads when marketing consent is given
 */
export function FacebookPixel({ pixelId }: { pixelId: string }) {
  const canLoad = useConsentScript('marketing');

  if (!canLoad) return null;

  return (
    <Script id="facebook-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}

/**
 * Hotjar - Only loads when analytics consent is given
 */
export function Hotjar({ siteId, version = 6 }: { siteId: string; version?: number }) {
  const canLoad = useConsentScript('analytics');

  if (!canLoad) return null;

  return (
    <Script id="hotjar" strategy="afterInteractive">
      {`
        (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${siteId},hjsv:${version}};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `}
    </Script>
  );
}

/**
 * Custom hook for programmatic analytics events
 * Only fires events when consent is given
 */
export function useAnalytics() {
  const canTrack = useConsentScript('analytics');

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (!canTrack) {
      console.log('[Analytics] Event blocked (no consent):', eventName);
      return;
    }

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, parameters);
    }

    // Add other analytics providers here
    console.log('[Analytics] Event tracked:', eventName, parameters);
  };

  const trackPageView = (path: string) => {
    if (!canTrack) return;

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: path,
      });
    }
  };

  return { trackEvent, trackPageView, canTrack };
}

/**
 * Component that disables form submission metadata collection
 * when user opts out of analytics
 */
export function useFormMetadataConsent() {
  const canCollect = useConsentScript('analytics');

  return {
    canCollectMetadata: canCollect,
    // Return empty metadata if no consent
    getMetadata: () => {
      if (!canCollect) {
        return {
          userAgent: null,
          ipAddress: null,
          deviceType: null,
          referrer: null,
        };
      }
      return undefined; // Let the form handler collect normally
    },
  };
}
