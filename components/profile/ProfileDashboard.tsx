'use client';

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Compass,
  Gem,
  Bookmark,
  Award,
  Settings,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Sparkles,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Shield,
  UploadCloud,
  Camera,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NEPAL_AVATAR_PRESETS,
  resolveUserAvatar,
} from '@/lib/constants/avatars';
import { updateAvatar, updateProfile, uploadAvatar } from '@/app/profile/actions';
import { AvatarCropModal } from './AvatarCropModal';
import { EditPlaceModal } from '@/components/places/EditPlaceModal';
import type { PlaceCardData } from '@/lib/types/places';

export interface SubmittedPlaceItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  hidden_score: number;
  created_at: string;
  districts?: { name: string } | Array<{ name: string }> | null;
  place_images?: Array<{ image_url: string; sort_order: number }>;
}

export interface SavedPlaceItem {
  place_id: string;
  created_at: string;
  places: {
    id: string;
    name: string;
    slug: string;
    hidden_score?: number | null;
    average_rating?: number | null;
    review_count?: number | null;
    districts?: { name: string } | Array<{ name: string }> | null;
    place_images?: Array<{ image_url: string; sort_order: number }>;
  } | Array<{
    id: string;
    name: string;
    slug: string;
    hidden_score?: number | null;
    average_rating?: number | null;
    review_count?: number | null;
    districts?: { name: string } | Array<{ name: string }> | null;
    place_images?: Array<{ image_url: string; sort_order: number }>;
  }> | null;
}

interface ProfileDashboardProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
  profile: {
    id: string;
    username: string | null;
    full_name: string | null;
    email: string | null;
    bio: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
  submittedPlaces: SubmittedPlaceItem[];
  savedPlaces: SavedPlaceItem[];
  reviewsCount: number;
}

