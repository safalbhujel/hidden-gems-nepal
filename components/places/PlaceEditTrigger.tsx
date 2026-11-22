'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditPlaceModal } from '@/components/places/EditPlaceModal';
import type { Place, Category, District } from '@/lib/types/places';

interface PlaceEditTriggerProps {
  place: Place;
  categories?: Category[];
  districts?: District[];
  isAdmin?: boolean;
}

export function PlaceEditTrigger({
  place,
  categories = [],
  districts = [],
  isAdmin = false,
}: PlaceEditTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-xs font-semibold rounded-xl border-border/80 bg-background/80 hover:bg-muted hover:border-primary hover:text-primary transition-all cursor-pointer shadow-2xs"
      >
        <Pencil className="h-3.5 w-3.5 text-primary" />
        <span>Edit Destination</span>
      </Button>

      <EditPlaceModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        place={place}
        categories={categories}
        districts={districts}
        isAdmin={isAdmin}
      />
    </>
  );
}
