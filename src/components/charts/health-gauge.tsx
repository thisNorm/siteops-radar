"use client";

import { useEffect, useState } from "react";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

export function HealthGauge({ score }: { score: number }) {
  const [ready, setReady] = useState(false);
  const data = [{ name: "score", value: score, fill: "var(--chart-1)" }];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative h-44 min-h-44 w-full min-w-0">
      {ready ? (
        <ResponsiveContainer minWidth={1} minHeight={1}>
          <RadialBarChart
            data={data}
            innerRadius="72%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            barSize={14}
          >
            <RadialBar dataKey="value" cornerRadius={10} background />
          </RadialBarChart>
        </ResponsiveContainer>
      ) : null}
      <div className="absolute inset-x-0 bottom-5 text-center">
        <div className="text-4xl font-semibold tracking-tight">{score}</div>
        <div className="text-xs text-muted-foreground">/ 100</div>
      </div>
    </div>
  );
}
