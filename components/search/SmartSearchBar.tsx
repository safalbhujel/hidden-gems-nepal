'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, TrendingUp, MapPin, Compass } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Suggestion {
  slug: string
  name: string
  district: string | null
  category: string | null
}

function fuzzyScore(text: string, query: string): number {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 60
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++
  }
  return qi === q.length ? 30 : 0
}

const TRENDING = [
  { label: 'Hidden waterfalls', query: 'waterfall' },
  { label: 'Rooftop cafes', query: 'cafe' },
  { label: 'Secret viewpoints', query: 'viewpoint' },
  { label: 'Village trails', query: 'trail' },
]

interface SmartSearchBarProps {
  placeholder?: string
  className?: string
}

export function SmartSearchBar({ placeholder = 'Search hidden cafes, waterfalls, districts…', className }: SmartSearchBarProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setLoading(false); return }
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('places')
      .select('slug, name, districts ( name ), categories ( name )')
      .eq('status', 'APPROVED')
      .or('name.ilike.%' + q.trim() + '%,description.ilike.%' + q.trim() + '%')
      .limit(8)
    setLoading(false)
    if (error || !data) return
    const ranked = data.map((row) => {
      const dist = Array.isArray(row.districts) ? row.districts[0] : row.districts
      const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
      return { slug: row.slug, name: row.name, district: dist?.name ?? null, category: cat?.name ?? null, score: fuzzyScore(row.name, q) }
    }).sort((a, b) => b.score - a.score)
    setSuggestions(ranked)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) fetchSuggestions(query)
      else { setSuggestions([]); setLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, fetchSuggestions])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navigate = useCallback((q: string) => {
    if (!q.trim()) return
    setOpen(false)
    router.push('/explore?search=' + encodeURIComponent(q.trim()))
  }, [router])

  const navigateToSlug = useCallback((slug: string) => {
    setOpen(false)
    router.push('/places/' + slug)
  }, [router])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = query.trim().length >= 2 ? suggestions : []
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0 && items[activeIdx]) navigateToSlug(items[activeIdx].slug); else navigate(query) }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }

  const showSuggestions = open && query.trim().length >= 2 && suggestions.length > 0
  const showTrending = open && query.trim().length === 0

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        {loading
          ? <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin pointer-events-none z-10" />
          : <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
        }
        {/*
          Flat-By-Default: removed shadow-lg from the input.
          Focus state uses border-primary + ring token for clear feedback.
          border-2 provides clear structural definition without needing shadow.
        */}
        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder={placeholder}
          aria-label="Search places"
          aria-expanded={open}
          className="w-full pl-12 pr-32 h-14 text-base rounded-full border-2 border-border bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground transition-colors"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {/* Search button — uses bg-primary token */}
        <button
          type="button"
          onClick={() => navigate(query)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary hover:bg-primary/90 h-10 px-6 font-semibold text-primary-foreground text-sm transition-colors"
        >
          Search
        </button>
      </div>

      {(showSuggestions || showTrending) && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          {/*
            Dropdown is a floating popover — one of the two permitted uses of
            elevation per the Flat-By-Default rule. Uses border + bg-background
            for definition; no shadow-xl.
          */}
          <div className="bg-background border border-border rounded-xl overflow-hidden divide-y divide-border">
            {showTrending && (
              <div className="p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                  Popular Searches
                </p>
                <ul>
                  {TRENDING.map((t) => (
                    <li key={t.query}>
                      <button type="button" onClick={() => { setQuery(t.query); navigate(t.query) }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left">
                        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{t.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {showSuggestions && (
              <div className="p-2">
                <ul>
                  {suggestions.map((s, i) => (
                    <li key={s.slug}>
                      <button
                        type="button"
                        onClick={() => navigateToSlug(s.slug)}
                        onMouseEnter={() => setActiveIdx(i)}
                        className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left', i === activeIdx ? 'bg-primary/5' : 'hover:bg-muted')}
                      >
                        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                          <Compass className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{s.name}</p>
                          {(s.district || s.category) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              {s.district && <><MapPin className="h-3 w-3 flex-shrink-0" />{s.district}</>}
                              {s.district && s.category && <span>·</span>}
                              {s.category && <span>{s.category}</span>}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => navigate(query)}
                  className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-primary font-semibold hover:bg-primary/5 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  Search all results for &ldquo;{query}&rdquo;
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}