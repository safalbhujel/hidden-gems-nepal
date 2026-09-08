import { CategoryChip } from "@/components/places/category-chip";
import { HiddenScoreBadge } from "@/components/places/hidden-score-badge";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold text-foreground mb-4">
        Component Verification
      </h1>
      
      {/* Test CategoryChips */}
      <div className="flex flex-wrap gap-3">
        <CategoryChip category="Sacred Sites" />
        <CategoryChip category="Local Food" />
        <CategoryChip category="Secret Trails" />
      </div>

      {/* Test HiddenScoreBadges */}
      <div className="flex flex-wrap gap-3">
        <HiddenScoreBadge score={85} />
        <HiddenScoreBadge score={45} />
        <HiddenScoreBadge score={15} />
      </div>
    </main>
  );
}