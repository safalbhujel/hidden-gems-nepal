import {
  Wallet,
  Clock,
  Leaf,
  Mountain,
  Lightbulb,
} from 'lucide-react'
import type { Place } from '@/lib/types/places'
import { Separator } from '@/components/ui/separator'

interface PlaceMetadataProps {
  place: Place
}

interface MetaItemProps {
  icon: React.ReactNode
  label: string
  value: string | null | undefined
}

function MetaItem({ icon, label, value }: MetaItemProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
      <div className="mt-0.5 flex-shrink-0 text-primary">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground leading-relaxed">{value}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PlaceMetadata
//
// Renders the practical metadata grid for a place:
// Budget, Best Time, Best Season, Difficulty, Travel Tips
// Only renders fields that have values.
// ─────────────────────────────────────────────────────────────────────────────
export function PlaceMetadata({ place }: PlaceMetadataProps) {
  const items = [
    { icon: <Wallet className="h-4.5 w-4.5" />, label: 'Budget', value: place.budget },
    { icon: <Clock className="h-4.5 w-4.5" />, label: 'Best Time to Visit', value: place.best_time },
    { icon: <Leaf className="h-4.5 w-4.5" />, label: 'Best Season', value: place.best_season },
    { icon: <Mountain className="h-4.5 w-4.5" />, label: 'Difficulty', value: place.difficulty },
  ].filter((item) => item.value !== null && item.value !== undefined && item.value.trim().length > 0)

  const hasTips =
    place.travel_tips !== null &&
    place.travel_tips !== undefined &&
    place.travel_tips.trim().length > 0

  if (items.length === 0 && !hasTips) return null

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Trip Details</h2>
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(({ icon, label, value }) => (
            <MetaItem key={label} icon={icon} label={label} value={value} />
          ))}
        </div>
      )}
      {hasTips && (
        <div className="space-y-2">
          {items.length > 0 && <Separator />}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
            <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                Travel Tips
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {place.travel_tips}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
