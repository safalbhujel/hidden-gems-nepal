// components/admin/ReportsClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ExternalLink } from 'lucide-react';
import type { AdminReport } from '@/lib/admin/types';
import { Button } from '@/components/ui/button';

interface ReportsClientProps {
  initialReports: AdminReport[];
}

export function ReportsClient({ initialReports }: ReportsClientProps) {
  const [reports, setReports] = useState(initialReports);

  function handleResolve(id: string) {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'RESOLVED' } : r))
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
            <span>/</span>
            <span className="text-foreground">Reports</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Community Flagged Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            User reports on duplicate locations, shifted GPS coordinates, and trail closures.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                  {report.reason}
                </span>
                <span className="text-xs text-muted-foreground font-mono">{report.created_at}</span>
              </div>

              <Link
                href={`/places/${report.place_slug}`}
                target="_blank"
                className="font-bold text-sm text-foreground hover:text-primary inline-flex items-center gap-1.5"
              >
                <span>{report.place_name}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Link>

              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                {report.details}
              </p>

              <p className="text-[11px] text-muted-foreground">
                Reported by: <span className="font-semibold text-foreground">{report.reported_by}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {report.status !== 'RESOLVED' ? (
                <Button
                  size="sm"
                  onClick={() => handleResolve(report.id)}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Mark Resolved</span>
                </Button>
              ) : (
                <span className="rounded-xl bg-emerald-500/10 text-emerald-600 px-3 py-1 text-xs font-bold">
                  Resolved
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
