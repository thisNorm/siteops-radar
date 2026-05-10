"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Item = {
  category: string;
  ours: number;
  competitorAverage: number;
  competitorLeader: number;
};

export function CompetitorBars({
  data,
  oursLabel = "SiteOps Radar",
  competitorAverageLabel = "Competitor Avg",
  competitorLeaderLabel = "Category Leader",
}: {
  data: Item[];
  oursLabel?: string;
  competitorAverageLabel?: string;
  competitorLeaderLabel?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="h-72 min-h-72 min-w-0">
      {ready ? (
        <ResponsiveContainer minWidth={1} minHeight={1}>
          <BarChart data={data} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="category" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis width={32} tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip cursor={{ fill: "var(--muted)" }} />
            <Legend />
            <Bar name={oursLabel} dataKey="ours" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            <Bar
              name={competitorAverageLabel}
              dataKey="competitorAverage"
              fill="var(--chart-5)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              name={competitorLeaderLabel}
              dataKey="competitorLeader"
              fill="var(--chart-2)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
