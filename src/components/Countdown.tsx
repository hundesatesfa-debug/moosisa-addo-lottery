"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/i18n/client";

export function Countdown({ target }: { target: string }) {
  const targetTime = new Date(target).getTime();
  const { dict } = useLocale();

  function calc() {
    const diff = Math.max(0, targetTime - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return { days, hours, mins, secs };
  }

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetTime]);

  const cells = [
    { label: dict.countdown.days, value: time.days },
    { label: dict.countdown.hours, value: time.hours },
    { label: dict.countdown.minutes, value: time.mins },
    { label: dict.countdown.seconds, value: time.secs },
  ];

  return (
    <div className="flex gap-3 sm:gap-4">
      {cells.map((c) => (
        <div
          key={c.label}
          className="flex min-w-16 flex-col items-center rounded-2xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur sm:min-w-20 sm:px-4"
        >
          <span className="font-display text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
            {String(c.value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/60">
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}