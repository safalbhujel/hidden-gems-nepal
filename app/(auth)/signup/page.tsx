'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signup } from '@/app/(auth)/actions';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { GoogleIcon } from '@/components/icons/GoogleIcon';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AlertCircle, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { PasswordlessAuth } from '@/components/auth/PasswordlessAuth';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupForm() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'passcode' | 'password'>('passcode');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  // ── 1. Google OAuth Provider Flow ──────────────────────────────────────────
  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    setServerError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=/profile`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setServerError(error.message);
        setIsGoogleLoading(false);
      }
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Failed to connect to Google authentication.'
      );
      setIsGoogleLoading(false);
    }
  }

  // ── 2. Email & Password Submission ─────────────────────────────────────────
  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true);
    setServerError(null);

    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('password', data.password);

    const result = await signup(formData);

    if (result?.error) {
      setServerError(result.error);
      setIsLoading(false);
    } else {
      router.refresh();
    }
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
          {/* Light Mode SVG */}
          <Image
            src="/icons/HiddenGemsNepal_Affinity.svg"
            alt="HiddenGems Nepal"
            width={180}
            height={135}
            priority
            className="h-14 w-auto object-contain drop-shadow-xs dark:hidden"
          />
          {/* Dark Mode SVG */}
          <Image
            src="/icons/HiddenGemsNepal_Affinityy.svg"
            alt="HiddenGems Nepal"
            width={180}
            height={135}
            priority
            className="hidden h-14 w-auto object-contain drop-shadow-xs dark:block"
          />
        </Link>

        <div className="mb-2 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
          <span>Join The Community</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Begin Your Journey
        </h1>
        <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
          Discover unspoiled places and share your authentic Nepal stories.
        </p>
      </div>

      {/* ── Mode Switcher Segmented Control ─────────────────────────────── */}
      <div className="mt-6 flex rounded-xl bg-muted/80 p-1 border border-border/60">
        <button
          type="button"
          onClick={() => {
            setAuthMode('passcode');
            setServerError(null);
          }}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
            authMode === 'passcode'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Passcode (6-Digit OTP)
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode('password');
            setServerError(null);
          }}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
            authMode === 'password'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Password
        </button>
      </div>

      {authMode === 'passcode' ? (
        <div className="mt-6">
          <PasswordlessAuth defaultMode="signup" onSwitchToPassword={() => setAuthMode('password')} />
        </div>
      ) : (
        <>
          {/* ── Error Banner ─────────────────────────────────────────────────── */}
          {serverError && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in-50">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-relaxed">{serverError}</span>
            </div>
          )}

          {/* ── Social Sign Up (Google OAuth) ─────────────────────────────────── */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              className="group flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border/90 bg-background/80 px-4 text-sm font-medium text-foreground shadow-xs backdrop-blur-md transition-all duration-200 hover:border-border hover:bg-muted/60 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                  <span>Sign up with Google</span>
                </>
              )}
            </button>
          </div>

          {/* ── Hairline Divider ─────────────────────────────────────────────── */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/80" />
            </div>
            <span className="relative bg-card px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
              or sign up with email
            </span>
          </div>

          {/* ── Form Inputs ──────────────────────────────────────────────────── */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sagarmatha Sherpa"
                        autoComplete="name"
                        disabled={isLoading || isGoogleLoading}
                        className="h-12 rounded-xl border-border/80 bg-background/70 px-4 text-sm text-foreground transition-all duration-150 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:ring-3 focus:ring-primary/15"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="explorer@hiddengems.np"
                        type="email"
                        autoComplete="email"
                        disabled={isLoading || isGoogleLoading}
                        className="h-12 rounded-xl border-border/80 bg-background/70 px-4 text-sm text-foreground transition-all duration-150 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:ring-3 focus:ring-primary/15"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Create Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          disabled={isLoading || isGoogleLoading}
                          className="h-12 rounded-xl border-border/80 bg-background/70 pr-11 pl-4 text-sm text-foreground transition-all duration-150 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:ring-3 focus:ring-primary/15"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80 transition-colors hover:text-foreground cursor-pointer"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="mt-2 h-12 w-full cursor-pointer rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating your account...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span>Create Explorer Account</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="mt-7 text-center">
        <p className="text-xs text-muted-foreground sm:text-sm">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-primary transition-colors hover:underline"
          >
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
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
            Loading registration...
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </div>
  );
}
