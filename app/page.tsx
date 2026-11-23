import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Flame,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SmartSearchBar } from '@/components/search/SmartSearchBar'
import { FeaturedGemsClient } from '@/components/places/FeaturedGemsClient'
import { getPlacesForCards, getCategories } from '@/lib/queries/places'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CategoryIcon } from '@/components/icons/CategoryIcon'

// ─────────────────────────────────────────────────────────────────────────────
// SEO
// ─────────────────────────────────────────────────────────────────────────────
export const metadata = {
  title: 'HiddenGems Nepal — Discover the Nepal Everyone Misses',
  description:
    'Find quiet waterfalls, small tea shops, hilltop viewpoints, and peaceful spots across all 77 districts of Nepal. Shared by locals who walk these trails every day.',
}

// Authentic Trailguide palette: border-accented chips, no coloured backgrounds.
// Hover state uses Sunset Orange border + text only — flat by default.
const CATEGORY_CHIP_CLASSES = 'flex items-center gap-3 px-6 py-4 rounded-xl border border-border bg-background hover:border-primary hover:text-primary transition-colors cursor-pointer'

const DISTRICTS = [
  'Kathmandu', 'Pokhara', 'Chitwan', 'Mustang',
  'Solukhumbu', 'Banke', 'Palpa', 'Ilam', 'Dolpa', 'Humla',
]

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let username: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()
    username =
      profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || null
  }

  // Fetch real data — server-side, cached
  const [categories, newestPlaces, topRatedPlaces, mostHiddenPlaces] = await Promise.all([
    getCategories(),
    getPlacesForCards({ sort: 'newest', limit: 3 }),
    getPlacesForCards({ sort: 'highest_rated', limit: 3 }),
    getPlacesForCards({ sort: 'most_hidden', limit: 3 }),
  ])

  return (
    <div className="flex flex-col">

      {/* ── 1. Hero ──────────────────────────────────────────────────────── */}
      {/*
          Flat-By-Default: background is a subtle warm tint of the canvas,
          no gradient-heavy shadow effects. The dot pattern uses primary token.
      */}
      <section className="relative overflow-hidden bg-background border-b py-20 md:py-32">
        {/* Subtle dot-grid pattern — cream on cream, very low opacity */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        <div className="container relative mx-auto max-w-4xl px-4 text-center">
          {/* Main Logo — Prominent, Visible, and Animated */}
          <div className="mb-10 flex justify-center">
            <div className="group relative inline-flex items-center justify-center animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-700 ease-out">
              {/* Subtle ambient warm aura behind the logo */}
              <div
                className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-[#FF8500]/12 blur-3xl dark:bg-[#FF8500]/25 animate-hero-glow"
                aria-hidden="true"
              />

              <div className="animate-hero-logo transition-transform duration-300 ease-out group-hover:scale-[1.04]">
                <Image
                  src="/icons/HiddenGemsNepal_Affinity.svg"
                  alt="HiddenGems Nepal"
                  width={460}
                  height={345}
                  priority
                  className="h-28 sm:h-36 md:h-44 lg:h-52 w-auto object-contain drop-shadow-md dark:hidden"
                />
                <Image
                  src="/icons/HiddenGemsNepal_Affinityy.svg"
                  alt="HiddenGems Nepal"
                  width={460}
                  height={345}
                  priority
                  className="hidden h-28 sm:h-36 md:h-44 lg:h-52 w-auto object-contain drop-shadow-[0_12px_36px_rgba(255,133,0,0.24)] dark:block"
                />
              </div>
            </div>
          </div>

          {username && (
            <div className="mb-5 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary animate-in fade-in-50">
              <span>Namaste, @{username} · Welcome back</span>
            </div>
          )}

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-5 leading-tight">
            Discover the Nepal that{' '}
            <span className="text-primary">everyone misses.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Quiet waterfalls, small tea shops, hilltop viewpoints, and peaceful spots
            across all 77 districts. Shared by locals who walk these trails every day.
          </p>

          {/* Smart search bar */}
          <div className="max-w-2xl mx-auto">
            <SmartSearchBar />
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            77 districts · 10,000+ hidden spots · growing every day
          </p>
        </div>
      </section>

      {/* ── 2. Categories ─────────────────────────────────────────────────── */}
      <section className="py-12 border-b">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-bold mb-6">What kind of place are you looking for?</h2>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x">
            {(categories.length > 0 ? categories : []).map((cat) => (
              <Link
                key={cat.id}
                href={`/explore?category=${cat.slug}`}
                className="flex-shrink-0 snap-start"
              >
                {/* Flat chip: border-only, hover lifts border to Sunset Orange */}
                <div className={CATEGORY_CHIP_CLASSES}>
                  <CategoryIcon slug={cat.slug} name={cat.name} className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-semibold whitespace-nowrap text-foreground">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Featured Gems (sortable, DB-backed) ────────────────────────── */}
      <section className="py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Flame className="h-7 w-7 text-primary" aria-hidden="true" />
                Before It Gets Crowded
              </h2>
              <p className="text-muted-foreground mt-1">Great spots that most travelers have not found yet.</p>
            </div>
            <Link
              href="/explore"
              className="hidden md:flex items-center gap-1.5 text-primary font-semibold hover:underline underline-offset-4 text-sm"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Interactive sort tabs + grid — client component */}
          <FeaturedGemsClient
            initialPlaces={newestPlaces}
            sortedNewest={newestPlaces}
            sortedTopRated={topRatedPlaces}
            sortedMostHidden={mostHiddenPlaces}
            currentUserId={user?.id ?? null}
            categories={categories}
          />

          <div className="mt-8 flex justify-center md:hidden">
            <Link href="/explore">
              <Button variant="outline" className="gap-2">
                View all gems <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Districts belt ─────────────────────────────────────────────── */}
      {/*
          Flat-By-Default: bg-muted instead of a gradient-heavy tinted block.
          District pills use border-only hover state (no bg fill on hover).
      */}
      <section className="py-10 border-t border-b bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4">
          <p className="text-center text-sm font-medium text-muted-foreground mb-6 uppercase tracking-widest">
            Explore across all 77 districts
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {DISTRICTS.map((d) => (
              <Link key={d} href={`/explore?district=${encodeURIComponent(d.toLowerCase())}`}>
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm border border-border bg-background hover:border-primary hover:text-primary transition-colors cursor-pointer">
                  {d}
                </span>
              </Link>
            ))}
            <Link href="/explore">
              <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm border border-dashed border-primary text-primary hover:bg-primary/5 transition-colors cursor-pointer">
                +67 more <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. Call to Action ───────────────────────────────────────────── */}
      {/*
          The CTA section is the ONE place where the Sunset Orange fills
          a full section — consistent with "Content-First Rule": colour is used
          deliberately to break the page rhythm and signal a call to act.
          No external shadow — the colour block itself provides depth.
      */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          {/* Mini logo in crisp white vector for CTA section */}
          <div className="flex justify-center mb-6 opacity-95">
            <Image
              src="/icons/HiddenGemsNepal_Affinityy.svg"
              alt="HiddenGems Nepal"
              width={160}
              height={120}
              className="h-16 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Know a quiet spot near you?
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Tell us about your favorite tea shop, peaceful trail, or sunset spot. Help other travelers find places they will love.
          </p>
          <Link href="/signup">
            {/*
                Flat-By-Default rule: the button here sits inside the orange
                CTA block, so we use a white bg with orange text.
                No shadow — the colour contrast provides the visual separation.
            */}
            <Button
              size="lg"
              className="bg-background text-primary hover:bg-background/90 font-bold text-lg px-10 py-6 rounded-xl transition-colors"
            >
              Share a Place
            </Button>
          </Link>
        </div>
      </section>

    </div>
  )
}