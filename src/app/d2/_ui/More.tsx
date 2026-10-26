"use client";
// A details layer: closed by default, its content is not rendered until opened.
import { useId, useState, type ReactNode } from "react";

export function More({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="more" data-open={open || undefined}>
      <button type="button" className="more-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {summary}
      </button>
      {open && (
        <div id={id} className="more-body">
          {children}
        </div>
      )}
    </div>
  );
}
