'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  sendPasswordResetOtpAction,
  verifyOtpAndSetPasswordAction,
} from '@/app/(auth)/actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Mail,
  Eye,
  EyeOff,
  Clipboard,
  Copy,
  Check,
} from 'lucide-react';

function formatCooldown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step state: 1 = Email Input, 2 = 6-digit OTP + New Password
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 6-digit OTP segmented state
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeCopied, setCodeCopied] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus the first empty digit box when switching to Step 2
  useEffect(() => {
    if (step === 2) {
      const firstEmpty = digits.findIndex((d) => !d);
      const targetIdx = firstEmpty === -1 ? 0 : firstEmpty;
      const timeout = setTimeout(() => {
        digitRefs.current[targetIdx]?.focus();
        digitRefs.current[targetIdx]?.select();
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [step, digits]);

  // ── Step 1: Send Password Reset OTP ──────────────────────────────────────
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedEmail = email.trim().toLowerCase();
    if (!sanitizedEmail || isPending) return;

    setServerError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('email', sanitizedEmail);

    startTransition(async () => {
      try {
        const res = await sendPasswordResetOtpAction(formData);
        if (res.error) {
          setServerError(res.error);
        } else {
          setStep(2);
          setResendCooldown(60);
          setDigits(['', '', '', '', '', '']);
          setSuccessMsg(`A 6-digit verification code was dispatched to ${sanitizedEmail}`);
        }
      } catch {
        setServerError("We couldn't connect. Check your internet and try again.");
      }
    });
  };

  // ── Step 2: OTP Digit Micro-Interactions ─────────────────────────────────
  const handleDigitChange = (index: number, val: string) => {
    if (serverError) setServerError(null);
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

    // Auto-advance to next box
    if (index < 5) {
      digitRefs.current[index + 1]?.focus();
      digitRefs.current[index + 1]?.select();
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
  };

  // Meta-style "Copy code" feature
  const handleCopyOtpCode = async () => {
    const fullCode = digits.join('');
    if (!fullCode) return;
    try {
      await navigator.clipboard.writeText(fullCode);
      setCodeCopied(true);
      setSuccessMsg('Verification code copied to clipboard.');
      setTimeout(() => setCodeCopied(false), 2200);
    } catch {
      setCodeCopied(false);
    }
  };

  // Paste from clipboard helper
  const handlePasteFromClipboard = async () => {
    setServerError(null);
    try {
      const text = await navigator.clipboard.readText();
      const clean = text.replace(/\D/g, '').slice(0, 6);
      if (!clean) {
        setServerError('No 6-digit code found on clipboard.');
        return;
      }
      const updated = ['', '', '', '', '', ''];
      for (let i = 0; i < 6; i++) {
        updated[i] = clean[i] || '';
      }
      setDigits(updated);
      setSuccessMsg('Verification code pasted from clipboard.');

      const targetFocus = Math.min(clean.length, 5);
      digitRefs.current[targetFocus]?.focus();
    } catch {
      setServerError('Unable to access clipboard. Please paste into the boxes directly.');
    }
  };

  // ── Step 2: Verify OTP & Reset Password ──────────────────────────────────
  const handleVerifyAndUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMsg(null);

    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setServerError('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setServerError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setServerError('Passwords do not match.');
      return;
    }

    const formData = new FormData();
    formData.append('email', email.trim().toLowerCase());
    formData.append('token', fullCode);
    formData.append('newPassword', newPassword);
    formData.append('confirmPassword', confirmPassword);

    startTransition(async () => {
      try {
        const res = await verifyOtpAndSetPasswordAction(formData);
        if (res?.error) {
          setServerError(res.error);
        } else {
          // Immediately redirect to /profile on success!
          router.push('/profile');
          router.refresh();
        }
      } catch {
        // If redirect throws NEXT_REDIRECT, navigate to /profile
        router.push('/profile');
        router.refresh();
      }
    });
  };

  // ── Resend Code Handler ──────────────────────────────────────────────────
  const handleResendCode = () => {
    if (resendCooldown > 0 || isPending) return;
    setServerError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('email', email.trim().toLowerCase());

    startTransition(async () => {
      try {
        const res = await sendPasswordResetOtpAction(formData);
        if (res.error) {
          setServerError(res.error);
        } else {
          setResendCooldown(60);
          setSuccessMsg('A fresh 6-digit recovery code is on its way.');
        }
      } catch {
        setServerError("We couldn't connect. Check your internet and try again.");
      }
    });
  };

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6">
      {/* Ambient warm glow in background */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -z-10 h-[360px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF8500]/8 blur-[100px] dark:bg-[#FF8500]/12"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[420px] sm:max-w-[460px] rounded-3xl border border-border/80 bg-card/95 p-7 sm:p-9 shadow-2xl shadow-black/[0.04] backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-card/90 dark:shadow-black/40">
        {/* Top subtle golden shimmer line */}
        <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FF8500]/50 to-transparent" />

        {/* ════════════════════════════════════════════════════════════════════
           STEP 1: ENTER EMAIL FOR PASSWORD RESET
           ════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="animate-in fade-in-50 duration-200">
            {/* Top Brand Header & Logo */}
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
                <span>ACCOUNT RECOVERY</span>
              </div>

              <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-foreground font-serif leading-tight">
                Reset your password
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
                Enter your email address to receive a 6-digit recovery code.
              </p>
            </div>

            {/* Error Banner */}
            {serverError && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in-50">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-relaxed font-medium">{serverError}</span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="forgot-email-input"
                  className="text-xs font-semibold text-foreground/80"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email-input"
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
                    <span>Sending recovery code...</span>
                  </>
                ) : (
                  <>
                    <span>Send 6-Digit Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Back to Sign In Link */}
            <div className="mt-7 border-t border-border/70 pt-5 text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-primary hover:underline"
              >
                ← Back to Sign In
              </Link>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
           STEP 2: VALIDATE 6-DIGIT OTP & DEFINE NEW PASSWORD
           ════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="animate-in fade-in-50 duration-200">
            {/* Top-left Back button */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setServerError(null);
                  setSuccessMsg(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                Step 2 of 2
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
                We sent a 6-digit recovery code to
                <br />
                <span className="font-semibold text-foreground">{email}</span>{' '}
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setServerError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-semibold text-primary hover:underline ml-1 cursor-pointer"
                >
                  Edit
                </button>
              </p>
            </div>

            {/* Success Banner */}
            {successMsg && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in-50">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-relaxed font-medium">{successMsg}</span>
              </div>
            )}

            {/* Error Banner */}
            {serverError && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in-50">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-relaxed font-medium">{serverError}</span>
              </div>
            )}

            {/* ── Meta-Style Code Requested Card ────────────────────────────── */}
            <div className="mt-5 rounded-2xl border border-border/80 bg-muted/40 p-4 text-center space-y-3 dark:bg-muted/20">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Code Requested
              </p>
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

              {/* Copy / Paste Actions */}
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
            <form onSubmit={handleVerifyAndUpdatePassword} className="mt-5 space-y-4">
              <div
                className="flex items-center justify-center gap-1.5 sm:gap-2.5"
                onPaste={handleDigitPaste}
              >
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

                <span className="text-muted-foreground/60 font-semibold text-lg select-none px-0.5">
                  –
                </span>

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

              {/* New Password */}
              <div className="space-y-1.5 text-left pt-1">
                <label
                  htmlFor="reset-new-password"
                  className="text-xs font-semibold text-foreground/80"
                >
                  New Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                  htmlFor="reset-confirm-password"
                  className="text-xs font-semibold text-foreground/80"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    id="reset-confirm-password"
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
                disabled={isPending || digits.join('').length !== 6 || !newPassword || !confirmPassword}
                className="mt-3 h-12 w-full cursor-pointer rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying code & resetting password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password & Sign In</span>
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
                    onClick={handleResendCode}
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
    </div>
  );
}
