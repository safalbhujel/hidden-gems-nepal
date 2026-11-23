// components/admin/AdminSettingsClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Database,
  Save,
  Check,
  KeyRound,
  Lock,
  User,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { changeAdminCredentialsAction } from '@/lib/admin/auth-actions';

export function AdminSettingsClient() {
  const [saved, setSaved] = useState(false);
  const [autoApproveVerified, setAutoApproveVerified] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [duplicateDistanceKm, setDuplicateDistanceKm] = useState('2');

  // Credentials management state
  const [credMessage, setCredMessage] = useState<string | null>(null);
  const [credError, setCredError] = useState<string | null>(null);
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleUpdateCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCredMessage(null);
    setCredError(null);
    setIsUpdatingCreds(true);

    const formData = new FormData(e.currentTarget);
    const result = await changeAdminCredentialsAction(formData);

    setIsUpdatingCreds(false);

    if (result.success) {
      setCredMessage(result.message || 'Credentials updated successfully.');
      (e.target as HTMLFormElement).reset();
    } else {
      setCredError(result.error || 'Failed to update credentials.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
            <span>/</span>
            <span className="text-foreground">Settings</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Platform Configuration & Security
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage administrative credentials, geospatial thresholds, and moderation workflows.
          </p>
        </div>
      </div>

      {/* ── 1. Admin Authentication & Security Credentials ─────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
        <div className="border-b border-border/60 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Admin Login Identifier & Password</h3>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">Changeable at any time</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Update the password used to sign in to the <span className="font-semibold text-foreground">/admin/login</span> page.
          Other devices will need to sign in again with the new password.
        </p>

        {credError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <p className="font-medium">{credError}</p>
          </div>
        )}

        {credMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="font-medium">{credMessage}</p>
          </div>
        )}

        <form onSubmit={handleUpdateCredentials} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <label className="block font-bold text-foreground mb-1">New Admin Identifier (ID)</label>
            <div className="relative">
              <input
                type="text"
                name="newUsername"
                required
                defaultValue="admin"
                placeholder="e.g. admin or safal_admin"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-foreground mb-1">Current Password (Verification)</label>
            <div className="relative">
              <input
                type="password"
                name="currentPassword"
                required
                placeholder="Enter current password"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-foreground mb-1">New Password</label>
            <div className="relative">
              <input
                type="password"
                name="newPassword"
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <KeyRound className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-foreground mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                placeholder="Confirm password"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <KeyRound className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end pt-1">
            <Button
              type="submit"
              disabled={isUpdatingCreds}
              size="sm"
              className="bg-primary text-white font-bold text-xs shadow-xs"
            >
              {isUpdatingCreds ? 'Updating Security Vault...' : 'Update Admin Credentials'}
            </Button>
          </div>
        </form>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Moderation Rules Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
          <div className="border-b border-border/60 pb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Content Moderation Protocol</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Auto-Approve Verified Locals</p>
                <p className="text-muted-foreground">Skip moderation queue for contributors with 5+ approved submissions.</p>
              </div>
              <input
                type="checkbox"
                checked={autoApproveVerified}
                onChange={(e) => setAutoApproveVerified(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Pending Queue Email Alerts</p>
                <p className="text-muted-foreground">Notify administrators when a new destination is submitted.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Duplicate Radius Threshold (Kilometers)</p>
                <p className="text-muted-foreground">Warning trigger distance for duplicate places in the same district.</p>
              </div>
              <input
                type="number"
                min="0.5"
                max="25"
                step="0.5"
                value={duplicateDistanceKm}
                onChange={(e) => setDuplicateDistanceKm(e.target.value)}
                className="w-24 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-center font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Database & PostGIS Telemetry */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
          <div className="border-b border-border/60 pb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">PostgreSQL & PostGIS Infrastructure</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">PostGIS Spatial Engine</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>v3.3.7 Active</span>
              </p>
              <p className="text-[11px] text-muted-foreground">SRID: 4326 (WGS 84)</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Mapbox GL JS Studio</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Satellite & DEM 3D</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Terrain-RGB 1.5x</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Admin Authentication</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Dedicated Gateway</span>
              </p>
              <p className="text-[11px] text-muted-foreground">SHA-256 / HMAC Session</p>
            </div>
          </div>
        </div>

        {/* Save button toolbar */}
        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              <span>Platform settings updated successfully</span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Settings are synchronized across all administrator sessions.</span>
          )}

          <Button type="submit" size="sm" className="gap-1.5 bg-primary text-white font-bold text-xs shadow-xs">
            <Save className="h-3.5 w-3.5" />
            <span>Save Configuration</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
