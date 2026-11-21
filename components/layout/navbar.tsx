'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Compass, MapPin, PlusCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const navLinks = [
  { href: '/', label: 'Home', icon: Compass },
  { href: '/explore', label: 'Explore', icon: MapPin },
  { href: '/submit', label: 'Submit Gem', icon: PlusCircle },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .maybeSingle();

          const handle =
            profile?.username ||
            user.user_metadata?.username ||
            user.email?.split('@')[0] ||
            null;
          setUsername(handle);
        } else {
          setUsername(null);
        }
      } catch (err) {
        console.error('[Navbar] User fetch error:', err);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .maybeSingle();

        const handle =
          profile?.username ||
          session.user.user_metadata?.username ||
          session.user.email?.split('@')[0] ||
          null;
        setUsername(handle);
      } else {
        setUsername(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUsername(null);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo with high visibility and dark mode contrast */}
        <Link href="/" className="flex items-center gap-2" aria-label="HiddenGems Nepal home">
          {/* Full logo on sm+ screens */}
          <Image
            src="/icons/HiddenGemsNepal_Affinity.svg"
            alt="HiddenGems Nepal"
            width={160}
            height={120}
            priority
            className="hidden sm:block dark:hidden object-contain h-10 w-auto"
          />
          <Image
            src="/icons/HiddenGemsNepal_Affinityy.svg"
            alt="HiddenGems Nepal"
            width={160}
            height={120}
            priority
            className="hidden sm:dark:block object-contain h-10 w-auto"
          />
          {/* Mobile screens */}
          <Image
            src="/icons/HiddenGemsNepal_Affinity.svg"
            alt="HGN"
            width={38}
            height={38}
            priority
            className="sm:hidden dark:hidden object-contain"
          />
          <Image
            src="/icons/HiddenGemsNepal_Affinityy.svg"
            alt="HGN"
            width={38}
            height={38}
            priority
            className="hidden sm:hidden dark:block sm:dark:hidden object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          {username ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="group flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-semibold hover:border-primary transition-colors"
                title="View Profile"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white uppercase shadow-xs">
                  {username[0]}
                </div>
                <span className="text-foreground group-hover:text-primary transition-colors">
                  @{username}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu — Sheet slides in from the right */}
        <Sheet>
          <div className="md:hidden">
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              }
            />
          </div>
          <SheetContent side="right" className="w-[260px] sm:w-[300px]">
            <div className="flex flex-col gap-6 pt-6">
              {/* Logo in mobile drawer */}
              <Link href="/" className="flex items-center">
                <Image
                  src="/icons/HiddenGemsNepal_Affinity.svg"
                  alt="HiddenGems Nepal"
                  width={180}
                  height={135}
                  className="object-contain h-12 w-auto dark:hidden"
                />
                <Image
                  src="/icons/HiddenGemsNepal_Affinityy.svg"
                  alt="HiddenGems Nepal"
                  width={180}
                  height={135}
                  className="hidden object-contain h-12 w-auto dark:block"
                />
              </Link>
              <div className="h-px bg-border" />
              <Link
                href="/"
                className="flex items-center gap-3 text-lg font-semibold hover:text-primary transition-colors"
              >
                <Compass className="h-5 w-5 text-primary" /> Home
              </Link>
              <Link
                href="/explore"
                className="flex items-center gap-3 text-lg font-semibold hover:text-primary transition-colors"
              >
                <MapPin className="h-5 w-5 text-primary" /> Explore
              </Link>
              <Link
                href="/submit"
                className="flex items-center gap-3 text-lg font-semibold hover:text-primary transition-colors"
              >
                <PlusCircle className="h-5 w-5 text-primary" /> Submit Gem
              </Link>
              <div className="h-px bg-border" />

              {username ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 rounded-xl border border-border/80 bg-background/80 p-3 text-sm font-semibold"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white uppercase">
                      {username[0]}
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Signed in as</p>
                      <p className="font-bold text-foreground">@{username}</p>
                    </div>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full justify-start text-xs text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" className="w-full justify-start">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="w-full justify-start">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
