'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Compass, Sparkles, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeBannerProps {
  initialUsername?: string | null;
  initialAvatarUrl?: string | null;
  searchParamUser?: string | null;
  isWelcomeRedirect?: boolean;
}

function WelcomeBannerInner({
  initialUsername,
  initialAvatarUrl,
  searchParamUser,
  isWelcomeRedirect,
}: WelcomeBannerProps) {
  const searchParams = useSearchParams();

  // Strictly deterministic initial state from SSR props so server HTML matches client hydration 100%
  const [username, setUsername] = useState<string | null>(
    () => searchParamUser || initialUsername || null
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    () => initialAvatarUrl || '/avatars/snow-leopard.svg'
  );
  const [isCelebrationVisible, setIsCelebrationVisible] = useState<boolean>(() =>
    Boolean(isWelcomeRedirect)
  );

  useEffect(() => {
    // 1. Clean up URL search parameters cleanly without page refresh
    if (
      typeof window !== 'undefined' &&
      (searchParams?.get('welcome') || searchParams?.get('user'))
    ) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('welcome');
      cleanUrl.searchParams.delete('user');
      window.history.replaceState(
        {},
        '',
        cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : '')
      );
    }

    // 2. Subscribe to realtime auth changes from client login/signup or profile updates
    const handleAuthChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        avatarUrl?: string;
        username?: string;
      }>;
      const detail = customEvent.detail;
      if (detail?.username) {
        setUsername(detail.username);
        if (detail.avatarUrl) {
          setAvatarUrl(detail.avatarUrl);
        }
        setIsCelebrationVisible(true);
      } else {
        setUsername(null);
      }
    };

    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{
        avatarUrl?: string;
        username?: string;
      }>;
      const detail = customEvent.detail;
      if (detail?.username) setUsername(detail.username);
      if (detail?.avatarUrl) setAvatarUrl(detail.avatarUrl);
    };

    window.addEventListener('hgn:auth-state-changed', handleAuthChange);
    window.addEventListener('hgn:profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('hgn:auth-state-changed', handleAuthChange);
      window.removeEventListener('hgn:profile-updated', handleProfileUpdate);
    };
  }, [searchParams]);

  if (!username) {
    return null;
  }

  return (
    <div className="relative mb-6 flex flex-col items-center justify-center">
      {/* ── 1. Fresh Sign-In Celebration Card (Slides in with stylish motion) ── */}
      {isCelebrationVisible && (
        <div className="relative w-full max-w-xl mb-4 animate-in fade-in-0 slide-in-from-top-6 zoom-in-95 duration-700 ease-out">
          {/* Ambient warm glow radiating behind */}
          <div
            className="pointer-events-none absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-r from-orange-500/20 via-amber-500/25 to-orange-500/20 blur-xl dark:from-orange-500/15 dark:to-orange-500/15"
            aria-hidden="true"
          />

          <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-primary/30 bg-card/95 p-3.5 sm:p-4 text-left shadow-xl shadow-orange-500/5 backdrop-blur-md">
            {/* Left accent indicator bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-orange-400 to-amber-500" />

            <div className="flex items-center gap-3.5 pl-2 min-w-0">
              {/* User Avatar with pulsing online aura */}
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-primary/40 bg-muted p-0.5 shadow-sm">
                <Image
                  src={avatarUrl}
                  alt={username}
                  width={44}
                  height={44}
                  unoptimized
                  className="h-full w-full rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
              </div>

              {/* Text Information */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <Sparkles className="h-3 w-3" />
                    Verified Explorer
                  </span>
                </div>
                <h3 className="truncate text-base font-bold text-foreground">
                  Welcome to the trail,{' '}
                  <span className="text-primary font-extrabold">@{username}</span>
                </h3>
                <p className="truncate text-xs text-muted-foreground">
                  You are signed in. All 77 districts and quiet spots are open for you.
                </p>
              </div>
            </div>

            {/* Actions & Dismiss */}
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/explore">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Explore</span>
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => setIsCelebrationVisible(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Dismiss banner"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Sleek Permanent Hero Badge for Authenticated User ── */}
      {!isCelebrationVisible && (
        <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/25 bg-primary/5 py-1.5 pl-1.5 pr-4 text-xs font-medium text-foreground shadow-xs animate-in fade-in-0 slide-in-from-top-2 duration-500">
          <div className="relative h-6 w-6 overflow-hidden rounded-full ring-1 ring-primary/40 bg-muted shrink-0">
            <Image
              src={avatarUrl}
              alt={username}
              width={24}
              height={24}
              unoptimized
              className="h-full w-full object-cover"
            />
          </div>
          <span>
            Namaste, <strong className="font-semibold text-primary">@{username}</strong> · Welcome to HiddenGems Nepal
          </span>
          <Link
            href="/profile"
            className="ml-1 inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline"
          >
            Profile <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

export function WelcomeBanner(props: WelcomeBannerProps) {
  return (
    <Suspense fallback={null}>
      <WelcomeBannerInner {...props} />
    </Suspense>
  );
}
