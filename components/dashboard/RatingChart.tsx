"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RatingChartPoint = {
  label: string;
  rating: number;
};

export default function RatingChart({ data }: { data: RatingChartPoint[] }) {
  return (
    <div style={{ width: "100%", minHeight: 288 }} className="rounded-lg border border-border bg-surface p-3">
      <ResponsiveContainer width="100%" height={264} debounce={50}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" tickLine={false} axisLine={false} width={40} />
          <Tooltip
            contentStyle={{
              background: "#1a1f2e",
              border: "1px solid #2d3748",
              borderRadius: "8px",
            }}
          />
          <Line type="monotone" dataKey="rating" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
