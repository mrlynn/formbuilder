import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { ClientLayout } from '@/components/ClientLayout';
import { PipelineProvider } from '@/contexts/PipelineContext';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'FormBuilder - Build MongoDB Forms in Minutes',
  description: 'Create beautiful, validated data entry forms connected directly to your MongoDB collections. No coding required.'
};

import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          <AuthProvider>
            <PipelineProvider>{children}</PipelineProvider>
          </AuthProvider>
        </ClientLayout>
      </body>
    </html>
  );
}


