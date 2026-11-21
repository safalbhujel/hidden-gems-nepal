// lib/constants/avatars.ts

export interface AvatarPreset {
  id: string;
  name: string;
  nepaliName: string;
  tag: string;
  description: string;
  url: string;
}

export const NEPAL_AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'snow-leopard',
    name: 'Snow Leopard',
    nepaliName: 'हिउँ चितुवा',
    tag: 'Ghost of Mountains',
    description: 'Elusive apex guardian of the high Himalayan cliffs and secret ridges.',
    url: '/avatars/snow-leopard.svg',
  },
  {
    id: 'everest-summit',
    name: 'Everest Alpinist',
    nepaliName: 'सगरमाथा आरोही',
    tag: 'Summit Pioneer',
    description: 'High-altitude mountaineer greeting golden dawn at 8,848 meters.',
    url: '/avatars/everest-summit.svg',
  },
  {
    id: 'red-panda',
    name: 'Red Panda',
    nepaliName: 'हाब्रे',
    tag: 'Forest Dweller',
    description: 'Gentle, curious wanderer of Eastern Nepal’s misty bamboo woodlands.',
    url: '/avatars/red-panda.svg',
  },
  {
    id: 'danphe',
    name: 'Danphe (Himalayan Monal)',
    nepaliName: 'डाँफे (राष्ट्रिय चरा)',
    tag: 'National Jewel',
    description: 'Radiant nine-color plumage soaring across high alpine meadows.',
    url: '/avatars/danphe.svg',
  },
  {
    id: 'yak-nomad',
    name: 'High Pass Yak',
    nepaliName: 'हिमाली चौंरी',
    tag: 'Trail Legend',
    description: 'Mighty beast of the trans-Himalayan trade routes and glacial valleys.',
    url: '/avatars/yak-nomad.svg',
  },
  {
    id: 'monk-wisdom',
    name: 'Stupa & Wisdom Eyes',
    nepaliName: 'शान्ति र ज्ञान दृष्टि',
    tag: 'Serenity & Peace',
    description: 'All-seeing compassion and colorful prayer flags fluttered by the wind.',
    url: '/avatars/monk-wisdom.svg',
  },
  {
    id: 'sherpa-trailblazer',
    name: 'Sherpa Trailblazer',
    nepaliName: 'शेर्पा पथप्रदर्शक',
    tag: 'Mountain Master',
    description: 'Warm smile, traditional Dhaka topi, and legendary mountain wayfinding.',
    url: '/avatars/sherpa-trailblazer.svg',
  },
  {
    id: 'rhododendron',
    name: 'Lali Gurans',
    nepaliName: 'लालीगुराँस',
    tag: 'Sacred Blossom',
    description: 'Vibrant crimson blooms that carpet the hills of Nepal in springtime.',
    url: '/avatars/rhododendron.svg',
  },
  {
    id: 'gorkha-scout',
    name: 'Khukuri Ridge Scout',
    nepaliName: 'गोर्खाली अन्वेषक',
    tag: 'Fearless Spirit',
    description: 'Brave guardian emblem carrying the iconic curved blade into the unknown.',
    url: '/avatars/gorkha-scout.svg',
  },
  {
    id: 'terai-rhino',
    name: 'One-Horned Rhino',
    nepaliName: 'एकसिङ्गे गैँडा',
    tag: 'Jungle King',
    description: 'Armored monarch standing proudly in the tall grasses of Chitwan and Bardia.',
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
