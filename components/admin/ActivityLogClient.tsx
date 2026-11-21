// components/admin/ActivityLogClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import type { AdminActivityItem } from '@/lib/admin/types';
import { Button } from '@/components/ui/button';

interface ActivityLogClientProps {
  initialActivity: AdminActivityItem[];
}

export function ActivityLogClient({ initialActivity }: ActivityLogClientProps) {
  const [activities] = useState<AdminActivityItem[]>(initialActivity);

  function handleExportCSV() {
    const rows = [
      ['Timestamp', 'Admin', 'Action', 'Target', 'Details'],
      ...activities.map((a) => [
        `"${a.timestamp}"`,
        `"${a.admin_name}"`,
        `"${a.action}"`,
        `"${a.target.replace(/"/g, '""')}"`,
        `"${(a.details || '').replace(/"/g, '""')}"`,
      ]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hgn_audit_activity_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
            <span>/</span>
            <span className="text-foreground">Activity Log</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Audit Trail & System Telemetry
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable log of administrative decisions, content approvals, and role actions.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-semibold"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Audit Log (CSV)</span>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/80 bg-muted/40 font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Administrator</th>
              <th className="px-4 py-3">Action Type</th>
              <th className="px-4 py-3">Target Entity</th>
              <th className="px-4 py-3">Audit Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">No audit activity logged yet</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    System operations and moderation decisions will record here in real-time.
                  </p>
                </td>
              </tr>
            ) : (
              activities.map((act) => (
                <tr key={act.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    {act.timestamp}
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">
                    {act.admin_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold uppercase">
                      {act.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground/90">
                    {act.target}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {act.details || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
