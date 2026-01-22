'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redirect /new to /new/edit for consistency with the [id]/edit structure
 */
export default function NewTemplatePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/email-templates/new/edit');
  }, [router]);

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <p>Redirecting...</p>
    </div>
  );
}
