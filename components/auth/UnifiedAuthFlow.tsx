'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { sendOtpAction, verifyOtpAction, login } from '@/app/(auth)/actions';

export type AuthFlowView = 'entry' | 'otp' | 'password';

interface UnifiedAuthFlowProps {
  initialView?: AuthFlowView;
  initialEmail?: string;
  defaultMode?: 'login' | 'signup';
}

function formatCooldown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function UnifiedAuthFlow({
  initialView = 'entry',
  initialEmail = '',
}: UnifiedAuthFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom') || '/';
  const urlError = searchParams.get('error');

  // Progressive view state
  const [view, setView] = useState<AuthFlowView>(initialView);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 6-digit OTP segmented state
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Async & feedback state
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(urlError);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (!notificationMsg) return;
    const timer = setTimeout(() => {
      setNotificationMsg(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notificationMsg]);

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus the first empty digit box when switching to OTP view
  useEffect(() => {
    if (view === 'otp') {
      const firstEmpty = digits.findIndex((d) => !d);
      const targetIdx = firstEmpty === -1 ? 0 : firstEmpty;
      const timeout = setTimeout(() => {
        digitRefs.current[targetIdx]?.focus();
        digitRefs.current[targetIdx]?.select();
      }, 120);
      return () => clearTimeout(timeout);
    }
  }, [view, digits]);

  // ── 1. Google OAuth Authentication ─────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(redirectedFrom)}`;

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
        setErrorMsg(error.message);
        setIsGoogleLoading(false);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to connect to Google.');
      setIsGoogleLoading(false);
    }
  };

  // ── 2. Screen 1: Send 6-Digit Email OTP ────────────────────────────────────
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedEmail = email.trim().toLowerCase();
    if (!sanitizedEmail || isPending) return;
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('email', sanitizedEmail);

    startTransition(async () => {
      const res = await sendOtpAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setView('otp');
        setResendCooldown(60);
        setDigits(['', '', '', '', '', '']);
      }
    });
  };

  // ── 3. Screen 2: OTP Digit Micro-Interactions ───────────────────────────────
  const handleDigitChange = (index: number, val: string) => {
    if (errorMsg) setErrorMsg(null);
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const updated = [...digits];
      updated[index] = '';
      setDigits(updated);
      return;
    }

    const char = clean.slice(-1);
    const updated = [...digits];
    updated[index] = char;
    setDigits(updated);

    // Auto advance to next box
    if (index < 5) {
      digitRefs.current[index + 1]?.focus();
      digitRefs.current[index + 1]?.select();
    }

    // Auto submit if all 6 digits are populated
    const fullCode = updated.join('');
    if (fullCode.length === 6 && !updated.includes('')) {
      submitOtpCode(fullCode);
    }
  };

  const handleDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const updated = [...digits];
        updated[index] = '';
        setDigits(updated);
      } else if (index > 0) {
        const updated = [...digits];
        updated[index - 1] = '';
        setDigits(updated);
        digitRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = [...digits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setDigits(updated);

    const targetFocus = Math.min(pasted.length, 5);
    digitRefs.current[targetFocus]?.focus();

    if (pasted.length === 6) {
      submitOtpCode(pasted);
    }
  };

  // ── 4. Verify OTP Code ─────────────────────────────────────────────────────
  const submitOtpCode = (code: string) => {
    if (code.length !== 6 || isPending) return;
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('email', email.trim().toLowerCase());
    formData.append('token', code);
    formData.append('redirectedFrom', redirectedFrom);

    startTransition(async () => {
      const res = await verifyOtpAction(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }
    submitOtpCode(fullCode);
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0 || isPending) return;
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('email', email.trim().toLowerCase());

    startTransition(async () => {
      const res = await sendOtpAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setResendCooldown(60);
        setNotificationMsg({
          type: 'success',
          text: `Fresh 6-digit verification code sent to ${email}`,
        });
      }
    });
  };

  // ── 5. Screen 3: Password Fallback Submission ──────────────────────────────
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isPending) return;
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('email', email.trim().toLowerCase());
    formData.append('password', password);
    formData.append('redirectedFrom', redirectedFrom);

    startTransition(async () => {
      const res = await login(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="relative w-full max-w-[420px] sm:max-w-[440px] rounded-3xl border border-border/80 bg-card/95 p-7 sm:p-9 shadow-2xl shadow-black/[0.04] backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-card/90 dark:shadow-black/40">
      {/* Top subtle golden shimmer line */}
      <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FF8500]/50 to-transparent" />

      {/* ════════════════════════════════════════════════════════════════════════
         SCREEN 1 — ENTRY / EMAIL VIEW (Left Side of Reference Image 1)
         ════════════════════════════════════════════════════════════════════════ */}
      {view === 'entry' && (
        <div className="animate-in fade-in-50 duration-200">
          {/* Brand Header & Logo */}
          <div className="flex flex-col items-center text-center">
            <Link
              href="/"
              className="group mb-4 inline-flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95"
              aria-label="HiddenGems Nepal home"
            >
              <Image
                src="/icons/HiddenGemsNepal_Affinity.svg"
                alt="HiddenGems Nepal"
                width={160}
                height={120}
                priority
                className="h-14 w-auto object-contain drop-shadow-xs dark:hidden"
              />
              <Image
                src="/icons/HiddenGemsNepal_Affinityy.svg"
                alt="HiddenGems Nepal"
                width={160}
                height={120}
                priority
                className="hidden h-14 w-auto object-contain drop-shadow-xs dark:block"
              />
            </Link>

            <div className="mb-2.5 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
              <span>CURATED TRAILGUIDE</span>
            </div>

            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-foreground font-serif leading-tight">
              Discover Nepal’s unseen trails
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-[310px] mx-auto leading-relaxed">
              Sign in or create an account to save trails and share local gems.
            </p>
          </div>

          {/* Success / Info Notification Banner */}
          {notificationMsg && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in-50 duration-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-relaxed font-medium">{notificationMsg.text}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in-50">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-relaxed font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Social Sign In (Google OAuth) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isPending || isGoogleLoading}
            className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-border/80 bg-background/80 px-4 text-sm font-semibold text-foreground shadow-xs transition-all duration-200 hover:border-border hover:bg-muted/60 active:scale-[0.99] disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Hairline Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/70" />
            </div>
            <span className="relative bg-card px-3 text-[11px] font-medium text-muted-foreground/85">
              or continue with email
            </span>
          </div>

          {/* Email Input Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="auth-email-input"
                className="text-xs font-semibold text-foreground/80"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-email-input"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={isPending}
                  className="h-12 rounded-2xl border-border/80 bg-background/70 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending || !email.trim()}
              className="mt-2 h-12 w-full cursor-pointer rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validating & sending code...</span>
                </>
              ) : (
                <>
                  <span>Continue with Email</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Subtle text link at bottom */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setView('password');
              }}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Sign in with password instead
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
         SCREEN 2 — 6-DIGIT OTP VERIFICATION VIEW (Right Side of Image 1)
         ════════════════════════════════════════════════════════════════════════ */}
      {view === 'otp' && (
        <div className="animate-in fade-in-50 duration-200">
          {/* Top-left Back button */}
          <div className="flex items-center justify-start mb-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setView('entry');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          </div>

          {/* Brand Header & Logo */}
          <div className="flex flex-col items-center text-center">
            <Link
              href="/"
              className="group mb-3 inline-flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95"
              aria-label="HiddenGems Nepal home"
            >
              <Image
                src="/icons/HiddenGemsNepal_Affinity.svg"
                alt="HiddenGems Nepal"
                width={150}
                height={110}
                priority
                className="h-12 w-auto object-contain drop-shadow-xs dark:hidden"
              />
              <Image
                src="/icons/HiddenGemsNepal_Affinityy.svg"
                alt="HiddenGems Nepal"
                width={150}
                height={110}
                priority
                className="hidden h-12 w-auto object-contain drop-shadow-xs dark:block"
              />
            </Link>

            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-foreground font-serif leading-tight">
              Check your inbox
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              We sent a 6-digit verification code to
              <br />
              <span className="font-semibold text-foreground">{email}</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setView('entry');
                }}
                className="font-semibold text-primary hover:underline ml-1 cursor-pointer"
              >
                Edit
              </button>
            </p>
          </div>

          {/* Success / Info Notification Banner */}
          {notificationMsg && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in-50 duration-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-relaxed font-medium">{notificationMsg.text}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in-50">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-relaxed font-medium">{errorMsg}</span>
            </div>
          )}

          {/* 6-Digit Segmented Input Boxes: 3 - 3 Grouping */}
          <form onSubmit={handleVerifyOtpSubmit} className="mt-6 space-y-6">
            <div
              className="flex items-center justify-center gap-1.5 sm:gap-2.5"
              onPaste={handleDigitPaste}
            >
              {/* Left group of 3 digits */}
              {[0, 1, 2].map((idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    digitRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digits[idx]}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  disabled={isPending}
                  className="h-14 w-11 sm:h-14 sm:w-12 rounded-2xl border border-border/80 bg-background/80 text-center font-mono text-2xl font-bold text-foreground shadow-xs transition-all duration-150 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:bg-background/60"
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}

              {/* Subtle separator hyphen */}
              <span className="text-muted-foreground/60 font-semibold text-lg select-none px-0.5">
                –
              </span>

              {/* Right group of 3 digits */}
              {[3, 4, 5].map((idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    digitRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digits[idx]}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  disabled={isPending}
                  className="h-14 w-11 sm:h-14 sm:w-12 rounded-2xl border border-border/80 bg-background/80 text-center font-mono text-2xl font-bold text-foreground shadow-xs transition-all duration-150 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:bg-background/60"
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={isPending || digits.join('').length !== 6}
              className="h-12 w-full cursor-pointer rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer: Live resend countdown timer & spam tip */}
          <div className="mt-8 text-center space-y-1">
            {resendCooldown > 0 ? (
              <p className="text-xs text-muted-foreground">
                Didn&apos;t get the code? Resend in{' '}
                <span className="font-mono font-medium text-foreground">
                  {formatCooldown(resendCooldown)}
                </span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Didn&apos;t get the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isPending}
                  className="font-semibold text-primary hover:underline cursor-pointer"
                >
                  Resend
                </button>
              </p>
            )}
            <p className="text-[11px] text-muted-foreground/75">
              Check your spam folder if it doesn&apos;t appear.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
         SCREEN 3 — PASSWORD FALLBACK VIEW (Reference Image 2)
         ════════════════════════════════════════════════════════════════════════ */}
      {view === 'password' && (
        <div className="animate-in fade-in-50 duration-200">
          {/* Top-left Back button */}
          <div className="flex items-center justify-start mb-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setView('entry');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          </div>

          {/* Brand Header & Logo */}
          <div className="flex flex-col items-center text-center">
            <Link
              href="/"
              className="group mb-3 inline-flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95"
              aria-label="HiddenGems Nepal home"
            >
              <Image
                src="/icons/HiddenGemsNepal_Affinity.svg"
                alt="HiddenGems Nepal"
                width={150}
                height={110}
                priority
                className="h-12 w-auto object-contain drop-shadow-xs dark:hidden"
              />
              <Image
                src="/icons/HiddenGemsNepal_Affinityy.svg"
                alt="HiddenGems Nepal"
                width={150}
                height={110}
                priority
                className="hidden h-12 w-auto object-contain drop-shadow-xs dark:block"
              />
            </Link>

            <div className="mb-2.5 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
              <span>CURATED TRAILGUIDE</span>
            </div>

            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-foreground font-serif leading-tight">
              Welcome back, explorer
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-[310px] mx-auto leading-relaxed">
              Please enter your password to access your curated gems.
            </p>
          </div>

          {/* Success / Info Notification Banner */}
          {notificationMsg && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in-50 duration-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-relaxed font-medium">{notificationMsg.text}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in-50">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-relaxed font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            {/* Read-only / Pre-filled Email field with inline Edit button */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password-email-field"
                  className="text-xs font-semibold text-foreground/80"
                >
                  Email address
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setView('entry');
                  }}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password-email-field"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={isPending}
                  className="h-12 rounded-2xl border-border/80 bg-muted/40 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </div>
            </div>

            {/* Password input with show/hide toggle and Forgot password link */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="auth-password-input"
                  className="text-xs font-semibold text-foreground/80"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center gap-1 text-xs font-medium text-foreground/75 hover:text-primary transition-colors"
                >
                  <span>Forgot password?</span>
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  className="h-12 rounded-2xl border-border/80 bg-background/70 pl-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending || !password}
              className="mt-2 h-12 w-full cursor-pointer rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Bottom link to switch back to OTP code */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setView('entry');
              }}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Use a 6-digit email code instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
