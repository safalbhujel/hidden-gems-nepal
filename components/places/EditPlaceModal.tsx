'use client';

import { useState, useTransition } from 'react';
import { X, Save, Loader2, MapPin, Compass, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updatePlaceAction } from '@/app/places/actions';
import type { Category, District, PlaceCardData, Place } from '@/lib/types/places';
import { useRouter } from 'next/navigation';

interface EditPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: PlaceCardData | Place;
  categories?: Category[];
  districts?: District[];
  isAdmin?: boolean;
}

export function EditPlaceModal({
  isOpen,
  onClose,
  place,
  categories = [],
  districts = [],
  isAdmin = false,
}: EditPlaceModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states initialized from place
  const initialCatId =
    'category_id' in place && place.category_id
      ? place.category_id
      : place.categories && 'id' in place.categories && place.categories.id
        ? place.categories.id
        : '';

  const initialDistId =
    'district_id' in place && place.district_id
      ? place.district_id
      : place.districts && 'id' in place.districts && place.districts.id
        ? place.districts.id
        : '';

  const [name, setName] = useState(place.name || '');
  const [categoryId, setCategoryId] = useState(initialCatId);
  const [districtId, setDistrictId] = useState(initialDistId);
  const [hiddenScore, setHiddenScore] = useState(place.hidden_score || 80);
  const [description, setDescription] = useState(place.description || '');
  const [whySpecial, setWhySpecial] = useState(place.why_special || '');
  const [bestSeason, setBestSeason] = useState(place.best_season || 'Autumn (Oct – Dec)');
  const [budget, setBudget] = useState(place.budget || 'Moderate');
  const [travelTips, setTravelTips] = useState(place.travel_tips || '');
  const [address, setAddress] = useState(place.map_url || '');
  const [latitude, setLatitude] = useState(
    place.latitude !== null && place.latitude !== undefined ? place.latitude.toString() : ''
  );
  const [longitude, setLongitude] = useState(
    place.longitude !== null && place.longitude !== undefined ? place.longitude.toString() : ''
  );
  const [status, setStatus] = useState(place.status || 'PENDING');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('placeId', place.id);
    formData.append('name', name);
    formData.append('category_id', categoryId);
    formData.append('district_id', districtId);
    formData.append('hidden_score', hiddenScore.toString());
    formData.append('description', description);
    formData.append('why_special', whySpecial);
    formData.append('best_season', bestSeason);
    formData.append('budget', budget);
    formData.append('travel_tips', travelTips);
    formData.append('map_url', address);
    if (latitude) formData.append('latitude', latitude);
    if (longitude) formData.append('longitude', longitude);
    if (isAdmin) formData.append('status', status);

    startTransition(async () => {
      const res = await updatePlaceAction(formData);
      if (res.success) {
        setSuccessMsg(res.message || 'Updated successfully.');
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 900);
      } else {
        setErrorMsg(res.error || 'Failed to save changes.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-border/80 bg-card p-6 text-foreground shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Edit Destination Details
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update trail documentation, location coordinates, and practical notes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Bar for Admins */}
          {isAdmin && (
            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <ShieldCheck className="h-4 w-4" />
                <span>Moderation Verification Status</span>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="PENDING">PENDING (Unverified)</option>
                <option value="APPROVED">APPROVED (Verified Tickmark)</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          )}

          {/* Core Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Core Identity
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Destination Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tsho Rolpa Glacial Lake"
                className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select a category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">District</label>
                <select
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select district…</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Hiddenness Index Score (1–100)
                </label>
                <span className="text-xs font-mono font-bold text-primary">{hiddenScore}</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={hiddenScore}
                onChange={(e) => setHiddenScore(parseInt(e.target.value, 10))}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground">
                Higher scores represent remote, untouched, solitary sanctuaries.
              </p>
            </div>
          </div>

          {/* Description & Narrative */}
          <div className="space-y-4 pt-2 border-t border-border/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Narrative & Character
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Detailed Description <span className="text-primary">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the setting, natural atmosphere, and history…"
                className="w-full p-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Why It&apos;s Special</label>
              <textarea
                rows={2}
                value={whySpecial}
                onChange={(e) => setWhySpecial(e.target.value)}
                placeholder="What distinguishes this spot from conventional tourist routes?"
                className="w-full p-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              />
            </div>
          </div>

          {/* Coordinates & Location */}
          <div className="space-y-4 pt-2 border-t border-border/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>Location & Geographic Coordinates</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Landmark / Local Area</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Rolwaling Valley, Gaurishankar Conservation Area"
                className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="27.8312"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="86.4715"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Expedition Advisory */}
          <div className="space-y-4 pt-2 border-t border-border/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-primary" />
              <span>Expedition Field Notes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Optimal Season</label>
                <select
                  value={bestSeason}
                  onChange={(e) => setBestSeason(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="Spring (Mar – May)">Spring (Mar – May)</option>
                  <option value="Autumn (Oct – Dec)">Autumn (Oct – Dec)</option>
                  <option value="Winter (Dec – Feb)">Winter (Dec – Feb)</option>
                  <option value="Monsoon / Green (Jun – Aug)">Monsoon / Green (Jun – Aug)</option>
                  <option value="Year-round">Year-round accessible</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Estimated Budget</label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="Free / Minimal">Free / Minimal</option>
                  <option value="Budget (Under NPR 1,500/day)">Budget (Under NPR 1,500/day)</option>
                  <option value="Moderate (NPR 1,500 – 4,000/day)">Moderate (NPR 1,500 – 4,000/day)</option>
                  <option value="Expedition (NPR 4,000+/day)">Expedition (NPR 4,000+/day)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Insider Advice & Travel Tips</label>
              <textarea
                rows={2}
                value={travelTips}
                onChange={(e) => setTravelTips(e.target.value)}
                placeholder="Vehicle ground clearance, gear requirements, homestay contacts, water sources…"
                className="w-full p-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="gap-2 px-5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving Updates…</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
