import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  /** px height for the SVG. Default: 36 */
  height?: number
  /** Show the full wordmark next to the icon. Default: true */
  showWordmark?: boolean
  className?: string
}

/**
 * The official HiddenGems Nepal logo using the SVG asset in /public/icons.
 * Use this everywhere instead of text/emoji placeholders.
 */
export function Logo({ height = 36, showWordmark = true, className = '' }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label="HiddenGems Nepal home">
      <Image
        src="/icons/HiddenGemsNepal_Affinity.svg"
        alt="HiddenGems Nepal logo"
        width={height * (4 / 3)}   // SVG viewBox is 1600×1200 → 4:3
        height={height}
        priority
        className="object-contain"
      />
      {showWordmark && (
        <span className="sr-only">HiddenGems Nepal</span>
      )}
    </Link>
  )
}
