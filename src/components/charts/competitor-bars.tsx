"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Item = {
  category: string;
  ours: number;
  competitor: number;
};

export function CompetitorBars({
  data,
}: {
  data: Item[];
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
          <BarChart data={data}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="category" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis width={32} tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="ours" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="competitor" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
