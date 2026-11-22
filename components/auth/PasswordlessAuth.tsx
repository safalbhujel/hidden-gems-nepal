'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  KeyRound,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendOtpAction, verifyOtpAction } from '@/app/(auth)/actions';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface PasswordlessAuthProps {
  defaultMode?: 'login' | 'signup';
  onSwitchToPassword?: () => void;
}

export function PasswordlessAuth({
  onSwitchToPassword,
}: PasswordlessAuthProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom') || '/';

  // Step state: 1 = Email Input, 2 = 6-digit OTP verification
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus OTP input on Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }
  }, [step]);

  // ── Step 1: Send OTP to Email ─────────────────────────────────────────────
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('email', email);

    startTransition(async () => {
      const res = await sendOtpAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setStep(2);
        setResendCooldown(60);
        setSuccessMsg(`A 6-digit verification code has been dispatched to ${email}`);
      }
    });
  };

  // ── Step 2: Verify 6-digit OTP ───────────────────────────────────────────
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (otpToken.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('token', otpToken);
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

  // ── Resend Code Handler ──────────────────────────────────────────────────
  const handleResendCode = () => {
    if (resendCooldown > 0 || isPending) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('email', email);

    startTransition(async () => {
      const res = await sendOtpAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setResendCooldown(60);
        setSuccessMsg('Fresh 6-digit verification code sent.');
      }
    });
  };

  // ── Google 1-Tap OAuth Fallback ──────────────────────────────────────────
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

  return (
    <div className="space-y-6">
      {/* Feedback Toast / Alert Banner */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/25 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in-50 duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in-50 duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{successMsg}</span>
        </div>
      )}

      {step === 1 ? (
        /* ══════════════════════════════════════════════════════════════════════
           STEP 1: Email Entry (Protected against Burners)
           ══════════════════════════════════════════════════════════════════════ */
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Email Address <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                disabled={isPending}
                className="pl-10 h-11 rounded-xl border-border bg-background/60 text-sm focus:border-primary focus:ring-primary/20"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              We will send a 6-digit one-time passcode. No password needed.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isPending || !email.trim()}
            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md transition-all active:scale-[0.98] gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking domain & sending code…</span>
              </>
            ) : (
              <>
                <span>Continue with Passcode</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          {/* Social Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-border/80" />
            <span className="absolute bg-card px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              or
            </span>
          </div>

          {/* Google 1-Tap Option */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isPending}
            className="w-full h-11 rounded-xl border-border/80 bg-background/50 hover:bg-muted font-semibold text-xs transition-all gap-2.5 cursor-pointer"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="h-4 w-4 shrink-0" />
            )}
            <span>Continue with Google</span>
          </Button>

          {/* Fallback to Password if enabled */}
          {onSwitchToPassword && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onSwitchToPassword}
                className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Prefer password? <span className="underline font-semibold">Sign in with password</span>
              </button>
            </div>
          )}
        </form>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════
           STEP 2: 6-Digit Passcode Verification
           ══════════════════════════════════════════════════════════════════════ */
        <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in-50 duration-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                6-Digit Verification Code
              </label>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtpToken('');
                  setErrorMsg(null);
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
                className="pl-10 h-12 text-center font-mono text-xl tracking-[0.35em] font-bold rounded-xl border-border bg-background/60 focus:border-primary focus:ring-primary/20"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Passcode dispatched to <strong className="text-foreground">{email}</strong>. Check spam if not in inbox.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isPending || otpToken.length !== 6}
            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md transition-all active:scale-[0.98] gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Verify & Enter</span>
              </>
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
    </div>
  );
}
