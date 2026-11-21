'use client';

import { ExternalLink, Play, Video, Globe } from 'lucide-react';
import {
  type MediaSource,
  getPlatformLabel,
  getPlatformActionText,
  getYouTubeEmbedUrl,
} from '@/lib/utils/media';

interface PlaceSocialMediaSourcesProps {
  sources: MediaSource[];
  placeName: string;
}

function PlatformIcon({ platform }: { platform: MediaSource['platform'] }) {
  switch (platform) {
    case 'instagram':
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97v7.54c-.01 2.22-.72 4.44-2.07 6.17-1.35 1.74-3.32 2.94-5.5 3.32-2.18.39-4.5-.04-6.38-1.18-1.88-1.14-3.27-2.98-3.83-5.11-.56-2.13-.26-4.46.82-6.37 1.09-1.91 2.89-3.35 5.01-3.97.74-.22 1.52-.33 2.3-.33.2 0 .4 0 .6.03v4.1c-.56-.12-1.15-.14-1.72-.03-1.14.22-2.13.88-2.73 1.84-.6 1-.74 2.21-.38 3.32.36 1.11 1.18 2.01 2.25 2.47 1.07.46 2.32.46 3.39 0 1.07-.46 1.89-1.36 2.25-2.47.16-.5.23-1.03.23-1.57V.02h.67z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'video':
      return <Video className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
}

function getPlatformBadgeClasses(platform: MediaSource['platform']): string {
  switch (platform) {
    case 'instagram':
      return 'bg-gradient-to-r from-[#833AB4]/20 via-[#FD1D1D]/20 to-[#FCB045]/20 text-rose-500 border-rose-500/30 dark:text-rose-400';
    case 'tiktok':
      return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30 dark:text-cyan-400';
    case 'youtube':
      return 'bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400';
    case 'facebook':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400';
    case 'twitter':
      return 'bg-zinc-800/10 text-zinc-800 border-zinc-700/30 dark:bg-zinc-800 dark:text-zinc-200';
    case 'video':
      return 'bg-[#FF8500]/10 text-[#FF8500] border-[#FF8500]/30';
    default:
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400';
  }
}

export function PlaceSocialMediaSources({ sources, placeName }: PlaceSocialMediaSourcesProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <section className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Play className="h-5 w-5 text-primary fill-primary" />
            <span>Community Footage & Social Sources</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Original creator videos, reels, and stories documenting {placeName}. Click through to support and view the full posts.
          </p>
        </div>
        <span className="text-xs font-semibold text-muted-foreground self-start sm:self-auto">
          {sources.length} {sources.length === 1 ? 'source' : 'sources'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((source, index) => {
          const ytEmbed = getYouTubeEmbedUrl(source.url);
          const isDirectVideo = source.platform === 'video';

          return (
            <div
              key={`${source.url}-${index}`}
              className="flex flex-col rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:shadow-md transition-shadow justify-between gap-3 overflow-hidden"
            >
              {/* Header: Platform Badge & Attribution */}
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getPlatformBadgeClasses(
                    source.platform
                  )}`}
                >
                  <PlatformIcon platform={source.platform} />
                  <span>{getPlatformLabel(source.platform)}</span>
                </div>

                {source.author && (
                  <span className="text-xs font-medium text-muted-foreground truncate max-w-[150px]">
                    by {source.author}
                  </span>
                )}
              </div>

              {/* Title / Description */}
              <p className="text-sm font-semibold text-foreground line-clamp-2">
                {source.title || `${placeName} — ${getPlatformLabel(source.platform)}`}
              </p>

              {/* Media Preview (YouTube iframe or HTML5 video if direct file) */}
              {ytEmbed ? (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/80 border border-border/60">
                  <iframe
                    src={ytEmbed}
                    title={source.title || placeName}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              ) : isDirectVideo ? (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-border/60">
                  <video
                    src={source.url}
                    controls
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                /* Social Link Preview Card with Gradient Accent */
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-muted-foreground truncate">
                      {source.url}
                    </p>
                    <p className="text-[11px] text-foreground/80 mt-0.5 font-medium">
                      Redirects to original reel / post
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              )}

              {/* Redirect Button */}
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center justify-center gap-2 h-10 w-full rounded-xl border border-border/80 bg-background hover:bg-muted font-semibold text-xs sm:text-sm text-foreground transition-colors cursor-pointer group"
              >
                <span>{getPlatformActionText(source.platform)}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
