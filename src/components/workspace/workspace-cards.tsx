import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WorkspaceStatCardProps = {
  title: string;
  value: number | string;
  description: string;
};

type WorkspaceInfoCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  dashed?: boolean;
  mutedIcon?: boolean;
  className?: string;
};

export function WorkspaceStatCard({
  title,
  value,
  description,
}: WorkspaceStatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function WorkspaceInfoCard({
  icon: Icon,
  title,
  description,
  dashed = false,
  mutedIcon = false,
  className,
}: WorkspaceInfoCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        dashed ? "border-dashed" : "border-border/70",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-4 w-4", mutedIcon ? "text-muted-foreground" : "text-primary")} />
        <div className="space-y-1">
          <div className="font-medium">{title}</div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
