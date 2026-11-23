// app/admin/login/page.tsx

'use client';

import { useActionState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, Lock, ArrowRight, AlertCircle, KeyRound, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loginAdminAction, type AdminAuthResult } from '@/lib/admin/auth-actions';

interface AdminLoginPageProps {
  searchParams: Promise<{ redirectedFrom?: string }>;
}

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const resolvedSearchParams = use(searchParams);
  const redirectedFrom = resolvedSearchParams.redirectedFrom || '/admin/dashboard';

  const [state, formAction, isPending] = useActionState<AdminAuthResult | null, FormData>(
    loginAdminAction,
    null
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] px-4 py-12 selection:bg-[#C85A32]/20 selection:text-[#C85A32]">
      {/* Subtle warm ambient backdrop glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C85A32]/5 blur-[120px]"
        aria-hidden="true"
      />

      <div className="w-full max-w-[420px]">
        {/* ── Brand Logo Header ───────────────────────────────────────── */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="group mb-5 transition-transform duration-200 hover:scale-[1.02]">
            <Image
              src="/icons/HiddenGemsNepal_Affinity.svg"
              alt="HiddenGems Nepal"
              width={160}
              height={120}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5E0] bg-white px-3 py-1 shadow-sm">
            <Shield className="h-3.5 w-3.5 text-[#C85A32]" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#1A1A1A]">
              Restricted Terminal
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#1A1A1A]">
            Admin Authentication
          </h1>
          <p className="mt-1.5 text-xs text-[#6B6B6B]">
            Authorized personnel only. Please sign in to access the moderation console.
          </p>
        </div>

        {/* ── Login Card ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#E8E5E0] bg-white p-7 shadow-sm">
          {state?.error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="leading-relaxed font-medium">{state.error}</p>
            </div>
          )}

          <form action={formAction} className="space-y-4.5">
            <input type="hidden" name="redirectedFrom" value={redirectedFrom} />

            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
              >
                Admin Identifier
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoFocus
                  defaultValue="admin"
                  placeholder="admin"
                  autoComplete="username"
                  className="h-11 w-full rounded-xl border border-[#E8E5E0] bg-[#FAF8F5] px-3.5 text-sm font-medium text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:border-[#C85A32] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C85A32]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
                >
                  Security Key / Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="h-11 w-full rounded-xl border border-[#E8E5E0] bg-[#FAF8F5] px-3.5 text-sm font-medium text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:border-[#C85A32] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C85A32]/10 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-11 w-full rounded-xl bg-[#C85A32] text-sm font-semibold text-white shadow-sm hover:bg-[#A84A28] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85A32] transition-colors cursor-pointer"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying Credentials...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Log In as Admin</span>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </span>
              )}
            </Button>
          </form>

          {/* ── Initial Setup Helper Badge ─────────────────────────────── */}
          <div className="mt-6 rounded-xl border border-[#E8E5E0] bg-[#FAF8F5] p-3 text-xs text-[#6B6B6B]">
            <div className="flex items-center gap-1.5 font-semibold text-[#1A1A1A] mb-1">
              <KeyRound className="h-3.5 w-3.5 text-[#C85A32]" />
              <span>Default Initial Credentials:</span>
            </div>
            <div className="space-y-0.5 font-mono text-[11px] text-[#1A1A1A]">
              <div>ID: <span className="font-semibold text-[#C85A32]">admin</span></div>
              <div>Password: <span className="font-semibold text-[#C85A32]">AdminNepal2026!</span></div>
            </div>
            <p className="mt-1.5 text-[10px] text-[#9B9B9B]">
              Changeable anytime from <span className="font-semibold text-[#1A1A1A]">Admin Settings</span> once signed in.
            </p>
          </div>
        </div>

        {/* ── Back Link & Security Notice ─────────────────────────────── */}
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
          >
            ← Return to HiddenGems Nepal
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-[#9B9B9B]">
            <Info className="h-3 w-3" />
            <span>All administrative access attempts are audited and IP logged.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
