// components/admin/RejectionReasonModal.tsx

'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminPlace } from '@/lib/admin/types';
import { rejectGemAction } from '@/lib/admin/actions';

interface RejectionReasonModalProps {
  place: AdminPlace | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (placeId: string, reason: string) => void;
}

const REJECTION_PRESETS = [
  'Duplicate submission: Place already documented on HiddenGems Nepal',
  'Inaccurate or incomplete geographic coordinates',
  'Commercial / tourist-overcrowded spot (not a hidden gem)',
  'Low quality or insufficient imagery / unverified claims',
  'Private property / restricted environmental reserve without permit',
  'Other / Custom reason',
];

export function RejectionReasonModal({
  place,
  isOpen,
  onClose,
  onSuccess,
}: RejectionReasonModalProps) {
  const [selectedPreset, setSelectedPreset] = useState(REJECTION_PRESETS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !place) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!place) return;

    const finalReason =
      selectedPreset === 'Other / Custom reason'
        ? customReason.trim() || 'Submission rejected by moderator'
        : selectedPreset;

    setIsSubmitting(true);
    await rejectGemAction(place.id, finalReason);
    setIsSubmitting(false);
    onSuccess(place.id, finalReason);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border/80 bg-background/98 p-5 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-bold text-sm tracking-tight text-foreground">
              Reject Gem Submission
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-foreground">
              Place: <span className="text-primary font-bold">{place.name}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Submitted by @{place.submitter?.username || 'user'} · {place.district?.name}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Reason for Rejection (sent to contributor)
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30"
            >
              {REJECTION_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>

          {selectedPreset === 'Other / Custom reason' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Custom Feedback Note
              </label>
              <textarea
                rows={3}
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain why this gem cannot be verified or published..."
                className="w-full rounded-xl border border-border/80 bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs"
            >
              {isSubmitting ? 'Rejecting...' : 'Reject & Notify'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
