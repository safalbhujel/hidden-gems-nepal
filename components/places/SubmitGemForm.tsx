'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UploadCloud,
  Link2,
  Plus,
  Trash2,
  Star,
  Film,
  ExternalLink,
  Globe,
  Video,
} from 'lucide-react';
import type { Category, District, PlaceCardData } from '@/lib/types/places';
import { LocationPickerMap, type Coordinates, type LocationDetails } from '@/components/maps/LocationPickerMap';
import { submitPlace } from '@/app/submit/actions';
import { PlaceCard } from '@/components/places/PlaceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  detectPlatform,
  getPlatformLabel,
  type SocialPlatform,
} from '@/lib/utils/media';

interface SubmitGemFormProps {
  categories: Category[];
  districts: District[];
}

interface ImageItem {
  id: string;
  file?: File;
  previewUrl: string;
  sourceType: 'upload' | 'url';
}

interface MediaSourceItem {
  id: string;
  url: string;
  platform: SocialPlatform;
  title?: string;
  author?: string;
  file?: File;
}

function SocialPlatformBadgeIcon({ platform }: { platform: SocialPlatform }) {
  switch (platform) {
    case 'instagram':
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97v7.54c-.01 2.22-.72 4.44-2.07 6.17-1.35 1.74-3.32 2.94-5.5 3.32-2.18.39-4.5-.04-6.38-1.18-1.88-1.14-3.27-2.98-3.83-5.11-.56-2.13-.26-4.46.82-6.37 1.09-1.91 2.89-3.35 5.01-3.97.74-.22 1.52-.33 2.3-.33.2 0 .4 0 .6.03v4.1c-.56-.12-1.15-.14-1.72-.03-1.14.22-2.13.88-2.73 1.84-.6 1-.74 2.21-.38 3.32.36 1.11 1.18 2.01 2.25 2.47 1.07.46 2.32.46 3.39 0 1.07-.46 1.89-1.36 2.25-2.47.16-.5.23-1.03.23-1.57V.02h.67z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'video':
      return <Video className="h-3.5 w-3.5" />;
    default:
      return <Globe className="h-3.5 w-3.5" />;
  }
}

