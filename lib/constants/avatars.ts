// lib/constants/avatars.ts

export interface AvatarPreset {
  id: string;
  name: string;
  tag: string;
  description: string;
  url: string;
}

export const NEPAL_AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'snow-leopard',
    name: 'Snow Leopard',
    tag: 'Ghost of the High Ridges',
    description: 'Solitary apex wanderer of northern cliff passes and granite cols.',
    url: '/avatars/snow-leopard.svg',
  },
  {
    id: 'everest-summit',
    name: 'Everest Alpinist',
    tag: 'High-Altitude Pioneer',
    description: 'Equipped for the Khumbu Icefall, South Col, and the Hillary Step.',
    url: '/avatars/everest-summit.svg',
  },
  {
    id: 'red-panda',
    name: 'Red Panda',
    tag: 'Cloud Forest Native',
    description: 'Secretive inhabitant of the eastern rhododendron and bamboo mist.',
    url: '/avatars/red-panda.svg',
  },
  {
    id: 'danphe',
    name: 'Himalayan Monal',
    tag: 'National Crest',
    description: 'Nine iridescent feather tones soaring across subalpine cirques.',
    url: '/avatars/danphe.svg',
  },
  {
    id: 'yak-nomad',
    name: 'High Pass Yak',
    tag: 'Caravan Guardian',
    description: 'Enduring freight animal of the trans-Himalayan salt and wool trails.',
    url: '/avatars/yak-nomad.svg',
  },
  {
    id: 'monk-wisdom',
    name: 'Stupa & Wisdom Eyes',
    tag: 'All-Seeing Compassion',
    description: 'Quiet monastic sanctuary, juniper incense, and wind-worn lungta.',
    url: '/avatars/monk-wisdom.svg',
  },
  {
    id: 'sherpa-trailblazer',
    name: 'Sherpa Guide',
    tag: 'Master Route-Finder',
    description: 'Generations of expedition leadership, safety discipline, and alpine mastery.',
    url: '/avatars/sherpa-trailblazer.svg',
  },
  {
    id: 'rhododendron',
    name: 'Wild Rhododendron',
    tag: 'Alpine Blossom',
    description: 'Deep crimson canopy flowering along spring ridge ascents.',
    url: '/avatars/rhododendron.svg',
  },
  {
    id: 'gorkha-scout',
    name: 'Khukuri Ridge Scout',
    tag: 'Fearless Explorer',
    description: 'Crossed steel hilts marking frontier grit and trail resilience.',
    url: '/avatars/gorkha-scout.svg',
  },
  {
    id: 'terai-rhino',
    name: 'Greater One-Horned Rhino',
    tag: 'Terai Monarch',
    description: 'Armor-plated presence moving silently through dawn marsh mist.',
    url: '/avatars/terai-rhino.svg',
  },
];

export function resolveUserAvatar(
  profileAvatarUrl: string | null | undefined,
  userMetadata?: Record<string, unknown> | null
): {
  avatarUrl: string;
  isGoogle: boolean;
  isPreset: boolean;
  preset?: AvatarPreset;
} {
  // If user explicitly saved an avatar in their profile:
  if (profileAvatarUrl && profileAvatarUrl.trim()) {
    const trimmed = profileAvatarUrl.trim();
    const preset = NEPAL_AVATAR_PRESETS.find((p) => p.url === trimmed || p.id === trimmed);
    const isGoogle = trimmed.includes('googleusercontent.com');
    return {
      avatarUrl: preset ? preset.url : trimmed,
      isGoogle,
      isPreset: Boolean(preset),
      preset,
    };
  }

  // Fallback to Google OAuth picture if available in metadata
  const googlePic =
    userMetadata?.avatar_url || userMetadata?.picture || null;

  if (googlePic && typeof googlePic === 'string' && googlePic.trim()) {
    return {
      avatarUrl: googlePic.trim(),
      isGoogle: true,
      isPreset: false,
    };
  }

  // Default explorer preset
  const defaultPreset = NEPAL_AVATAR_PRESETS[0]; // Snow Leopard
  return {
    avatarUrl: defaultPreset.url,
    isGoogle: false,
    isPreset: true,
    preset: defaultPreset,
  };
}
