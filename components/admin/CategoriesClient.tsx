// components/admin/CategoriesClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';
import type { AdminCategory } from '@/lib/admin/types';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/icons/CategoryIcon';

interface CategoriesClientProps {
  initialCategories: AdminCategory[];
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleToggleActive(id: string) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c))
    );
  }

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const newCat: AdminCategory = {
      id: `cat-${Date.now()}`,
      name,
      slug,
      description: description || 'Curated adventure classification',
      icon: null,
      is_active: true,
      place_count: 0,
    };

    setCategories((prev) => [...prev, newCat]);
    setName('');
    setDescription('');
    setIsAddOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
            <span>/</span>
            <span className="text-foreground">Categories</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Vibe & Experience Categories
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure primary classifications and discovery taxonomy for HiddenGems Nepal.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          size="sm"
          className="gap-1.5 bg-primary text-white font-bold text-xs shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Category</span>
        </Button>
      </div>

      {/* ── Categories Table ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/80 bg-muted/40 font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
            <tr>
              <th className="px-4 py-3">Icon & Category</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Mapped Gems</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Toggle Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CategoryIcon slug={cat.slug} name={cat.name} icon={cat.icon} className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-foreground">{cat.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                  /{cat.slug}
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                  {cat.description || '—'}
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">
                  {cat.place_count} gems
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      cat.is_active
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {cat.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(cat.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors ${
                      cat.is_active
                        ? 'border-border text-muted-foreground hover:bg-muted'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                    }`}
                  >
                    {cat.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Add Category Modal ──────────────────────────────────────── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-background/98 p-5 shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <h3 className="font-bold text-sm text-foreground">Add New Category</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alpine Sanctuaries"
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short tagline for discovery filter chips..."
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-white font-bold">
                  Create Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
