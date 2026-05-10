"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Item = {
  label: string;
  value: number;
  color: string;
};

export function IssueSeverityDonut({
  data,
  total,
  centerLabel,
}: {
  data: Item[];
  total: number;
  centerLabel: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative h-64 min-h-64 min-w-0">
      {ready ? (
        <ResponsiveContainer minWidth={1} minHeight={1}>
          <PieChart>
            <Tooltip />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="86%"
              paddingAngle={2}
              cornerRadius={8}
              strokeWidth={0}
            >
              {data.map((item) => (
                <Cell key={item.label} fill={item.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      ) : null}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-4xl font-semibold tracking-tight">{total}</div>
        <div className="text-sm text-muted-foreground">{centerLabel}</div>
      </div>
    </div>
  );
}
