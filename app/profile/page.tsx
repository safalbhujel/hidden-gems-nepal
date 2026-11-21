import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { logout } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Compass, PlusCircle, LogOut, Sparkles, Mail } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  // getUser() validates the JWT with Supabase server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, email, created_at')
    .eq('id', user.id)
    .maybeSingle();

  const handle =
    profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'explorer';

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6">
      {/* Ambient warm glow in background */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -z-10 h-[360px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF8500]/8 blur-[100px] dark:bg-[#FF8500]/12"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[480px] rounded-3xl border border-border/80 bg-card/90 p-7 sm:p-9 shadow-2xl shadow-black/[0.04] backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-card/90 dark:shadow-black/40">
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

          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" />
            <span>Explorer Profile</span>
          </div>

          {/* Greet with Username */}
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Namaste, @{handle}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Your personal hub for hidden trails and community discoveries.
          </p>
        </div>

        {/* ── User Details Card ───────────────────────────────────────────── */}
        <div className="mt-6 divide-y divide-border/60 rounded-2xl border border-border/80 bg-muted/30 p-4 text-sm">
          <div className="flex items-center gap-3 pb-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white uppercase text-base shadow-xs">
              {handle[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground truncate">
                {profile?.full_name || handle}
              </p>
              <p className="text-xs font-semibold text-primary">@{handle}</p>
            </div>
            <Link
              href="/choose-username"
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Edit handle
            </Link>
          </div>

          <div className="flex items-center gap-2 pt-3 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>

        {/* ── Quick Action Shortcuts ──────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link href="/explore">
            <Button
              variant="outline"
              className="w-full h-11 gap-2 rounded-xl border-border/80 hover:border-primary text-xs font-semibold"
            >
              <Compass className="h-4 w-4 text-primary" />
              <span>Explore Map</span>
            </Button>
          </Link>

          <Link href="/submit">
            <Button className="w-full h-11 gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs">
              <PlusCircle className="h-4 w-4" />
              <span>Submit Gem</span>
            </Button>
          </Link>
        </div>

        {/* ── Logout ──────────────────────────────────────────────────────── */}
        <form action={logout} className="mt-6 pt-2">
          <Button
            type="submit"
            variant="ghost"
            className="w-full h-10 gap-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out of Explorer Account</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
