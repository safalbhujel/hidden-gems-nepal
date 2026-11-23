'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { UnifiedAuthFlow } from '@/components/auth/UnifiedAuthFlow';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6">
      {/* Ambient warm glow in background */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -z-10 h-[360px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF8500]/8 blur-[100px] dark:bg-[#FF8500]/12"
        aria-hidden="true"
      />

      <Suspense
        fallback={
          <div className="w-full max-w-[440px] rounded-3xl border border-border/80 bg-card/80 p-12 text-center text-sm text-muted-foreground shadow-xl backdrop-blur-xl">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
            Loading authentication...
          </div>
        }
      >
        <UnifiedAuthFlow defaultMode="login" />
      </Suspense>
    </div>
  );
}