export function SubmitGemForm({ categories, districts }: SubmitGemFormProps) {
  const router = useRouter();

  const [coords, setCoords] = useState<Coordinates>({ lat: 27.7172, lng: 85.324 }); // Default: Kathmandu
  const [address, setAddress] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedPlace, setSubmittedPlace] = useState<PlaceCardData | null>(null);

  // ── Images State ──────────────────────────────────────────────────────────
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pastedImageUrl, setPastedImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Videos & Social Links State ───────────────────────────────────────────
  const [mediaSources, setMediaSources] = useState<MediaSourceItem[]>([]);
  const [socialLinkInput, setSocialLinkInput] = useState('');
  const [socialTitleInput, setSocialTitleInput] = useState('');
  const [socialAuthorInput, setSocialAuthorInput] = useState('');
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill address and attempt district match from reverse geocoding
  const handleLocationDetails = (details: LocationDetails) => {
    setAddress(details.address);

    if (details.district) {
      const match = districts.find(
        (d) =>
          d.name.toLowerCase().includes(details.district!.toLowerCase()) ||
          details.district!.toLowerCase().includes(d.name.toLowerCase())
      );
      if (match) {
        setSelectedDistrictId(match.id);
      }
    }
  };

  // ── Image Handlers ────────────────────────────────────────────────────────
  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: ImageItem[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      sourceType: 'upload',
    }));

    setImages((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddImageUrl = () => {
    const url = pastedImageUrl.trim();
    if (!url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      alert('Please enter a valid image URL starting with http:// or https://');
      return;
    }

    setImages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        previewUrl: url,
        sourceType: 'url',
      },
    ]);
    setPastedImageUrl('');
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((img) => img.id === id);
      if (item?.file) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleSetCoverImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
  };

  // ── Video & Social Link Handlers ──────────────────────────────────────────
  const detectedInputPlatform = detectPlatform(socialLinkInput);

  const handleAddSocialLink = () => {
    const url = socialLinkInput.trim();
    if (!url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      alert('Please enter a valid URL starting with https:// or http://');
      return;
    }

    const platform = detectPlatform(url);
    const newItem: MediaSourceItem = {
      id: Math.random().toString(36).substring(2, 9),
      url,
      platform,
      title: socialTitleInput.trim() || undefined,
      author: socialAuthorInput.trim() || undefined,
    };

    setMediaSources((prev) => [...prev, newItem]);
    setSocialLinkInput('');
    setSocialTitleInput('');
    setSocialAuthorInput('');
  };

  const handleAddVideoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newVideos: MediaSourceItem[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      url: URL.createObjectURL(file),
      platform: 'video',
      title: file.name.replace(/\.[^/.]+$/, ''),
      file,
    }));

    setMediaSources((prev) => [...prev, ...newVideos]);
    if (videoFileInputRef.current) videoFileInputRef.current.value = '';
  };

  const handleRemoveMediaSource = (id: string) => {
    setMediaSources((prev) => {
      const item = prev.find((s) => s.id === id);
      if (item?.file) {
        URL.revokeObjectURL(item.url);
      }
      return prev.filter((s) => s.id !== id);
    });
  };

  // ── Form Submit Handler ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set('latitude', String(coords.lat));
    formData.set('longitude', String(coords.lng));
    formData.set('address', address);

    // Append images
    const pastedUrls: string[] = [];
    images.forEach((img) => {
      if (img.file) {
        formData.append('image_files', img.file);
      } else if (img.sourceType === 'url') {
        pastedUrls.push(img.previewUrl);
      }
    });
    formData.set('image_urls_json', JSON.stringify(pastedUrls));

    // Append videos and social media link sources
    const linkSources: Array<{ url: string; platform: SocialPlatform; title?: string; author?: string }> = [];
    mediaSources.forEach((source) => {
      if (source.file) {
        formData.append('video_files', source.file);
      } else {
        linkSources.push({
          url: source.url,
          platform: source.platform,
          title: source.title,
          author: source.author,
        });
      }
    });
    formData.set('media_sources_json', JSON.stringify(linkSources));

    const res = await submitPlace(formData);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.success) {
      setSubmittedPlace(res.submittedPlace ?? null);
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-8 sm:p-10 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            Your place is live in the community feed!
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Travelers can now see your card, react with a heart, save it, leave comments, and get Google Maps directions right to your pinned location.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {submittedPlace && (
              <Button
                onClick={() => router.push(`/places/${submittedPlace.slug}`)}
                variant="default"
                className="font-semibold"
              >
                Open Full Guide
              </Button>
            )}
            <Button onClick={() => router.push('/explore')} variant="outline">
              Browse Explore Feed
            </Button>
            <Button
              onClick={() => {
                setIsSuccess(false);
                setSubmittedPlace(null);
              }}
              variant="ghost"
            >
              Share Another Place
            </Button>
          </div>
        </div>

        {submittedPlace && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Live Display Card Preview
              </h3>
              <span className="text-xs text-muted-foreground">
                Try Quick Peek, View on Map, or Google Maps Directions below
              </span>
            </div>
            <div className="max-w-md mx-auto">
              <PlaceCard
                place={submittedPlace}
                currentUserId={submittedPlace.submitted_by}
                categories={categories}
                districts={districts}
                defaultExpanded
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Section 1: Location Identity ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
          <span>1. Place Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Place Name *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. Tindhare Falls, Dudhkunda Ridge"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Category *</Label>
            <select
              id="category_id"
              name="category_id"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="why_special">What makes this place special? *</Label>
          <Input
            id="why_special"
            name="why_special"
            required
            placeholder="e.g. A quiet three-tier waterfall hidden inside the forest with fresh spring water."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description & How to get there *</Label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            placeholder="Tell travelers how to reach this spot, what the path looks like, and what to expect when they get there…"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* ── Section 2: Interactive Location Picker ──────────────────────────── */}
      <LocationPickerMap
        value={coords}
        onChange={setCoords}
        onLocationDetails={handleLocationDetails}
      />

      {/* Detected Address & District Selection Card */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="address">Detected Address / Landmark</Label>
            <Input
              id="address"
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Auto-detected from map or enter manually"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="district_id">District *</Label>
            <select
              id="district_id"
              name="district_id"
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select District</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 3: Visual Documentation & Media Sources ─────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>3. Photos and Videos</span>
            </h3>
            <span className="text-xs text-muted-foreground font-medium">
              {images.length} photos · {mediaSources.length} links
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Add your own photos, upload a video, or paste links from Instagram, TikTok, or YouTube to credit the creator.
          </p>
        </div>

        {/* ── Subsection A: Photos (Upload & URL) ───────────────────────────── */}
        <div className="space-y-4 rounded-xl border border-border/70 bg-background/50 p-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <UploadCloud className="h-4 w-4 text-primary" />
              <span>Place Photos & Gallery</span>
            </Label>
            <span className="text-xs text-muted-foreground">Multiple photos supported</span>
          </div>

          {/* Action Row: File Upload Dropzone + URL Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* File Upload Button / Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/5 rounded-xl p-4 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleAddFiles}
                className="hidden"
              />
              <UploadCloud className="h-6 w-6 text-primary mb-1" />
              <p className="text-xs font-semibold text-foreground">Click to upload photos</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG, WebP up to 15MB each</p>
            </div>

            {/* Paste Image URL Input */}
            <div className="flex flex-col justify-center border border-border/80 rounded-xl p-4 bg-card/60 space-y-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                <span>Or paste an image web link</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={pastedImageUrl}
                  onChange={(e) => setPastedImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="text-xs h-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleAddImageUrl}
                  className="shrink-0 h-9 px-3 gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Photos Preview Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
              {images.map((item, index) => (
                <div
                  key={item.id}
                  className={`group relative aspect-square rounded-xl overflow-hidden border bg-black/10 transition-all ${
                    index === 0 ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                  }`}
                >
                  <Image
                    src={item.previewUrl}
                    alt={`Preview ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />

                  {/* Cover Badge */}
                  {index === 0 && (
                    <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      <span>Cover</span>
                    </div>
                  )}

                  {/* Source indicator */}
                  <div className="absolute bottom-1.5 left-1.5 z-10 bg-black/70 backdrop-blur-xs text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                    {item.sourceType === 'upload' ? 'Upload' : 'URL'}
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetCoverImage(index)}
                        title="Set as Cover Photo"
                        className="p-1.5 rounded-lg bg-background/90 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(item.id)}
                      title="Remove Photo"
                      className="p-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Subsection B: Videos & Social Media Post Redirecters ──────────── */}
        <div className="space-y-4 rounded-xl border border-border/70 bg-background/50 p-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Film className="h-4 w-4 text-primary" />
              <span>Social Media Posts, Reels & Videos</span>
            </Label>
            <span className="text-xs text-muted-foreground">Multiple links & videos allowed</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Paste a link from Instagram, TikTok, or YouTube, or upload a video. Travelers can click through to see the original post and support the creator.
          </p>

          {/* Social Link Input Box */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="social_url" className="text-xs font-semibold text-foreground">
                  Post or Video URL *
                </Label>
                {socialLinkInput && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <SocialPlatformBadgeIcon platform={detectedInputPlatform} />
                    <span>{getPlatformLabel(detectedInputPlatform)}</span>
                  </span>
                )}
              </div>
              <Input
                id="social_url"
                value={socialLinkInput}
                onChange={(e) => setSocialLinkInput(e.target.value)}
                placeholder="e.g. https://www.instagram.com/reel/..., https://www.tiktok.com/@.../video/..."
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="social_title" className="text-[11px] text-muted-foreground">
                  Title or Caption (Optional)
                </Label>
                <Input
                  id="social_title"
                  value={socialTitleInput}
                  onChange={(e) => setSocialTitleInput(e.target.value)}
                  placeholder="e.g. Hidden gorge hike & waterfall"
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="social_author" className="text-[11px] text-muted-foreground">
                  Creator Credit / Handle (Optional)
                </Label>
                <Input
                  id="social_author"
                  value={socialAuthorInput}
                  onChange={(e) => setSocialAuthorInput(e.target.value)}
                  placeholder="e.g. @wanderer_nepal on Instagram"
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {/* Optional Video Upload trigger */}
              <div className="flex items-center gap-2">
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleAddVideoFiles}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => videoFileInputRef.current?.click()}
                  className="h-8 text-xs gap-1.5"
                >
                  <Video className="h-3.5 w-3.5 text-primary" />
                  <span>Upload Video File (.mp4)</span>
                </Button>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleAddSocialLink}
                disabled={!socialLinkInput.trim()}
                className="h-8 text-xs gap-1.5 px-4"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Social Source</span>
              </Button>
            </div>
          </div>

          {/* Media Sources Attached List */}
          {mediaSources.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Attached Media & Social Posts ({mediaSources.length}):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {mediaSources.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/80 bg-card hover:bg-card/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <SocialPlatformBadgeIcon platform={item.platform} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold truncate text-foreground">
                            {item.title || getPlatformLabel(item.platform)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate font-mono">
                          {item.author ? `by ${item.author} · ` : ''}
                          {item.url}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!item.file && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Test Redirect Link"
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMediaSource(item.id)}
                        title="Remove Source"
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 4: Travel Tips & Costs ─────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-foreground">4. Travel Tips & Costs</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Estimated Cost</Label>
            <Input id="budget" name="budget" placeholder="e.g. Free, or NPR 300 for tea and snacks" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="best_season">Best Time to Visit</Label>
            <Input id="best_season" name="best_season" placeholder="e.g. October to April, early morning for clear views" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="travel_tips">Tips for Visitors</Label>
          <textarea
            id="travel_tips"
            name="travel_tips"
            rows={2}
            placeholder="e.g. Wear good walking shoes. The trail gets slippery when it rains, so go early in the day…"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting} className="gap-2 px-8">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting place…</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Submit Place</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
