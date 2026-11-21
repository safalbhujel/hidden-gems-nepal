'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { Category, District } from '@/lib/types/places';
import { LocationPickerMap, type Coordinates, type LocationDetails } from '@/components/maps/LocationPickerMap';
import { submitPlace } from '@/app/submit/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SubmitGemFormProps {
  categories: Category[];
  districts: District[];
}

export function SubmitGemForm({ categories, districts }: SubmitGemFormProps) {
  const router = useRouter();

  const [coords, setCoords] = useState<Coordinates>({ lat: 27.7172, lng: 85.324 }); // Default: Kathmandu
  const [address, setAddress] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set('latitude', String(coords.lat));
    formData.set('longitude', String(coords.lng));
    formData.set('address', address);

    const res = await submitPlace(formData);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.success) {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold">Gem Submitted for Review!</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Thank you for contributing to HiddenGems Nepal! Our local moderators will verify the
          details and publish it to the explore map shortly.
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => router.push('/explore')} variant="default">
            Explore All Gems
          </Button>
          <Button onClick={() => setIsSuccess(false)} variant="outline">
            Submit Another Gem
          </Button>
        </div>
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

      {/* ── Section 1: Basic Information ───────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
          <span>1. Gem Identity</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Place Name *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. Tindhare Jharna, Secret River Beach"
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
              <option value="">Select a category</option>
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
            placeholder="e.g. Looks just like the Jurassic Park waterfall; completely empty on weekdays."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Detailed Description *</Label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            placeholder="Share the full vibe, what to expect, and how you discovered it…"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* ── Section 2: Interactive Map Location Picker ─────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              <span>2. Pin the Exact Location</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use search, click &quot;Near Me&quot;, or drag the pin right onto the trail, waterfall, or cafe.
            </p>
          </div>
          <div className="font-mono text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md self-start sm:self-auto">
            {coords.lat.toFixed(5)}° N, {coords.lng.toFixed(5)}° E
          </div>
        </div>

        {/* The Live Interactive Map */}
        <LocationPickerMap
          value={coords}
          onChange={setCoords}
          onLocationDetails={handleLocationDetails}
          className="h-[460px] md:h-[520px] w-full"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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

      {/* ── Section 3: Explorer Tips & Logistics ───────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-foreground">3. Practical Tips</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Estimated Budget</Label>
            <Input id="budget" name="budget" placeholder="e.g. Free, NPR 500 - 1000" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="best_season">Best Season / Time</Label>
            <Input id="best_season" name="best_season" placeholder="e.g. Autumn / Spring, Early Morning" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="travel_tips">Insider Tips for Visitors</Label>
          <textarea
            id="travel_tips"
            name="travel_tips"
            rows={2}
            placeholder="e.g. Wear waterproof boots, best tea stall is right across the bridge…"
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
              <span>Submitting Gem…</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Submit for Moderation</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
