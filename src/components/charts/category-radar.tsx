"use client";

import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type RadarItem = {
  category: string;
  score: number;
};

export function CategoryRadar({
  data,
}: {
  data: RadarItem[];
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
            <Radar
              dataKey="score"
              stroke="var(--chart-2)"
              fill="var(--chart-2)"
              fillOpacity={0.16}
            />
          </RadarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
