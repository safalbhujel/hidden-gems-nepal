'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface SaveButtonProps {
  placeId: string
  placeName: string
  /** Initial saved state — resolved server-side before render */
  initialSaved: boolean
  /** If null, user is not authenticated */
  userId: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// SaveButton
//
// Client component — handles optimistic UI for save/unsave.
// Only renders an active button for authenticated users; shows a disabled
// "sign in to save" variant for unauthenticated visitors.
// ─────────────────────────────────────────────────────────────────────────────
export function SaveButton({ placeId, placeName, initialSaved, userId }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  if (!userId) {
    return (
      <a href="/login" className="block">
        <Button
          variant="outline"
          className="w-full gap-2"
          aria-label="Sign in to save this place"
        >
          <Heart className="h-4 w-4" />
          Save Place
        </Button>
      </a>
    )
  }

  const toggle = () => {
    const supabase = createSupabaseBrowserClient()

    startTransition(async () => {
      const next = !saved
      setSaved(next) // optimistic update

      if (next) {
        const { error } = await supabase
          .from('saved_places')
          .insert({ place_id: placeId, user_id: userId })

        if (error) {
          console.error('[SaveButton] insert error:', error.message)
          setSaved(!next) // rollback
        }
      } else {
        const { error } = await supabase
          .from('saved_places')
          .delete()
          .eq('place_id', placeId)
          .eq('user_id', userId)

        if (error) {
          console.error('[SaveButton] delete error:', error.message)
          setSaved(!next) // rollback
        }
      }
    })
  }

  return (
    <Button
      onClick={toggle}
      disabled={isPending}
      variant={saved ? 'default' : 'outline'}
      className={cn(
        'w-full gap-2 transition-all',
        saved
          ? 'bg-red-500 hover:bg-red-600 border-red-500 text-white'
          : 'hover:border-red-400 hover:text-red-500'
      )}
      aria-label={saved ? `Unsave ${placeName}` : `Save ${placeName}`}
    >
      <Heart className={cn('h-4 w-4 transition-all', saved && 'fill-current')} />
      {saved ? 'Saved!' : 'Save Place'}
    </Button>
  )
}
