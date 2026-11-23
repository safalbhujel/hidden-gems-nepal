import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PlaceNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <Compass className="h-32 w-32 mx-auto text-muted-foreground/20" aria-hidden="true" />
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold">Place not found</h1>
          <p className="text-muted-foreground">
            We could not find this place. It might still be under review, or the link may have changed.
          </p>
        </div>
        <Link href="/explore">
          <Button className="gap-2 rounded-full px-6">
            <Compass className="h-4 w-4" />
            Back to Explore
          </Button>
        </Link>
      </div>
    </div>
  )
}