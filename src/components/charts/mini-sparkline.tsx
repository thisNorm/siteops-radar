"use client";

type MiniSparklineProps = {
  values: number[];
  stroke?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function MiniSparkline({
  values,
  stroke = "var(--chart-2)",
}: MiniSparklineProps) {
  if (values.length === 0) {
    return <div className="h-10" />;
  }

  const width = 120;
  const height = 40;
  const step = width / Math.max(values.length - 1, 1);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);

  const points = values
    .map((value, index) => {
      const x = index * step;
      const normalized = (value - min) / range;
      const y = clamp(height - normalized * (height - 8) - 4, 4, height - 4);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-10 w-full overflow-visible"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
