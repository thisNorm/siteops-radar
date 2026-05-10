"use client";

import { useEffect, useState } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type RadarItem = {
  category: string;
  ours: number;
  benchmark: number;
};

export function CategoryRadar({
  data,
  oursLabel = "SiteOps Radar",
  benchmarkLabel = "Benchmark",
}: {
  data: RadarItem[];
  oursLabel?: string;
  benchmarkLabel?: string;
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
          <RadarChart data={data}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="category" tick={{ fill: "currentColor", fontSize: 12 }} />
            <Legend />
            <Radar
              name={oursLabel}
              dataKey="ours"
              stroke="var(--chart-1)"
              fill="var(--chart-1)"
              fillOpacity={0.16}
            />
            <Radar
              name={benchmarkLabel}
              dataKey="benchmark"
              stroke="var(--chart-5)"
              fill="transparent"
              strokeDasharray="4 4"
            />
          </RadarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
