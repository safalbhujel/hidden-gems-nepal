'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { saveUsername } from '@/app/(auth)/actions';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, AtSign, Check, Loader2, Sparkles, ArrowRight } from 'lucide-react';

function ChooseUsernameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [username, setUsername] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Auto-suggest handle from user's email or existing metadata
  useEffect(() => {
    async function initUser() {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/login');
          return;
        }

        // Check if user already has a username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.username) {
          // Already chosen, proceed to destination
          router.replace(next);
          return;
        }

        // Auto-extract suggestion from email (e.g. "safalbhujel" or "hantygear")
        const emailPrefix = user.email?.split('@')[0] || '';
        const cleanSuggestion = emailPrefix
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .slice(0, 18);

        if (cleanSuggestion.length >= 3) {
          setUsername(cleanSuggestion);
        }
      } catch (e) {
        console.error('[ChooseUsername] Init error:', e);
      } finally {
        setInitialLoading(false);
      }
    }

    initUser();
  }, [router, next]);

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Force lowercase, remove invalid characters
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(val);
    if (serverError) setServerError(null);
  }

  const isValidLength = username.length >= 3 && username.length <= 20;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidLength) {
      setServerError('Username must be between 3 and 20 characters.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const formData = new FormData();
    formData.append('username', username);
    formData.append('next', next);

    const result = await saveUsername(formData);

    if (result?.error) {
      setServerError(result.error);
      setIsSubmitting(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="w-full max-w-[440px] rounded-3xl border border-border/80 bg-card/80 p-12 text-center text-sm text-muted-foreground shadow-xl backdrop-blur-xl">
        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
        Preparing your explorer profile...
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[440px] rounded-3xl border border-border/80 bg-card/90 p-7 sm:p-9 shadow-2xl shadow-black/[0.04] backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-card/90 dark:shadow-black/40">
      {/* Top subtle golden shimmer line */}
      <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FF8500]/50 to-transparent" />

      {/* ── Brand Header & Logo ───────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center">
        <Link
          href="/"
          className="group mb-4 inline-flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95"
          aria-label="HiddenGems Nepal home"
        >
          <Image
            src="/icons/HiddenGemsNepal_Affinity.svg"
            alt="HiddenGems Nepal"
            width={180}
            height={135}
            priority
            className="h-14 w-auto object-contain drop-shadow-xs dark:hidden"
          />
          <Image
            src="/icons/HiddenGemsNepal_Affinityy.svg"
            alt="HiddenGems Nepal"
            width={180}
            height={135}
            priority
            className="hidden h-14 w-auto object-contain drop-shadow-xs dark:block"
          />
        </Link>

        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" />
          <span>Almost Ready</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Claim Your Handle
        </h1>
        <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
          Choose a unique handle for your discoveries, reviews, and community trails.
        </p>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {serverError && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in-50">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-relaxed">{serverError}</span>
        </div>
      )}

      {/* ── Form Inputs ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="username-input"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Explorer Username
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-4 text-sm font-bold text-muted-foreground">
              <AtSign className="h-4 w-4 text-primary" />
            </span>
            <Input
              id="username-input"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              maxLength={20}
              placeholder="safalbhujel"
              autoComplete="username"
              autoFocus
              disabled={isSubmitting}
              className="h-12 rounded-xl border-border/80 bg-background/70 pl-11 pr-10 text-sm font-semibold tracking-wide text-foreground transition-all duration-150 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:ring-3 focus:ring-primary/15"
            />
            {isValidLength && (
              <span className="pointer-events-none absolute right-3.5 text-emerald-500">
                <Check className="h-4 w-4 stroke-[3]" />
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            3–20 characters. Lowercase letters, numbers, and underscores only.
          </p>
        </div>

        {/* ── Handle Preview Card ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 text-left">
          <p className="text-[11px] font-medium text-muted-foreground">
            Your community identity:
          </p>
          <p className="mt-0.5 text-sm font-bold text-foreground">
            hiddengems.np/@
            <span className="text-primary">{username || 'yourname'}</span>
          </p>
        </div>

        <Button
          type="submit"
          disabled={!isValidLength || isSubmitting}
          className="mt-2 h-12 w-full cursor-pointer rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Setting your handle...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span>Complete & Start Exploring</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </form>
    </div>
  );
}

export default function ChooseUsernamePage() {
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
            Loading explorer identity...
          </div>
        }
      >
        <ChooseUsernameForm />
      </Suspense>
    </div>
  );
}
