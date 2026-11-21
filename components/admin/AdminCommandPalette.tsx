// components/admin/AdminCommandPalette.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  MapPin,
  Clock,
  Tag,
  Map,
  MessageSquare,
  Star,
  Settings,
  ExternalLink,
  X,
  ArrowRight,
} from 'lucide-react';

interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ROUTES = [
  { label: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, category: 'Navigation' },
  { label: 'All Destinations & Gems', href: '/admin/gems', icon: MapPin, category: 'Navigation' },
  { label: 'Pending Approvals Queue', href: '/admin/pending', icon: Clock, category: 'Navigation' },
  { label: 'Categories Management', href: '/admin/categories', icon: Tag, category: 'Navigation' },
  { label: '77 Districts & Provinces', href: '/admin/districts', icon: Map, category: 'Navigation' },
  { label: 'Review Moderation', href: '/admin/reviews', icon: MessageSquare, category: 'Navigation' },
  { label: 'Featured Spotlight Manager', href: '/admin/featured', icon: Star, category: 'Navigation' },
  { label: 'Platform Settings', href: '/admin/settings', icon: Settings, category: 'Navigation' },
  { label: 'Public Interactive Map', href: '/explore', icon: ExternalLink, category: 'Live Site' },
];

export function AdminCommandPalette({ isOpen, onClose }: AdminCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = QUICK_ROUTES.filter((r) =>
    r.label.toLowerCase().includes(query.toLowerCase().trim())
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      } else if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filtered[selectedIndex]) {
            router.push(filtered[selectedIndex].href);
            onClose();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-background/98 p-0 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center border-b border-border/80 px-4 py-3">
          <Search className="h-4 w-4 text-primary shrink-0 mr-3" strokeWidth={1.75} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands, destinations, or admin screens..."
            className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands or routes found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-foreground hover:bg-muted/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] opacity-75">
                    <span>{item.category}</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          <span>Navigation: ↑↓ to navigate · Enter to select · Esc to close</span>
          <span className="font-semibold text-primary">HiddenGems Nepal Admin</span>
        </div>
      </div>
    </div>
  );
}
