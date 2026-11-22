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
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step state: 1 = Email Input, 2 = 6-digit OTP + New Password, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus OTP on Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }
  }, [step]);

  // ── Step 1: Send Password Reset OTP ──────────────────────────────────────
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('email', email);

    startTransition(async () => {
      const res = await sendPasswordResetOtpAction(formData);
      if (res.error) {
        setServerError(res.error);
      } else {
        setStep(2);
        setResendCooldown(60);
        setSuccessMsg(`A 6-digit verification code was dispatched to ${email}`);
      }
    });
  };

  // ── Step 2: Verify OTP & Update Password ─────────────────────────────────
  const handleVerifyAndUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMsg(null);

    if (otpToken.length !== 6) {
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
    formData.append('email', email);
    formData.append('token', otpToken);
    formData.append('newPassword', newPassword);
    formData.append('confirmPassword', confirmPassword);

    startTransition(async () => {
      const res = await verifyOtpAndSetPasswordAction(formData);
      if (res?.error) {
        setServerError(res.error);
      } else {
        setStep(3);
      }
    });
  };

  // ── Resend Handler ───────────────────────────────────────────────────────
  const handleResendCode = () => {
    if (resendCooldown > 0 || isPending) return;
    setServerError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('email', email);

    startTransition(async () => {
      const res = await sendPasswordResetOtpAction(formData);
      if (res.error) {
        setServerError(res.error);
      } else {
        setResendCooldown(60);
        setSuccessMsg('Fresh 6-digit verification code sent.');
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

      <div className="relative w-full max-w-[440px] rounded-3xl border border-border/80 bg-card/90 p-7 sm:p-9 shadow-2xl shadow-black/[0.04] backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-card/90 dark:shadow-black/40">
        {/* Top subtle golden shimmer line */}
        <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FF8500]/50 to-transparent" />

        {/* ── Brand Header & Logo ─────────────────────────────────────────── */}
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

          <div className="mb-2 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
            <span>Passcode Verification</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {step === 3 ? 'Password Updated' : 'Reset Password'}
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
            {step === 1 && 'Enter your registered email to receive a secure 6-digit confirmation code.'}
            {step === 2 && 'Enter the 6-digit passcode sent to your inbox and define your new password.'}
            {step === 3 && 'Your account password has been safely updated with OTP confirmation.'}
          </p>
        </div>

        {/* ── Error Banner ───────────────────────────────────────────────── */}
        {serverError && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in-50">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="leading-relaxed font-medium">{serverError}</span>
          </div>
        )}

        {/* ── Success Banner (Step 2) ────────────────────────────────────── */}
        {successMsg && step === 2 && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in-50">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="leading-relaxed font-medium">{successMsg}</span>
          </div>
        )}

        <div className="mt-6">
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="explorer@hiddengems.np"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                    className="h-12 pl-10 rounded-xl border-border/80 bg-background/70 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:ring-3 focus:ring-primary/15"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Disposable and burner email providers are rejected automatically.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isPending || !email.trim()}
                className="mt-2 h-12 w-full cursor-pointer rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Validating & sending code...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span>Send 6-Digit Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyAndUpdatePassword} className="space-y-4 animate-in fade-in-50">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    6-Digit Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtpToken('');
                      setServerError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Change email
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpToken}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpToken(cleaned);
                    }}
                    placeholder="000000"
                    disabled={isPending}
                    className="h-12 pl-10 text-center font-mono text-lg tracking-[0.35em] font-bold rounded-xl border-border/80 bg-background/70 focus:border-primary focus:bg-background focus:ring-3 focus:ring-primary/15"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isPending}
                    className="h-12 rounded-xl border-border/80 bg-background/70 pr-11 pl-4 text-sm text-foreground focus:border-primary focus:bg-background focus:ring-3 focus:ring-primary/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isPending}
                    className="h-12 rounded-xl border-border/80 bg-background/70 pr-11 pl-4 text-sm text-foreground focus:border-primary focus:bg-background focus:ring-3 focus:ring-primary/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending || otpToken.length !== 6 || !newPassword || !confirmPassword}
                className="mt-2 h-12 w-full cursor-pointer rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying code & updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span>Confirm & Update Password</span>
                  </div>
                )}
              </Button>

              {/* Resend Cooldown Counter */}
              <div className="flex items-center justify-center pt-2">
                {resendCooldown > 0 ? (
                  <span className="text-xs text-muted-foreground font-mono">
                    Resend code in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Didn&apos;t receive code? Resend</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center animate-in fade-in-50 space-y-4">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Password Updated Successfully
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Your identity has been verified via email OTP and your password has been securely reset.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => router.push('/login')}
                className="h-11 w-full rounded-xl bg-primary font-semibold text-sm cursor-pointer shadow-md"
              >
                Continue to Sign In
              </Button>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="mt-7 text-center">
          <p className="text-xs text-muted-foreground sm:text-sm">
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-semibold text-primary transition-colors hover:underline"
            >
              Back to sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
