'use client';

import { SampleDataPanel } from '@/components/SampleDataPanel/SampleDataPanel';

interface SampleDocumentsProps {
  connectionString: string | null;
  databaseName: string | null;
  collection: string | null;
}

export function SampleDocuments({ connectionString, databaseName, collection }: SampleDocumentsProps) {
  return (
    <SampleDataPanel
      connectionString={connectionString}
      databaseName={databaseName}
      collectionName={collection}
    />
  );
}

