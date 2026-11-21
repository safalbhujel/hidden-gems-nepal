'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { requestPasswordReset } from '@/app/(auth)/actions';

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
import { AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: ForgotFormValues) {
    setIsLoading(true);
    setServerError(null);

    const formData = new FormData();
    formData.append('email', data.email);

    const result = await requestPasswordReset(formData);

    if (result?.error) {
      setServerError(result.error);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
    }
  }

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
            <span>Account Recovery</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Reset Password
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
            Enter your account email to receive secure reset instructions.
          </p>
        </div>

        {/* ── Error Banner ───────────────────────────────────────────────── */}
        {serverError && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in-50">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="leading-relaxed">{serverError}</span>
          </div>
        )}

        <div className="mt-6">
          {success ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center animate-in fade-in-50">
              <CheckCircle2 className="mx-auto mb-2.5 h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                Check Your Inbox!
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                We&apos;ve sent a password reset link to your email. Click the link in the message to set a new password.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSuccess(false)}
                className="mt-4 rounded-xl border-border text-xs"
              >
                Send to a different email
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          disabled={isLoading}
                          className="h-12 rounded-xl border-border/80 bg-background/70 px-4 text-sm text-foreground transition-all duration-150 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:ring-3 focus:ring-primary/15"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 h-12 w-full cursor-pointer rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending reset link...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span>Send Reset Link</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
            </Form>
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
