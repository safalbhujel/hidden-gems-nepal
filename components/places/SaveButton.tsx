'use client';

import { SaveBookmarkButton } from '@/components/places/PlaceActionButtons';

interface SaveButtonProps {
  placeId: string;
  placeName: string;
  placeSlug?: string;
  initialSaved: boolean;
  userId: string | null;
}

export function SaveButton({
  placeId,
  placeName,
  placeSlug,
  initialSaved,
  userId,
}: SaveButtonProps) {
  return (
    <SaveBookmarkButton
      placeId={placeId}
      placeName={placeName}
      placeSlug={placeSlug}
      initialSaved={initialSaved}
      userId={userId}
      size="full"
      showLabel
    />
  );
}
