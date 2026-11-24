'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark } from 'lucide-react';
import { togglePlaceHeartAction, togglePlaceSaveAction } from '@/app/places/actions';
import { cn } from '@/lib/utils';

interface HeartReactButtonProps {
  placeId: string;
  placeSlug?: string;
  initialCount?: number;
  initialLiked?: boolean;
  userId?: string | null;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
  onChange?: (liked: boolean, count: number) => void;
}

export function HeartReactButton({
  placeId,
  placeSlug,
  initialCount = 0,
  initialLiked = false,
  userId,
  size = 'sm',
  showLabel = false,
  className,
  onChange,
}: HeartReactButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [burstKey, setBurstKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      const dest = placeSlug ? `/places/${placeSlug}` : '/explore';
      router.push(`/login?redirectedFrom=${encodeURIComponent(dest)}`);
      return;
    }

    const nextLiked = !liked;
    const nextCount = Math.max(0, count + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setCount(nextCount);
    if (nextLiked) {
      setBurstKey((k) => k + 1);
    }
    onChange?.(nextLiked, nextCount);

    startTransition(async () => {
      const res = await togglePlaceHeartAction(placeId, placeSlug);
      if (!res.success) {
        setLiked(liked);
        setCount(count);
        onChange?.(liked, count);
        if (res.requiresAuth) {
          const dest = placeSlug ? `/places/${placeSlug}` : '/explore';
          router.push(`/login?redirectedFrom=${encodeURIComponent(dest)}`);
        }
      } else if (typeof res.liked === 'boolean' && typeof res.count === 'number') {
        setLiked(res.liked);
        setCount(res.count);
        onChange?.(res.liked, res.count);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={liked}
      aria-label={liked ? 'Remove heart reaction' : 'React with heart'}
      title={userId ? (liked ? 'Liked' : 'Love this spot') : 'Sign in to react'}
      className={cn(
        'relative inline-flex items-center justify-center gap-1.5 rounded-full border font-semibold transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.95] cursor-pointer select-none',
        size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-10 px-4 text-sm',
        liked
          ? 'border-rose-500/40 bg-rose-500/12 text-rose-500 dark:text-rose-400'
          : 'border-border/80 bg-background/80 text-muted-foreground hover:border-rose-400/60 hover:text-rose-500',
        className
      )}
    >
      <span className="relative inline-flex items-center justify-center">
        {burstKey > 0 && liked && (
          <span
            key={burstKey}
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-rose-500 animate-ring-burst"
            aria-hidden="true"
          />
        )}
        <Heart
          key={`icon-${burstKey}`}
          className={cn(
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
            liked && 'fill-current animate-heart-pop'
          )}
          strokeWidth={1.9}
        />
      </span>
      <span className="tabular-nums font-bold">{count}</span>
      {showLabel && <span>{liked ? 'Loved' : 'Love'}</span>}
    </button>
  );
}

interface SaveBookmarkButtonProps {
  placeId: string;
  placeName: string;
  placeSlug?: string;
  initialSaved?: boolean;
  userId?: string | null;
  size?: 'sm' | 'md' | 'full';
  showLabel?: boolean;
  className?: string;
  onChange?: (saved: boolean) => void;
}

export function SaveBookmarkButton({
  placeId,
  placeName,
  placeSlug,
  initialSaved = false,
  userId,
  size = 'sm',
  showLabel = true,
  className,
  onChange,
}: SaveBookmarkButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      const dest = placeSlug ? `/places/${placeSlug}` : '/explore';
      router.push(`/login?redirectedFrom=${encodeURIComponent(dest)}`);
      return;
    }

    const nextSaved = !saved;
    setSaved(nextSaved);
    onChange?.(nextSaved);

    startTransition(async () => {
      const res = await togglePlaceSaveAction(placeId, placeSlug);
      if (!res.success) {
        setSaved(saved);
        onChange?.(saved);
        if (res.requiresAuth) {
          const dest = placeSlug ? `/places/${placeSlug}` : '/explore';
          router.push(`/login?redirectedFrom=${encodeURIComponent(dest)}`);
        }
      } else if (typeof res.saved === 'boolean') {
        setSaved(res.saved);
        onChange?.(res.saved);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${placeName} from saved places` : `Save ${placeName}`}
      title={userId ? (saved ? 'Saved in your list' : 'Save spot for later') : 'Sign in to save'}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl border font-semibold transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97] cursor-pointer select-none',
        size === 'sm' && 'h-8 px-2.5 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'full' && 'h-10 w-full px-4 text-sm',
        saved
          ? 'border-primary bg-primary text-primary-foreground shadow-xs'
          : 'border-border/80 bg-background/85 text-foreground hover:border-primary/60 hover:text-primary',
        className
      )}
    >
      <Bookmark
        className={cn(
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
          saved && 'fill-current animate-heart-pop'
        )}
        strokeWidth={1.9}
      />
      {showLabel && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
