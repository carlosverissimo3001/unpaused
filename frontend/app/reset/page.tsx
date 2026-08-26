import { Suspense } from 'react';
import { ResetClient } from './ResetClient';

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetClient />
    </Suspense>
  );
}
