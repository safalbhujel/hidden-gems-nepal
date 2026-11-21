import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  /** px height for the SVG. Default: 40 */
  height?: number
  /** Show the full wordmark next to the icon. Default: true */
  showWordmark?: boolean
  className?: string
  /**
   * 'orange' - Uses HiddenGemsNepal_Affinity.svg (orange text, best for light surfaces)
   * 'white' - Uses HiddenGemsNepal_Affinityy.svg (white text, best for dark surfaces / CTA banner)
   * 'auto' - Dual logo rendering (shows orange in light mode, crisp white in dark mode)
   */
  variant?: 'orange' | 'white' | 'auto'
  priority?: boolean
}

/**
 * Official HiddenGems Nepal logo with automatic light/dark contrast adaptation.
 * High-visibility vector presentation for navbar, hero, auth, and footer surfaces.
 */
export function Logo({
  height = 40,
  showWordmark = true,
  className = '',
  variant = 'auto',
  priority = false,
}: LogoProps) {
  // SVG viewBox is 4:3 (e.g. 27780x20834 or 6667x5000)
  const width = Math.round(height * (4 / 3))

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 select-none ${className}`}
      aria-label="HiddenGems Nepal home"
    >
      {variant === 'orange' && (
        <Image
          src="/icons/HiddenGemsNepal_Affinity.svg"
          alt="HiddenGems Nepal"
          width={width}
          height={height}
          priority={priority}
          className="object-contain"
          style={{ height: `${height}px`, width: 'auto' }}
        />
      )}

      {variant === 'white' && (
        <Image
          src="/icons/HiddenGemsNepal_Affinityy.svg"
          alt="HiddenGems Nepal"
          width={width}
          height={height}
          priority={priority}
          className="object-contain"
          style={{ height: `${height}px`, width: 'auto' }}
        />
      )}

      {variant === 'auto' && (
        <>
          {/* Light Mode: Warm Sunset Orange Typography */}
          <Image
            src="/icons/HiddenGemsNepal_Affinity.svg"
            alt="HiddenGems Nepal"
            width={width}
            height={height}
            priority={priority}
            className="object-contain dark:hidden"
            style={{ height: `${height}px`, width: 'auto' }}
          />
          {/* Dark Mode: Crisp Mountain White Typography */}
          <Image
            src="/icons/HiddenGemsNepal_Affinityy.svg"
            alt="HiddenGems Nepal"
            width={width}
            height={height}
            priority={priority}
            className="hidden object-contain dark:block"
            style={{ height: `${height}px`, width: 'auto' }}
          />
        </>
      )}

      {showWordmark && <span className="sr-only">HiddenGems Nepal</span>}
    </Link>
  )
}
