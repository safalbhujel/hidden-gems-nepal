'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { detectPlatform, type MediaSource } from '@/lib/utils/media';

export interface SubmitPlaceState {
  error?: string;
  success?: boolean;
}

export async function submitPlace(formData: FormData): Promise<SubmitPlaceState> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to submit a hidden gem.' };
  }

  const name = formData.get('name')?.toString().trim();
  const category_id = formData.get('category_id')?.toString() || null;
  const district_id = formData.get('district_id')?.toString() || null;
  const description = formData.get('description')?.toString().trim();
  const why_special = formData.get('why_special')?.toString().trim();
  const address = formData.get('address')?.toString().trim() || null;
  const latStr = formData.get('latitude')?.toString();
  const lngStr = formData.get('longitude')?.toString();
  const budget = formData.get('budget')?.toString() || null;
  const best_season = formData.get('best_season')?.toString() || null;
  const travel_tips = formData.get('travel_tips')?.toString().trim() || null;

  if (!name || !description || !why_special) {
    return { error: 'Please fill in all required fields (Name, Description, Why Special).' };
  }

  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;

  // Generate URL slug from name
  const slugBase = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const slug = `${slugBase}-${Math.random().toString(36).substring(2, 7)}`;

  // PostGIS location point
  const location =
    longitude !== null && latitude !== null
      ? `POINT(${longitude} ${latitude})`
      : null;

  // ── Parse media sources (social media links, reels, shorts, posts) ────────
  const mediaSourcesRaw = formData.get('media_sources_json')?.toString();
  let mediaSources: MediaSource[] = [];
  if (mediaSourcesRaw) {
    try {
      const parsed = JSON.parse(mediaSourcesRaw);
      if (Array.isArray(parsed)) {
        mediaSources = parsed
          .filter((item) => item && typeof item.url === 'string' && item.url.trim())
          .map((item) => ({
            url: item.url.trim(),
            platform: item.platform || detectPlatform(item.url),
            title: item.title?.trim() || undefined,
            author: item.author?.trim() || undefined,
          }));
      }
    } catch (e) {
      console.warn('[submitPlace] Failed to parse media_sources_json:', e);
    }
  }

  // ── Handle uploaded video files ──────────────────────────────────────────
  const videoFiles = formData.getAll('video_files') as File[];
  for (const videoFile of videoFiles) {
    if (videoFile && typeof videoFile.size === 'number' && videoFile.size > 0) {
      try {
        const fileExt = videoFile.name.split('.').pop() || 'mp4';
        const cleanName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('place-videos')
          .upload(cleanName, videoFile, {
            contentType: videoFile.type || 'video/mp4',
            upsert: true,
          });

        if (!uploadErr) {
          const { data: pubData } = supabase.storage
            .from('place-videos')
            .getPublicUrl(cleanName);
          if (pubData?.publicUrl) {
            mediaSources.push({
              url: pubData.publicUrl,
              platform: 'video',
              title: videoFile.name.replace(/\.[^/.]+$/, ''),
            });
          }
        } else {
          console.error('[submitPlace] Error uploading video file:', uploadErr);
        }
      } catch (err) {
        console.error('[submitPlace] Video upload exception:', err);
      }
    }
  }

  // Serialize all video & social sources into video_url JSON string (or null if empty)
  const video_url = mediaSources.length > 0 ? JSON.stringify(mediaSources) : null;

  // ── Insert place record into database ─────────────────────────────────────
  const { data: insertedPlace, error: insertError } = await supabase
    .from('places')
    .insert({
      name,
      slug,
      description,
      why_special,
      category_id,
      district_id,
      submitted_by: user.id,
      location,
      latitude,
      longitude,
      map_url: address,
      video_url,
      budget,
      best_season,
      travel_tips,
      status: 'PENDING',
      hidden_score: Math.floor(Math.random() * 20) + 75, // Starting score range for review
    })
    .select('id')
    .single();

  if (insertError || !insertedPlace) {
    console.error('[submitPlace] Error inserting place:', insertError);
    return { error: insertError?.message || 'Failed to submit place. Please try again.' };
  }

  // ── Handle images: both uploaded files and pasted image URLs ──────────────
  const imageUrlsToInsert: string[] = [];

  // 1. Pasted image URLs from client
  const imageUrlsRaw = formData.get('image_urls_json')?.toString();
  if (imageUrlsRaw) {
    try {
      const parsedUrls = JSON.parse(imageUrlsRaw);
      if (Array.isArray(parsedUrls)) {
        for (const u of parsedUrls) {
          if (typeof u === 'string' && u.trim().startsWith('http')) {
            imageUrlsToInsert.push(u.trim());
          }
        }
      }
    } catch (e) {
      console.warn('[submitPlace] Failed to parse image_urls_json:', e);
    }
  }

  // 2. Uploaded image files
  const imageFiles = formData.getAll('image_files') as File[];
  for (const imgFile of imageFiles) {
    if (imgFile && typeof imgFile.size === 'number' && imgFile.size > 0) {
      try {
        const fileExt = imgFile.name.split('.').pop() || 'jpg';
        const cleanName = `${user.id}/${insertedPlace.id}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('place-images')
          .upload(cleanName, imgFile, {
            contentType: imgFile.type || 'image/jpeg',
            upsert: true,
          });

        if (!uploadErr) {
          const { data: pubData } = supabase.storage
            .from('place-images')
            .getPublicUrl(cleanName);
          if (pubData?.publicUrl) {
            imageUrlsToInsert.push(pubData.publicUrl);
          }
        } else {
          console.error('[submitPlace] Error uploading image:', uploadErr);
        }
      } catch (err) {
        console.error('[submitPlace] Image upload exception:', err);
      }
    }
  }

  // Insert image records into place_images table with sort_order
  if (imageUrlsToInsert.length > 0) {
    const imageRows = imageUrlsToInsert.map((url, index) => ({
      place_id: insertedPlace.id,
      image_url: url,
      sort_order: index + 1,
    }));

    const { error: imgInsertErr } = await supabase.from('place_images').insert(imageRows);
    if (imgInsertErr) {
      console.error('[submitPlace] Error saving place_images:', imgInsertErr);
    }
  }

  revalidatePath('/explore');
  return { success: true };
}
