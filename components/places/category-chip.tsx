import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryChipProps {
  category: string;
  className?: string;
}

export function CategoryChip({ category, className }: CategoryChipProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium capitalize",
        "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
        className
      )}
    >
      {category}
    </Badge>
  );
}