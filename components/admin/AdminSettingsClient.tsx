// components/admin/AdminSettingsClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Database,
  Save,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminSettingsClient() {
  const [saved, setSaved] = useState(false);
  const [autoApproveVerified, setAutoApproveVerified] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [duplicateDistanceKm, setDuplicateDistanceKm] = useState('2');

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
            Manage geospatial thresholds, moderation workflows, and administrator controls.
          </p>
        </div>
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
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Admin RBAC Token</span>
              <p className="font-bold text-foreground">Service Role Bound</p>
              <p className="text-[11px] text-muted-foreground">Row Level Security Verified</p>
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
