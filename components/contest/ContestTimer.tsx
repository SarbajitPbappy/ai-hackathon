"use client";

import { useEffect, useMemo, useState } from "react";

function toClock(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export default function ContestTimer({
  startTime,
  endTime,
}: {
  startTime: string;
  endTime: string;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const state = useMemo(() => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    if (now < start) {
      return { label: "Starts in", value: toClock(start - now) };
    }
    if (now <= end) {
      return { label: "Ends in", value: toClock(end - now) };
    }
    return { label: "Contest ended", value: toClock(0) };
  }, [endTime, now, startTime]);

  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <p className="mb-2 text-sm text-muted-foreground">{state.label}</p>
      <div className="grid grid-cols-4 gap-2 text-center text-sm">
        <div className="rounded bg-background p-2">{state.value.days}d</div>
        <div className="rounded bg-background p-2">{state.value.hours}h</div>
        <div className="rounded bg-background p-2">{state.value.minutes}m</div>
        <div className="rounded bg-background p-2">{state.value.seconds}s</div>
      </div>
    </div>
  );
}
