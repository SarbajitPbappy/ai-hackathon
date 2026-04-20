"use client";

import { useMemo } from "react";

type HeatmapPoint = {
  date: string;
  count: number;
};

const LEVELS = ["bg-transparent", "bg-accent/20", "bg-accent/40", "bg-accent/60", "bg-accent"];

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function SubmissionHeatmap({ data }: { data: HeatmapPoint[] }) {
  const valuesByDay = useMemo(() => new Map(data.map((point) => [point.date, point.count])), [data]);

  const cells = useMemo(() => {
    const today = new Date();
    const days: Array<{ date: string; count: number }> = [];
    for (let i = 364; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const key = toDateKey(day);
      days.push({ date: key, count: valuesByDay.get(key) ?? 0 });
    }
    return days;
  }, [valuesByDay]);

  const maxCount = Math.max(1, ...cells.map((cell) => cell.count));

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[780px] grid-cols-53 gap-1 rounded-lg border border-border bg-surface p-4">
        {cells.map((cell) => {
          const level = Math.min(4, Math.ceil((cell.count / maxCount) * 4));
          return (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.count} submissions`}
              className={`aspect-square rounded-sm border border-border/30 ${LEVELS[level]}`}
            />
          );
        })}
      </div>
    </div>
  );
}
