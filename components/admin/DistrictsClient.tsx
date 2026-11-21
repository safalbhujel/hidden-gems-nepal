// components/admin/DistrictsClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Map, ChevronDown, ChevronRight, Download, MapPin } from 'lucide-react';
import type { AdminProvinceGroup } from '@/lib/admin/types';
import { Button } from '@/components/ui/button';

interface DistrictsClientProps {
  provinces: AdminProvinceGroup[];
}

export function DistrictsClient({ provinces: initialProvinces }: DistrictsClientProps) {
  const [provinces, setProvinces] = useState(initialProvinces);
  const [expandedProvinces, setExpandedProvinces] = useState<string[]>(
    initialProvinces.slice(0, 3).map((p) => p.id)
  );

  function toggleProvince(id: string) {
    setExpandedProvinces((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function handleToggleDistrict(provId: string, distId: string) {
    setProvinces((prev) =>
      prev.map((prov) => {
        if (prov.id !== provId) return prov;
        return {
          ...prov,
          districts: prov.districts.map((d) =>
            d.id === distId ? { ...d, is_enabled: !d.is_enabled } : d
          ),
        };
      })
    );
  }

  function handleExportDistrictCSV() {
    const rows = [
      ['Province', 'District', 'Status', 'Gems Count'],
      ...provinces.flatMap((p) =>
        p.districts.map((d) => [
          `"${p.name}"`,
          `"${d.name}"`,
          d.is_enabled ? 'Enabled' : 'Disabled',
          d.place_count,
        ])
      ),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nepal_77_districts_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
            <span>/</span>
            <span className="text-foreground">Districts & Provinces</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            77 Districts Geopolitical Registry
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Geospatial coverage organized by the 7 Provinces of Nepal. Enable or disable submission intake per district.
          </p>
        </div>

        <Button
          onClick={handleExportDistrictCSV}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-semibold"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export District Stats</span>
        </Button>
      </div>

      {/* ── Province Accordions ─────────────────────────────────────── */}
      <div className="space-y-3">
        {provinces.map((prov) => {
          const isExpanded = expandedProvinces.includes(prov.id);

          return (
            <div
              key={prov.id}
              className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs transition-all"
            >
              {/* Province Header */}
              <button
                type="button"
                onClick={() => toggleProvince(prov.id)}
                className="flex w-full items-center justify-between p-4 px-5 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Map className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {prov.name} Province
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {prov.districts.length} Districts · {prov.place_count} total verified gems
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs font-mono">
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* Districts Sub-Grid */}
              {isExpanded && (
                <div className="border-t border-border/60 bg-muted/20 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {prov.districts.map((dist) => (
                      <div
                        key={dist.id}
                        className="flex items-center justify-between rounded-xl border border-border/70 bg-background/90 p-3 text-xs shadow-2xs"
                      >
                        <div>
                          <p className="font-bold text-foreground">{dist.name}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {dist.place_count} gems mapped
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/gems?district=${encodeURIComponent(dist.slug)}`}
                            className="rounded-lg p-1 text-muted-foreground hover:text-primary transition-colors"
                            title="Filter gems in this district"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleToggleDistrict(prov.id, dist.id)}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                              dist.is_enabled
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-500/10 text-red-600'
                            }`}
                          >
                            {dist.is_enabled ? 'Active' : 'Off'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
