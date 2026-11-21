import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Mountain,
  Flame,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SmartSearchBar } from '@/components/search/SmartSearchBar'
import { FeaturedGemsClient } from '@/components/places/FeaturedGemsClient'
import { getPlacesForCards, getCategories } from '@/lib/queries/places'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────────────────────
// SEO
// ─────────────────────────────────────────────────────────────────────────────
export const metadata = {
  title: 'HiddenGems Nepal — Discover the Nepal Everyone Misses',
  description:
    'Discover hidden waterfalls, local cafes, secret viewpoints, and authentic experiences across all 77 districts of Nepal — curated by people who actually live there.',
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
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/icons/HiddenGemsNepal_Affinity.svg"
              alt="HiddenGems Nepal"
              width={280}
              height={210}
              priority
              className="h-20 w-auto object-contain md:h-28"
            />
          </div>

          {username && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary animate-in fade-in-50">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Namaste, @{username} ✦ Ready to explore?</span>
            </div>
          )}

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-5 leading-tight">
            Discover the Nepal that{' '}
            <span className="text-primary">everyone misses.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Hidden waterfalls, cozy local cafes, secret viewpoints, and authentic experiences
            across all 77 districts — curated by people who actually live there.
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
          <h2 className="text-2xl font-bold mb-6">What&apos;s your vibe?</h2>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x">
            {(categories.length > 0 ? categories : []).map((cat) => {
              const IconComponent = Mountain // Default fallback icon
              return (
                <Link
                  key={cat.id}
                  href={`/explore?category=${cat.slug}`}
                  className="flex-shrink-0 snap-start"
                >
                  {/* Flat chip: border-only, hover lifts border to Sunset Orange */}
                  <div className={CATEGORY_CHIP_CLASSES}>
                    {cat.icon ? (
                      <span className="text-xl" aria-hidden="true">{cat.icon}</span>
                    ) : (
                      <IconComponent className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="font-semibold whitespace-nowrap text-foreground">{cat.name}</span>
                  </div>
                </Link>
              )
            })}
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
                Before It Goes Viral
              </h2>
              <p className="text-muted-foreground mt-1">Highly rated spots still under the radar.</p>
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
          {/* Mini logo in white for CTA section */}
          <div className="flex justify-center mb-6 opacity-90">
            <Image
              src="/icons/HiddenGemsNepal_Affinity.svg"
              alt=""
              width={120}
              height={90}
              className="h-14 w-auto object-contain brightness-0 invert"
            />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Know a hidden spot?
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Share your favorite local cafes, secret trails, or underrated viewpoints with the community. Be the guide everyone needs.
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
              Start Contributing
            </Button>
          </Link>
        </div>
      </section>

    </div>
  )
}