export function ProfileDashboard({
  user,
  profile,
  submittedPlaces,
  savedPlaces,
  reviewsCount,
}: ProfileDashboardProps) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'saved' | 'badges' | 'settings'>('submissions');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState(false);

  // Circular Cropper & Custom Upload State
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlaceCardData | null>(null);

  // Profile data states
  const [usernameInput, setUsernameInput] = useState(profile?.username || user.email?.split('@')[0] || '');
  const [fullNameInput, setFullNameInput] = useState(profile?.full_name || '');
  const [bioInput, setBioInput] = useState(profile?.bio || '');

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(() => {
    const { avatarUrl } = resolveUserAvatar(profile?.avatar_url, user.user_metadata);
    return avatarUrl;
  });

  const [isPending, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Resolve user info
  const handle: string =
    profile?.username ||
    (typeof user.user_metadata?.username === 'string' ? user.user_metadata.username : '') ||
    (typeof user.email === 'string' ? user.email.split('@')[0] : '') ||
    'explorer';

  // Gamified Explorer Tier calculation
  const totalSubmissions = submittedPlaces.length;
  const approvedSubmissions = submittedPlaces.filter((p) => p.status === 'APPROVED').length;
  const totalSaved = savedPlaces.length;
  const xpPoints = totalSubmissions * 50 + approvedSubmissions * 50 + totalSaved * 15 + reviewsCount * 25;

  let tierName = 'Valley Wanderer';
  let tierLevel = 1;
  let nextTierXP = 150;
  let tierBadgeBg = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400';

  if (xpPoints >= 500) {
    tierName = 'Everest Legend';
    tierLevel = 5;
    nextTierXP = 1000;
    tierBadgeBg = 'bg-amber-500/10 text-amber-500 border-amber-500/30 dark:text-amber-400';
  } else if (xpPoints >= 300) {
    tierName = 'Himalayan Trailblazer';
    tierLevel = 4;
    nextTierXP = 500;
    tierBadgeBg = 'bg-primary/10 text-primary border-primary/30';
  } else if (xpPoints >= 150) {
    tierName = 'High Pass Trekker';
    tierLevel = 3;
    nextTierXP = 300;
    tierBadgeBg = 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30 dark:text-cyan-400';
  } else if (xpPoints >= 50) {
    tierName = 'Hill Country Scout';
    tierLevel = 2;
    nextTierXP = 150;
    tierBadgeBg = 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400';
  }

  const progressPercent = Math.min(100, Math.round((xpPoints / nextTierXP) * 100));

  // Copy handle action
  const handleCopyHandle = () => {
    navigator.clipboard.writeText(`@${handle}`);
    setCopiedHandle(true);
    setTimeout(() => setCopiedHandle(false), 2000);
  };

  // Avatar preset select action
  const handleSelectAvatar = (url: string) => {
    setCurrentAvatarUrl(url);
    setIsAvatarModalOpen(false);
    startTransition(async () => {
      const res = await updateAvatar(url);
      if (res.error) {
        setSaveMessage({ type: 'error', text: res.error });
      } else {
        setSaveMessage({ type: 'success', text: 'Emblem updated.' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    });
  };

  // Gallery file select handler -> triggers circular cropping
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveMessage({ type: 'error', text: 'Please select an image file (JPG, PNG, WebP).' });
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'Image file size must be less than 12MB.' });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setIsAvatarModalOpen(false);
    setIsCropModalOpen(true);
    if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
  };

  // Cropped blob confirmed -> upload to storage
  const handleCropConfirmed = async (croppedBlob: Blob) => {
    setIsUploadingAvatar(true);
    setSaveMessage(null);

    const localPreview = URL.createObjectURL(croppedBlob);
    setCurrentAvatarUrl(localPreview);

    try {
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.set('avatar_file', file);
      const res = await uploadAvatar(formData);

      if (res.error) {
        setSaveMessage({ type: 'error', text: res.error });
      } else if (res.avatarUrl) {
        setCurrentAvatarUrl(res.avatarUrl);
        setSaveMessage({ type: 'success', text: 'Profile photo adjusted and saved.' });
        setTimeout(() => setSaveMessage(null), 3500);
        setIsCropModalOpen(false);
        if (cropImageSrc) {
          URL.revokeObjectURL(cropImageSrc);
          setCropImageSrc(null);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setSaveMessage({ type: 'error', text: msg });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save profile settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('username', usernameInput);
      formData.set('fullName', fullNameInput);
      formData.set('bio', bioInput);

      const res = await updateProfile(formData);
      if (res.error) {
        setSaveMessage({ type: 'error', text: res.error });
      } else {
        setSaveMessage({ type: 'success', text: 'Profile settings saved.' });
        setTimeout(() => setSaveMessage(null), 3500);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* ── Top Hero Card: Identity, Avatar & Explorer Tier ───────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-xs">
        {/* Ambient subtle glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-primary/4 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Avatar with Change Trigger + Handle Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar Container with subtle interactive frame */}
            <div className="relative group shrink-0 self-start sm:self-auto">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full ring-2 ring-primary/30 bg-muted/40 shadow-sm transition-all group-hover:ring-primary/60">
                <Image
                  src={currentAvatarUrl}
                  alt={handle}
                  width={112}
                  height={112}
                  unoptimized
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                title="Change Profile Photo"
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold cursor-pointer backdrop-blur-xs"
              >
                <Camera className="h-4 w-4 mb-0.5 text-white" />
                <span>Adjust</span>
              </button>
            </div>

            {/* User Meta */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {fullNameInput || profile?.full_name || `@${handle}`}
                </h1>
                {/* Explorer Tier Pill */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${tierBadgeBg}`}>
                  <Award className="h-3.5 w-3.5 fill-current" />
                  <span>Level {tierLevel} · {tierName}</span>
                </span>
              </div>

              {/* Handle with Click-to-copy */}
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={handleCopyHandle}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors text-xs font-mono font-semibold cursor-pointer"
                  title="Copy handle"
                >
                  <span>@{handle}</span>
                  {copiedHandle ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
                <span className="text-xs text-muted-foreground font-medium">· Field Member</span>
              </div>

              {/* Bio or default motto */}
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed pt-0.5">
                {bioInput || 'Documenting uncrowded ridges, glacial valleys, and solitary footpaths across Nepal.'}
              </p>

              {/* Quick Change Avatar Trigger */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Choose Emblem or Upload Custom Photo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: XP / Tier Progress Card */}
          <div className="rounded-2xl border border-border/80 bg-background/50 p-4 sm:p-5 md:w-72 shrink-0 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>Field Karma</span>
              </span>
              <span className="font-mono font-bold text-primary">{xpPoints} XP</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-[#FF8500] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{progressPercent}% towards next rank</span>
              <span>Next: {nextTierXP} XP</span>
            </div>
          </div>
        </div>

        {/* ── Stats Strip ─────────────────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-border/60">
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 text-center">
            <p className="text-xl sm:text-2xl font-black text-foreground">{totalSubmissions}</p>
            <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Places Contributed</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 text-center">
            <p className="text-xl sm:text-2xl font-black text-emerald-500">{approvedSubmissions}</p>
            <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Verified on Map</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 text-center">
            <p className="text-xl sm:text-2xl font-black text-primary">{totalSaved}</p>
            <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Saved Waypoints</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 text-center">
            <p className="text-xl sm:text-2xl font-black text-foreground">{reviewsCount}</p>
            <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Field Notes Written</p>
          </div>
        </div>
      </div>

      {/* Global Save Feedback */}
      {saveMessage && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
            saveMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* ── Main Navigation Tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'submissions'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Gem className="h-4 w-4" />
          <span>Contributed Places ({totalSubmissions})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'saved'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>Saved Waypoints ({totalSaved})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'badges'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Field Merits</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'settings'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Dossier Settings</span>
        </button>
      </div>

      {/* ── Tab Content: My Submissions ──────────────────────────────────── */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Contributed Locations</h2>
              <p className="text-xs text-muted-foreground">
                Places you have submitted. Verified locations appear live across the interactive explore directory.
              </p>
            </div>
            <Link href="/submit">
              <Button size="sm" className="gap-1.5 h-9 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>Submit Location</span>
              </Button>
            </Link>
          </div>

          {submittedPlaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Gem className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground text-sm">No locations submitted yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Know an uncrowded river gorge, high viewpoint, or quiet woodland trail? Add it to the map for fellow explorers.
              </p>
              <Link href="/submit">
                <Button className="mt-2 text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Submit First Gem</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {submittedPlaces.map((place) => {
                const cover = place.place_images?.[0]?.image_url || '/icons/HiddenGemsNepal_Affinity.svg';
                const isApproved = place.status === 'APPROVED';
                const districtName = Array.isArray(place.districts)
                  ? place.districts[0]?.name
                  : place.districts?.name;

                return (
                  <div
                    key={place.id}
                    className="flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-md transition-shadow justify-between"
                  >
                    <div className="relative aspect-[16/10] w-full bg-muted">
                      <Image
                        src={cover}
                        alt={place.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 z-10">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Live on Map</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            <Clock className="h-3 w-3" />
                            <span>In Review</span>
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 z-10 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        💎 Score: {place.hidden_score}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-sm text-foreground line-clamp-1">{place.name}</h3>
                      {districtName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span>{districtName}</span>
                        </p>
                      )}

                      <div className="pt-2 flex items-center gap-2">
                        <Link
                          href={`/places/${place.slug}`}
                          className="inline-flex items-center justify-center gap-1.5 flex-1 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-colors"
                        >
                          <span>View Public Page</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const cardData: PlaceCardData = {
                              id: place.id,
                              name: place.name,
                              slug: place.slug,
                              status: place.status,
                              hidden_score: place.hidden_score,
                              average_rating: 0,
                              review_count: 0,
                              submitted_by: user.id,
                              categories: null,
                              districts: districtName ? { name: districtName } : null,
                              cover_image_url: cover,
                            };
                            setEditingPlace(cardData);
                          }}
                          className="h-8 px-2.5 text-xs gap-1 hover:border-primary hover:text-primary cursor-pointer"
                        >
                          <Pencil className="h-3 w-3 text-primary" />
                          <span>Edit</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Saved Wishlist ──────────────────────────────────── */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">Saved Waypoints</h2>
            <p className="text-xs text-muted-foreground">
              Bookmarked spots and trails queued for upcoming expeditions.
            </p>
          </div>

          {savedPlaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bookmark className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground text-sm">No saved waypoints yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Browse the interactive map and click the bookmark button on any location to save it here.
              </p>
              <Link href="/explore">
                <Button className="mt-2 text-xs gap-1.5">
                  <Compass className="h-3.5 w-3.5" />
                  <span>Explore Map</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {savedPlaces.map((row) => {
                const place = Array.isArray(row.places) ? row.places[0] : row.places;
                if (!place) return null;
                const cover = place.place_images?.[0]?.image_url || '/icons/HiddenGemsNepal_Affinity.svg';
                const districtName = Array.isArray(place.districts)
                  ? place.districts[0]?.name
                  : place.districts?.name;

                return (
                  <Link
                    key={place.id}
                    href={`/places/${place.slug}`}
                    className="group flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-md hover:border-primary/50 transition-all justify-between"
                  >
                    <div className="relative aspect-[16/10] w-full bg-muted">
                      <Image
                        src={cover}
                        alt={place.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5 z-10 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        ★ {place.average_rating && place.average_rating > 0 ? place.average_rating.toFixed(1) : 'New'}
                      </div>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {place.name}
                      </h3>
                      {districtName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span>{districtName}</span>
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Field Merits & Badges ───────────────────────────── */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">Field Merits & Achievements</h2>
            <p className="text-xs text-muted-foreground">
              Earned through verified trail documentation, accurate coordinates, and genuine traveler insights.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Badge 1 */}
            <div className={`p-5 rounded-2xl border ${totalSubmissions >= 1 ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-muted/20 opacity-60'} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">🏔️</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${totalSubmissions >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {totalSubmissions >= 1 ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-foreground">Himalayan Pioneer</h4>
              <p className="text-xs text-muted-foreground">Recorded and documented your first solitary place on the map.</p>
            </div>

            {/* Badge 2 */}
            <div className={`p-5 rounded-2xl border ${totalSaved >= 3 ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-muted/20 opacity-60'} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">🧭</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${totalSaved >= 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {totalSaved >= 3 ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-foreground">Trail Scout</h4>
              <p className="text-xs text-muted-foreground">Bookmarked three or more remote destinations for future treks.</p>
            </div>

            {/* Badge 3 */}
            <div className={`p-5 rounded-2xl border ${approvedSubmissions >= 1 ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-muted/20 opacity-60'} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">🎖️</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${approvedSubmissions >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {approvedSubmissions >= 1 ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-foreground">Verified Contributor</h4>
              <p className="text-xs text-muted-foreground">First submitted location authenticated and published live.</p>
            </div>

            {/* Badge 4 */}
            <div className={`p-5 rounded-2xl border ${reviewsCount >= 1 ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-muted/20 opacity-60'} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">✍️</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${reviewsCount >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {reviewsCount >= 1 ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-foreground">Field Chronicler</h4>
              <p className="text-xs text-muted-foreground">Provided essential trail notes, access warnings, or season advice.</p>
            </div>

            {/* Badge 5 */}
            <div className={`p-5 rounded-2xl border ${tierLevel >= 3 ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-muted/20 opacity-60'} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">⚡</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierLevel >= 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {tierLevel >= 3 ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-foreground">High Pass Trailblazer</h4>
              <p className="text-xs text-muted-foreground">Achieved Tier 3 ranking through consistent high-integrity contributions.</p>
            </div>

            {/* Badge 6 */}
            <div className={`p-5 rounded-2xl border ${tierLevel >= 5 ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-muted/20 opacity-60'} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">👑</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierLevel >= 5 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {tierLevel >= 5 ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-foreground">Everest Legend</h4>
              <p className="text-xs text-muted-foreground">Foremost contributor guiding the platform’s high-altitude directory.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Content: Explorer Settings ───────────────────────────────── */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">Dossier Details</h2>
            <p className="text-xs text-muted-foreground">
              Manage your public explorer handle, display name, and bio displayed on verified reviews.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold">
                Explorer Handle (@username) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">@</span>
                <Input
                  id="username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. wanderer_kathmandu"
                  className="pl-8 text-xs font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                3–20 characters. Lowercase letters, numbers, and underscores only.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-semibold">
                Full Display Name
              </Label>
              <Input
                id="fullName"
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs font-semibold">
                Field Notes & Bio
              </Label>
              <textarea
                id="bio"
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                rows={3}
                placeholder="A brief note on your travels — favorite altitudes, solitary trails, or local valleys you know best…"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Avatar Option shortcut inside settings */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-primary/30 bg-muted shrink-0">
                <Image
                  src={currentAvatarUrl}
                  alt={handle}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Profile Emblem / Photo</p>
                <p className="text-[11px] text-muted-foreground">Upload from gallery or select from 10 handcrafted emblems</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAvatarModalOpen(true)}
              className="text-xs shrink-0"
            >
              Choose Emblem
            </Button>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} className="gap-2 px-6">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes…</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Save Settings</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* ── Avatar Selection Modal ───────────────────────────────────────── */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Select Profile Emblem or Photo</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload an image from your device gallery to frame and adjust, or choose from our 10 handcrafted emblems.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Option 1: Upload from Gallery / Device */}
            <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 sm:p-5 transition-colors hover:bg-primary/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-foreground">
                      Upload Photo from Gallery
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Select a photograph to adjust and scale inside the circular frame (JPG, PNG, WebP up to 12MB)
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={isUploadingAvatar}
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="gap-2 h-9 text-xs px-4"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Upload from Gallery</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Option 2: 10 Handcrafted Explorer Emblems */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                10 Explorer Emblems
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {NEPAL_AVATAR_PRESETS.map((preset) => {
                  const isSelected = currentAvatarUrl === preset.url;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectAvatar(preset.url)}
                      className={`group flex flex-col items-center text-center p-3 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 bg-primary/5'
                          : 'border-border/70 hover:border-primary/50 hover:bg-muted/40'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary text-white flex items-center justify-center text-[9px] shadow-xs">
                          ✓
                        </div>
                      )}

                      <div className="relative h-16 w-16 sm:h-18 sm:w-18 overflow-hidden rounded-full ring-2 ring-border/80 group-hover:ring-primary/40 transition-all mb-2 shadow-xs">
                        <Image
                          src={preset.url}
                          alt={preset.name}
                          width={72}
                          height={72}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <p className="text-xs font-bold text-foreground line-clamp-1">{preset.name}</p>
                      <p className="text-[10px] text-primary font-semibold line-clamp-1">{preset.tag}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAvatarModalOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Circular Frame Crop & Adjuster Dialog ─────────────────────────── */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => {
          setIsCropModalOpen(false);
          if (cropImageSrc) {
            URL.revokeObjectURL(cropImageSrc);
            setCropImageSrc(null);
          }
        }}
        onConfirm={handleCropConfirmed}
        isUploading={isUploadingAvatar}
      />
      {/* ── Destination Details Edit Modal ──────────────────────────────── */}
      {editingPlace && (
        <EditPlaceModal
          isOpen={Boolean(editingPlace)}
          onClose={() => setEditingPlace(null)}
          place={editingPlace}
        />
      )}
    </div>
  );
}
