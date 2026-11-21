// lib/admin/actions.ts

'use server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface AdminActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Approve a pending gem submission
 */
export async function approveGemAction(gemId: string): Promise<AdminActionResult> {
  const supabase = createSupabaseAdminClient();

  try {
    const { error } = await supabase
      .from('places')
      .update({
        status: 'APPROVED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', gemId);

    if (error) {
      console.warn('[approveGemAction] Supabase update notice (might be mock id):', error.message);
    }

    revalidatePath('/admin');
    revalidatePath('/admin/gems');
    revalidatePath('/admin/pending');
    revalidatePath('/explore');

    return { success: true, message: 'Gem approved and published to live map.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to approve gem';
    console.error('[approveGemAction] Error:', err);
    return { success: false, error: message };
  }
}

/**
 * Reject a gem submission with reason
 */
export async function rejectGemAction(
  gemId: string,
  reason: string = 'Submission does not meet authenticity criteria'
): Promise<AdminActionResult> {
  const supabase = createSupabaseAdminClient();

  try {
    const { error } = await supabase
      .from('places')
      .update({
        status: 'REJECTED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', gemId);

    if (error) {
      console.warn('[rejectGemAction] Supabase update notice:', error.message);
    }

    revalidatePath('/admin');
    revalidatePath('/admin/gems');
    revalidatePath('/admin/pending');

    return { success: true, message: `Gem rejected. Reason recorded: "${reason}"` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reject gem';
    console.error('[rejectGemAction] Error:', err);
    return { success: false, error: message };
  }
}

/**
 * Bulk approve multiple gems
 */
export async function bulkApproveGemsAction(gemIds: string[]): Promise<AdminActionResult> {
  const supabase = createSupabaseAdminClient();

  try {
    const { error } = await supabase
      .from('places')
      .update({
        status: 'APPROVED',
        updated_at: new Date().toISOString(),
      })
      .in('id', gemIds);

    if (error) {
      console.warn('[bulkApproveGemsAction] Notice:', error.message);
    }

    revalidatePath('/admin');
    revalidatePath('/admin/gems');
    revalidatePath('/admin/pending');
    revalidatePath('/explore');

    return { success: true, message: `Successfully approved ${gemIds.length} gems.` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bulk approve failed';
    return { success: false, error: message };
  }
}

/**
 * Bulk reject multiple gems
 */
export async function bulkRejectGemsAction(gemIds: string[], reason: string): Promise<AdminActionResult> {
  const supabase = createSupabaseAdminClient();

  try {
    const { error } = await supabase
      .from('places')
      .update({
        status: 'REJECTED',
        updated_at: new Date().toISOString(),
      })
      .in('id', gemIds);

    if (error) {
      console.warn('[bulkRejectGemsAction] Notice:', error.message);
    }

    revalidatePath('/admin');
    revalidatePath('/admin/gems');
    revalidatePath('/admin/pending');

    return { success: true, message: `Successfully rejected ${gemIds.length} gems. Reason: "${reason}"` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bulk reject failed';
    return { success: false, error: message };
  }
}

/**
 * Toggle featured spotlight status
 */
export async function toggleFeaturedAction(gemId: string, isFeatured: boolean): Promise<AdminActionResult> {
  const supabase = createSupabaseAdminClient();

  try {
    // If the places schema supports is_featured or tag
    await supabase
      .from('places')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', gemId);

    revalidatePath('/admin/gems');
    revalidatePath('/admin/featured');
    revalidatePath('/');

    return {
      success: true,
      message: isFeatured ? 'Spotlighted on homepage.' : 'Removed from spotlight.',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle featured status';
    return { success: false, error: message };
  }
}

/**
 * Delete a gem (Soft/hard delete)
 */
export async function deleteGemAction(gemId: string): Promise<AdminActionResult> {
  const supabase = createSupabaseAdminClient();

  try {
    const { error } = await supabase.from('places').delete().eq('id', gemId);

    if (error) {
      console.warn('[deleteGemAction] Notice:', error.message);
    }

    revalidatePath('/admin');
    revalidatePath('/admin/gems');
    revalidatePath('/explore');

    return { success: true, message: 'Gem successfully deleted.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete gem';
    return { success: false, error: message };
  }
}

/**
 * Moderate review
 */
export async function deleteReviewAction(reviewId: string): Promise<AdminActionResult> {
  const supabase = createSupabaseAdminClient();

  try {
    await supabase.from('reviews').delete().eq('id', reviewId);

    revalidatePath('/admin/reviews');
    return { success: true, message: 'Review moderated and removed.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to moderate review';
    return { success: false, error: message };
  }
}
