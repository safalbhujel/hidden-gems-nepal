import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCategories, getDistricts } from '@/lib/queries/places';
import { SubmitGemForm } from '@/components/places/SubmitGemForm';
import { Compass } from 'lucide-react';

export const metadata = {
  title: 'HiddenGems Nepal | Share a Place',
  description:
    'Share a quiet, special place in Nepal with other travelers. Our local team reviews every spot before publishing.',
};

export default async function SubmitGemPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectedFrom=/submit');
  }

  // Fetch categories and districts in parallel
  const [categories, districts] = await Promise.all([
    getCategories(),
    getDistricts(),
  ]);

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <div className="border-b bg-background py-10 md:py-14">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wide uppercase mb-1">
            <Compass className="h-4 w-4" />
            <span>Add a New Place</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Share a Place
          </h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base max-w-xl">
            Help other travelers find quiet spots across Nepal. Pick a spot on the map, tell us what makes it special, and share tips for getting there.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 pt-8">
        <SubmitGemForm categories={categories} districts={districts} />
      </div>
    </div>
  );
}
