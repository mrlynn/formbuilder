'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { HelpProvider } from '@/contexts/HelpContext';
import { TourProvider } from '@/contexts/TourContext';
import { ConsentProvider } from '@/contexts/ConsentContext';
import { CookieConsentModal } from '@/components/CookieConsent';

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ThemeProvider>
      <ConsentProvider>
        <HelpProvider>
          <TourProvider>
            {children}
            <CookieConsentModal />
          </TourProvider>
        </HelpProvider>
      </ConsentProvider>
    </ThemeProvider>
  );
}
