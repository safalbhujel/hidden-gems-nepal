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
  Clipboard,
  AtSign,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  login,
  sendSignupOtpAction,
  verifyAndCompleteSignupAction,
} from '@/app/(auth)/actions';

export type AuthMode = 'login' | 'signup';

export type AuthFlowView =
  | 'login-credentials'
  | 'signup-form'
  | 'signup-otp'
  | 'entry'
  | 'otp'
  | 'password';

interface UnifiedAuthFlowProps {
  initialView?: AuthFlowView;
  initialEmail?: string;
  defaultMode?: AuthMode;
}

function formatCooldown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function UnifiedAuthFlow({
  initialView,
  initialEmail = '',
  defaultMode = 'login',
}: UnifiedAuthFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom') || '/';
  const urlError = searchParams.get('error');

  // Active Mode: 'login' (Sign In) vs 'signup' (Sign Up)
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  // Compute initial view based on defaultMode
  const computeInitialView = (): AuthFlowView => {
    if (initialView) {
      if (initialView === 'entry') {
        return defaultMode === 'signup' ? 'signup-form' : 'login-credentials';
      }
      if (initialView === 'otp') {
        return 'signup-otp';
      }
      if (initialView === 'password') {
        return 'login-credentials';
      }
      return initialView;
    }
    return defaultMode === 'signup' ? 'signup-form' : 'login-credentials';
  };

  const [view, setView] = useState<AuthFlowView>(computeInitialView);

  // Form Fields State
  const [email, setEmail] = useState(initialEmail);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 6-digit OTP segmented state
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Async & feedback state
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(urlError);
  const [notificationMsg, setNotificationMsg] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeCopied, setCodeCopied] = useState(false);

  // Auto-dismiss notification after 4.5 seconds
  useEffect(() => {
    if (!notificationMsg) return;
    const timer = setTimeout(() => {
      setNotificationMsg(null);
    }, 4500);
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
    if (view === 'signup-otp' || view === 'otp') {
      const firstEmpty = digits.findIndex((d) => !d);
      const targetIdx = firstEmpty === -1 ? 0 : firstEmpty;
      const timeout = setTimeout(() => {
        digitRefs.current[targetIdx]?.focus();
        digitRefs.current[targetIdx]?.select();
      }, 120);
      return () => clearTimeout(timeout);
    }
  }, [view, digits]);

  // Switch between Sign In and Sign Up modes cleanly
  const switchMode = (newMode: AuthMode) => {
    setErrorMsg(null);
    setNotificationMsg(null);
    setMode(newMode);
    if (newMode === 'login') {
      setView('login-credentials');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/login');
      }
    } else {
      setView('signup-form');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/signup');
      }
    }
  };

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

  // ── 2. Sign In: Direct Email + Password Login ──────────────────────────────
  const handlePasswordLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedEmail = email.trim().toLowerCase();
    if (!sanitizedEmail || !password || isPending) return;
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('email', sanitizedEmail);
    formData.append('password', password);
    formData.append('redirectedFrom', redirectedFrom);

    startTransition(async () => {
      // 1. Establish browser session directly for instant reactive UI
      const supabase = createSupabaseBrowserClient();
      const { data: browserAuth, error: browserError } =
        await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password,
        });

      if (browserError) {
        setErrorMsg(browserError.message);
        return;
      }

      // 2. Fetch profile data immediately to cache and broadcast
      let activeUsername =
        browserAuth.user?.user_metadata?.username || sanitizedEmail.split('@')[0];
      let activeAvatar = '/avatars/snow-leopard.svg';

      if (browserAuth.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', browserAuth.user.id)
          .maybeSingle();

        if (profile?.username) {
          activeUsername = profile.username;
        }
        if (profile?.avatar_url) {
          activeAvatar = profile.avatar_url;
        }
      }

      const cachedUser = { username: activeUsername, avatarUrl: activeAvatar };
      try {
        localStorage.setItem('hgn_cached_user', JSON.stringify(cachedUser));
        sessionStorage.setItem('hgn_cached_user', JSON.stringify(cachedUser));
      } catch {}
      window.dispatchEvent(
        new CustomEvent('hgn:auth-state-changed', { detail: cachedUser })
      );

      // 3. Run server action to synchronize HTTP cookies
      await login(formData);

      // 4. Redirect to home page with welcome animation trigger
      const targetUrl =
        redirectedFrom &&
        redirectedFrom.startsWith('/') &&
        !redirectedFrom.startsWith('//') &&
        redirectedFrom !== '/' &&
        redirectedFrom !== '/login' &&
        redirectedFrom !== '/signup'
          ? `${redirectedFrom}${redirectedFrom.includes('?') ? '&' : '?'}welcome=1&user=${encodeURIComponent(activeUsername)}`
          : `/?welcome=1&user=${encodeURIComponent(activeUsername)}`;

      router.push(targetUrl);
      router.refresh();
    });
  };

  // ── 3. Sign Up: Submit Registration Form (Email + Handle + Password) ───────
  const handleSignupFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    if (!sanitizedEmail || !cleanUsername || !password || isPending) return;
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setErrorMsg(
        'Username must be 3-20 characters long and contain only lowercase letters, numbers, and underscores (_).'
      );
      return;
    }

    const formData = new FormData();
    formData.append('email', sanitizedEmail);
    formData.append('username', cleanUsername);
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);
    if (fullName.trim()) formData.append('fullName', fullName.trim());

    startTransition(async () => {
      try {
        const res = await sendSignupOtpAction(formData);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setView('signup-otp');
          setResendCooldown(60);
          setDigits(['', '', '', '', '', '']);
          setNotificationMsg({
            type: 'success',
            text: 'Verification code sent. Check your inbox.',
          });
        }
      } catch {
        setErrorMsg("We couldn't connect. Check your internet and try again.");
      }
    });
  };

  // ── 4. OTP Digit Micro-Interactions ─────────────────────────────────────────
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

  // ── 5. Submit 6-Digit OTP to Complete Registration ─────────────────────────
  const submitOtpCode = (code: string) => {
    if (code.length !== 6 || isPending) return;
    setErrorMsg(null);

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    const formData = new FormData();
    formData.append('email', email.trim().toLowerCase());
    formData.append('token', code);
    formData.append('password', password);
    formData.append('username', cleanUsername);
    if (fullName.trim()) formData.append('fullName', fullName.trim());
    formData.append('redirectedFrom', redirectedFrom);

    startTransition(async () => {
      try {
        const res = await verifyAndCompleteSignupAction(formData);
        if (res?.error) {
          setErrorMsg(res.error);
        } else {
          setNotificationMsg({
            type: 'success',
            text: 'Email verified. Welcome to HiddenGems Nepal!',
          });

          const cleanUser = cleanUsername || email.trim().toLowerCase().split('@')[0];
          const cachedUser = {
            username: cleanUser,
            avatarUrl: '/avatars/snow-leopard.svg',
          };
          try {
            localStorage.setItem('hgn_cached_user', JSON.stringify(cachedUser));
            sessionStorage.setItem('hgn_cached_user', JSON.stringify(cachedUser));
          } catch {}
          window.dispatchEvent(
            new CustomEvent('hgn:auth-state-changed', { detail: cachedUser })
          );

          const targetUrl =
            redirectedFrom &&
            redirectedFrom.startsWith('/') &&
            !redirectedFrom.startsWith('//') &&
            redirectedFrom !== '/' &&
            redirectedFrom !== '/login' &&
            redirectedFrom !== '/signup'
              ? `${redirectedFrom}${redirectedFrom.includes('?') ? '&' : '?'}welcome=1&user=${encodeURIComponent(cleanUser)}`
              : `/?welcome=1&user=${encodeURIComponent(cleanUser)}`;
          router.push(targetUrl);
          router.refresh();
        }
      } catch {
        setErrorMsg("We couldn't connect. Check your internet and try again.");
      }
    });
  };

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Enter your 6-digit verification code.');
      return;
    }
    submitOtpCode(fullCode);
  };

  // Meta-style "Copy code" feature
  const handleCopyOtpCode = async () => {
    const fullCode = digits.join('');
    if (!fullCode) return;
    try {
      await navigator.clipboard.writeText(fullCode);
      setCodeCopied(true);
      setNotificationMsg({
        type: 'info',
        text: 'Verification code copied to clipboard.',
      });
      setTimeout(() => setCodeCopied(false), 2200);
    } catch {
      setCodeCopied(false);
    }
  };

  // Paste from clipboard helper
  const handlePasteFromClipboard = async () => {
    setErrorMsg(null);
    try {
      const text = await navigator.clipboard.readText();
      const clean = text.replace(/\D/g, '').slice(0, 6);
      if (!clean) {
        setErrorMsg('No 6-digit code found on clipboard.');
        return;
      }
      const updated = ['', '', '', '', '', ''];
      for (let i = 0; i < 6; i++) {
        updated[i] = clean[i] || '';
      }
      setDigits(updated);
      setNotificationMsg({
        type: 'info',
        text: 'Verification code pasted.',
      });

      if (clean.length === 6) {
        submitOtpCode(clean);
      } else {
        const targetFocus = Math.min(clean.length, 5);
        digitRefs.current[targetFocus]?.focus();
      }
    } catch {
      setErrorMsg('Unable to access clipboard. Please paste into the boxes directly.');
    }
  };

  // Resend OTP handler
  const handleResendOtp = () => {
    if (resendCooldown > 0) {
      setNotificationMsg({
        type: 'info',
        text: 'Please wait before requesting another code.',
      });
      return;
    }
    if (isPending) return;
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('email', email.trim().toLowerCase());
    formData.append('username', username.trim().toLowerCase().replace(/^@/, ''));
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);

    startTransition(async () => {
      try {
        const res = await sendSignupOtpAction(formData);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setResendCooldown(60);
          setNotificationMsg({
            type: 'success',
            text: 'A fresh verification code is on its way.',
          });
        }
      } catch {
        setErrorMsg("We couldn't connect. Check your internet and try again.");
      }
    });
  };

  return (
    <div
      role="region"
      aria-label={mode === 'signup' ? 'Explorer Sign Up' : 'Explorer Sign In'}
      className="relative w-full max-w-[420px] sm:max-w-[460px] rounded-3xl border border-border/80 bg-card/95 p-7 sm:p-9 shadow-2xl shadow-black/[0.04] backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-card/90 dark:shadow-black/40"
    >
      {/* Top subtle golden shimmer line */}
      <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FF8500]/50 to-transparent" />

      {/* ════════════════════════════════════════════════════════════════════════
         VIEW 1: SIGN IN — DIRECT EMAIL + PASSWORD (Instant Login)
         ════════════════════════════════════════════════════════════════════════ */}
      {view === 'login-credentials' && (
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
              <span>NEPAL TRAVEL GUIDE</span>
            </div>

            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-foreground font-serif leading-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
              Sign in with your email and password to see your saved places.
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
              <div className="leading-relaxed font-medium">
                <p>{errorMsg}</p>
                {errorMsg.toLowerCase().includes('forgot password') && (
                  <Link
                    href="/forgot-password"
                    className="mt-1.5 inline-block text-[11px] font-bold text-primary hover:underline"
                  >
                    Reset your password with a 6-digit code →
                  </Link>
                )}
              </div>
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
              or sign in with password
            </span>
          </div>

          {/* Email + Password Form */}
          <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="login-email-input"
                className="text-xs font-semibold text-foreground/80"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email-input"
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

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password-input"
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
                  id="login-password-input"
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
              disabled={isPending || !email.trim() || !password}
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

          {/* Mode Switcher Footer */}
          <div className="mt-7 border-t border-border/70 pt-5 text-center">
            <p className="text-xs text-muted-foreground">
              New to HiddenGems Nepal?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-semibold text-primary hover:underline cursor-pointer"
              >
                Create an account →
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
         VIEW 2: SIGN UP — STEP 1: REGISTRATION FORM (Email, Handle, Password)
         Flow: email -> password & confirm password -> validate OTP
         ════════════════════════════════════════════════════════════════════════ */}
      {view === 'signup-form' && (
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
              <span>CREATE AN ACCOUNT</span>
            </div>

            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-foreground font-serif leading-tight">
              Create your account
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
              Choose a username and password, then confirm your email with a 6-digit code.
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
              <div className="leading-relaxed font-medium">
                <p>{errorMsg}</p>
                {errorMsg.toLowerCase().includes('already registered') && (
                  <div className="mt-1.5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Sign In with Password →
                    </button>
                    <span className="text-muted-foreground/60 text-[10px]">·</span>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Sign Up (Google OAuth) */}
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
                <span>Sign up with Google</span>
              </>
            )}
          </button>

          {/* Hairline Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/70" />
            </div>
            <span className="relative bg-card px-3 text-[11px] font-medium text-muted-foreground/85">
              or register with email
            </span>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSignupFormSubmit} className="space-y-3.5">
            {/* Full Name (Optional) */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="signup-fullname-input"
                className="text-xs font-semibold text-foreground/80 flex items-center justify-between"
              >
                <span>Full Name</span>
                <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
              </label>
              <Input
                id="signup-fullname-input"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                disabled={isPending}
                className="h-11 rounded-2xl border-border/80 bg-background/70 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </div>

            {/* Explorer Handle (@username) */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="signup-handle-input"
                className="text-xs font-semibold text-foreground/80"
              >
                Username (@handle)
              </label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-handle-input"
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. safal_travels"
                  disabled={isPending}
                  className="h-11 rounded-2xl border-border/80 bg-background/70 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="signup-email-input"
                className="text-xs font-semibold text-foreground/80"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-email-input"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={isPending}
                  className="h-11 rounded-2xl border-border/80 bg-background/70 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="signup-password-input"
                className="text-xs font-semibold text-foreground/80"
              >
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <Input
                  id="signup-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  className="h-11 rounded-2xl border-border/80 bg-background/70 pl-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="signup-confirm-password-input"
                className="text-xs font-semibold text-foreground/80"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="signup-confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isPending}
                  className="h-11 rounded-2xl border-border/80 bg-background/70 pl-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending || !email.trim() || !username.trim() || !password || !confirmPassword}
              className="mt-3 h-12 w-full cursor-pointer rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validating details & sending code...</span>
                </>
              ) : (
                <>
                  <span>Continue to Verification</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Mode Switcher Footer */}
          <div className="mt-7 border-t border-border/70 pt-5 text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-semibold text-primary hover:underline cursor-pointer"
              >
                Sign in →
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
         VIEW 3: SIGN UP — STEP 2: VALIDATE 6-DIGIT OTP
         Includes Meta-style Code Requested Box with Copy & Paste
         ════════════════════════════════════════════════════════════════════════ */}
      {(view === 'signup-otp' || view === 'otp') && (
        <div className="animate-in fade-in-50 duration-200">
          {/* Top-left Back button */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setView('signup-form');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
              Verification
            </span>
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
                  setView('signup-form');
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

          {/* ── Meta-Style Code Requested Card ────────────────────────────── */}
          <div className="mt-5 rounded-2xl border border-border/80 bg-muted/40 p-4 text-center space-y-3 dark:bg-muted/20">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Code Requested
            </p>
            {/* 6 Digit Display Preview */}
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex h-10 w-9 sm:h-11 sm:w-10 items-center justify-center rounded-xl border border-border/80 bg-background/90 font-mono text-base font-bold text-foreground shadow-xs"
                >
                  {digits[i] ? digits[i] : '·'}
                </div>
              ))}
            </div>

            {/* Copy / Paste Action Buttons */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyOtpCode}
                disabled={!digits.some((d) => d)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-4 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition cursor-pointer active:scale-95 disabled:opacity-40"
              >
                {codeCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Code copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy code</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border/80 px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer active:scale-95 shadow-xs"
              >
                <Clipboard className="h-3.5 w-3.5 text-primary" />
                <span>Paste from clipboard</span>
              </button>
            </div>
          </div>

          {/* 6-Digit Segmented Input Boxes: 3 - 3 Grouping */}
          <form onSubmit={handleVerifyOtpSubmit} className="mt-5 space-y-5">
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
                  <span>Verifying code & completing registration...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Finish</span>
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
    </div>
  );
}

export default UnifiedAuthFlow;
