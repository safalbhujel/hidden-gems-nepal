'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Compass,
  Check,
  Send,
  Mail,
} from 'lucide-react';

const EXPLORE_LINKS = [
  { label: 'Interactive Map', href: '/explore' },
  { label: 'Top Rated Gems', href: '/explore?sort=highest_rated' },
  { label: 'Most Hidden Spots', href: '/explore?sort=most_hidden' },
  { label: 'Recently Added', href: '/explore?sort=newest' },
  { label: 'Alpine & Waterfalls', href: '/explore?category=waterfall' },
  { label: 'Sanctuaries & Viewpoints', href: '/explore?category=viewpoint' },
];

const REGIONAL_LINKS = [
  { label: 'Kathmandu Valley', href: '/explore?district=kathmandu' },
  { label: 'Pokhara & Kaski', href: '/explore?district=kaski' },
  { label: 'Solukhumbu · Everest', href: '/explore?district=solukhumbu' },
  { label: 'Mustang & Annapurna', href: '/explore?district=mustang' },
  { label: 'Ilam & Eastern Tea Hills', href: '/explore?district=ilam' },
  { label: 'Chitwan & Terai Belt', href: '/explore?district=chitwan' },
  { label: 'All 77 Districts', href: '/explore' },
];

const COMMUNITY_LINKS = [
  { label: 'Submit a Gem', href: '/submit' },
  { label: 'Local Contributor Code', href: '/submit' },
  { label: 'Moderation Protocol', href: '/explore' },
  { label: 'Explorer Sign In', href: '/login' },
  { label: 'Member Profile', href: '/profile' },
];

export function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Hide consumer footer inside isolated admin console
  if (pathname.startsWith('/admin')) {
    return null;
  }

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setEmail('');
  }

  return (
    <footer className="w-full border-t border-border/80 bg-card text-foreground transition-colors">
      {/* ── Main Content Grid ────────────────────────────────────────── */}
      <div className="container mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand Manifesto Column */}
          <div className="space-y-5 lg:col-span-4">
            <div className="flex items-center">
              <Logo height={44} variant="auto" priority />
            </div>

            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              The community-governed spatial trailguide for Nepal. Documenting
              underrated trails, quiet sanctuaries, alpine lakes, and authentic
              local heritage across all 77 districts.
            </p>

            {/* Spatial Status Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-medium text-foreground">
                Spatial Network Active
              </span>
              <span className="text-border">·</span>
              <span>PostGIS 77 Districts</span>
            </div>
          </div>

          {/* Column 2: Explore */}
          <div className="space-y-4 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Explore
            </p>
            <ul className="space-y-2.5 text-sm">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Regional Guides */}
          <div className="space-y-4 lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Regional Guides
            </p>
            <ul className="space-y-2.5 text-sm">
              {REGIONAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
                  >
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Community & Dispatch */}
          <div className="space-y-6 lg:col-span-3">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Community
              </p>
              <ul className="space-y-2.5 text-sm">
                {COMMUNITY_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trail Dispatch Mini Subscription */}
            <div className="rounded-xl border border-border/80 bg-background/50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                <Compass className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                <span>Trail Dispatch</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Occasional hand-verified coordinates and seasonal passes.
              </p>

              {subscribed ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span>Subscribed to Trail Dispatch</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="guide@trail.np"
                      className="h-8 text-xs bg-background"
                      required
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 px-3 text-xs font-semibold"
                    >
                      <Send className="h-3 w-3" strokeWidth={1.75} />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Zero spam. Only authentic coordinates.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar: Legal & Minimal Social Vector SVGs ───────────── */}
      <div className="border-t border-border/60 bg-muted/20 py-6">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span>© 2026 HiddenGems Nepal.</span>
            <span>·</span>
            <span className="hidden sm:inline">Authentic community discovery.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link
              href="/explore"
              className="transition-colors hover:text-foreground"
            >
              Open Spatial Data
            </Link>
            <span>·</span>
            <Link
              href="/submit"
              className="transition-colors hover:text-foreground"
            >
              Contributor Protocol
            </Link>
            <span>·</span>
            <a
              href="mailto:trailguide@hiddengemsnepal.org"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Contact Dispatch</span>
            </a>
          </div>

          {/* Minimalist Social / Platform Vectors */}
          <div className="flex items-center gap-3">
            {/* GitHub vector */}
            <a
              href="https://github.com/safalbhujel/hidden-gems-nepal"
              target="_blank"
              rel="noreferrer"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="GitHub Repository"
            >
              <svg
                className="h-4 w-4 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </a>

            {/* X / Twitter vector */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="X / Twitter"
            >
              <svg
                className="h-3.5 w-3.5 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Instagram vector */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Instagram"
            >
              <svg
                className="h-4 w-4 fill-none stroke-current"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
