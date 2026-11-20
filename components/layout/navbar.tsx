'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, Compass, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navLinks = [
  { href: '/', label: 'Home', icon: Compass },
  { href: '/explore', label: 'Explore', icon: MapPin },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    /*
      Sticky nav is the ONLY surface that uses elevation (backdrop-blur +
      subtle bg opacity). This is the one legitimate use of "floating above
      content" per the Flat-By-Default rule. No box-shadow added — the
      border-b provides structural separation.
    */
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="HiddenGems Nepal home">
          {/* Full logo on sm+ screens */}
          <Image
            src="/icons/HiddenGemsNepal_Affinity.svg"
            alt="HiddenGems Nepal"
            width={160}
            height={120}
            priority
            className="hidden sm:block object-contain h-10 w-auto"
          />
          {/* Icon-only on mobile */}
          <Image
            src="/icons/HiddenGemsNepal_Affinity.svg"
            alt="HGN"
            width={36}
            height={36}
            priority
            className="sm:hidden object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
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
            )
          })}
        </nav>

        {/* Desktop Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link href="/signup">
            {/* Primary CTA uses bg-primary token, no hard-coded hex */}
            <Button size="sm">Sign Up</Button>
          </Link>
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
                  className="object-contain h-12 w-auto"
                />
              </Link>
              <div className="h-px bg-border" />
              <Link href="/" className="flex items-center gap-3 text-lg font-semibold hover:text-primary transition-colors">
                <Compass className="h-5 w-5 text-primary" /> Home
              </Link>
              <Link href="/explore" className="flex items-center gap-3 text-lg font-semibold hover:text-primary transition-colors">
                <MapPin className="h-5 w-5 text-primary" /> Explore
              </Link>
              <div className="h-px bg-border" />
              <Link href="/login">
                <Button variant="outline" className="w-full justify-start">Log In</Button>
              </Link>
              <Link href="/signup">
                {/* Uses default variant = bg-primary via token */}
                <Button className="w-full justify-start">Sign Up</Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>

      </div>
    </header>
  )
}