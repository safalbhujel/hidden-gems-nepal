// lib/utils/media.ts

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'twitter'
  | 'video'
  | 'web';

export interface MediaSource {
  id?: string;
  url: string;
  platform: SocialPlatform;
  title?: string;
  author?: string;
}

export interface UploadedImageItem {
  id: string;
  file?: File;
  previewUrl: string;
  sourceType: 'upload' | 'url';
}

export function detectPlatform(url: string): SocialPlatform {
  if (!url) return 'web';
  const lower = url.toLowerCase().trim();
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) return 'facebook';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  if (lower.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i)) return 'video';
  return 'web';
}

export function getPlatformLabel(platform: SocialPlatform): string {
  switch (platform) {
    case 'instagram':
      return 'Instagram Reel / Post';
    case 'tiktok':
      return 'TikTok Video';
    case 'youtube':
      return 'YouTube Video / Short';
    case 'facebook':
      return 'Facebook Video';
    case 'twitter':
      return 'X (Twitter) Post';
    case 'video':
      return 'Raw Video Footage';
    default:
      return 'Web & Social Article';
  }
}

export function getPlatformActionText(platform: SocialPlatform): string {
  switch (platform) {
    case 'instagram':
      return 'View Reel on Instagram';
    case 'tiktok':
      return 'Watch on TikTok';
    case 'youtube':
      return 'Watch on YouTube';
    case 'facebook':
      return 'Watch on Facebook';
    case 'twitter':
      return 'View on X';
    case 'video':
      return 'Watch Full Video';
    default:
      return 'Visit Creator Source';
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/
  );
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
}

export function parseMediaSources(videoUrl: string | null | undefined): MediaSource[] {
  if (!videoUrl) return [];
  const trimmed = videoUrl.trim();
  if (!trimmed) return [];

  try {
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item.url === 'string' && item.url.trim())
          .map((item) => ({
            ...item,
            platform: item.platform || detectPlatform(item.url),
          }));
      }
      if (typeof parsed === 'object' && parsed !== null && parsed.url) {
        return [
          {
            ...parsed,
            platform: parsed.platform || detectPlatform(parsed.url),
          },
        ];
      }
    }
  } catch {
    // If not JSON, fall back to treating it as a raw URL string
  }

  return [
    {
      url: trimmed,
      platform: detectPlatform(trimmed),
      title: 'Original Video / Social Post',
    },
  ];
}
