"use client";

import { useState } from "react";

export function Tabs({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={`flex-none rounded-full px-4 py-2.5 font-sans text-[13.5px] font-semibold transition-colors ${
              active === i ? "bg-ink text-white" : "bg-surface text-ink-2 shadow-card"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{tabs[active].content}</div>
    </div>
  );
}
