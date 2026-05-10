import type { Recommendation } from "@/types/analysis";
import { Badge } from "@/components/ui/badge";

export function RecommendationList({ items }: { items: Recommendation[] }) {
  return (
    <div className="divide-y rounded-lg border">
      {items.map((item, index) => (
        <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[40px_1fr_auto]">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium">
            {index + 1}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{item.title}</h3>
              <Badge variant="secondary">{item.category}</Badge>
              <Badge variant={item.severity === "high" ? "destructive" : "outline"}>
                {item.severity}
              </Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">{item.expectedImprovement}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">{item.priorityScore}</div>
            <div className="text-xs text-muted-foreground">priority</div>
          </div>
        </div>
      ))}
    </div>
  );
}
