// One of the seller's lines engraved on a scale: dollars on a log axis (like a film-speed dial), or a plain 0–100% axis.
// The zone past the line is orange only where it means "asks you"; judgment lines stay in ink.
import { usd } from "../_lib/format";

type Tick = { v: number; label: string; narrow?: boolean };
export type Axis = { x: (v: number) => number; ticks: Tick[]; min: number; max: number };

const short = (v: number) => usd(v).replace(".00", "");
const LO = 5;
const HI = 1000;
export const DOLLARS: Axis = {
  x: (v) => (Math.log(Math.min(HI, Math.max(LO, v)) / LO) / Math.log(HI / LO)) * 100,
  ticks: [5, 10, 25, 50, 100, 250, 500, 1000].map((v) => ({ v, label: short(v), narrow: v === 10 || v === 25 || v === 500 })),
  min: LO,
  max: HI,
};
export const PERCENT: Axis = {
  x: (v) => Math.min(1, Math.max(0, v)) * 100,
  ticks: [0, 0.25, 0.5, 0.75, 1].map((v) => ({ v, label: `${v * 100}%`, narrow: v === 0.25 || v === 0.75 })),
  min: 0,
  max: 1,
};

type Marks = { label: string; values: number[] };

export function PolicyLane({
  title,
  axis,
  line,
  lineLabel,
  below,
  above,
  ask = false,
  open = false,
  extra,
  marks,
}: {
  title: string;
  axis: Axis;
  line: number;
  lineLabel: string;
  below: string;
  above: string;
  /** the zone past the line is the seller's: orange */
  ask?: boolean;
  /** the zone past the line is empty track (a cap), not a second zone */
  open?: boolean;
  /** a second engraved line on the same lane */
  extra?: { v: number; label: string };
  marks?: Marks;
}) {
  const lx = axis.x(line);
  const groups: number[][] = [];
  for (const v of [...(marks?.values ?? [])].map(axis.x).sort((a, b) => a - b)) {
    const g = groups[groups.length - 1];
    if (g && v - g[g.length - 1] < 3) g.push(v);
    else groups.push([v]);
  }
  const top = marks ? 28 : 0;
  const last = groups.at(-1)?.at(-1);
  return (
    <div className="lane plane">
      <div className="plane-head">
        <p className="lane-title">{title}</p>
        <p className="plane-line">{lineLabel}</p>
      </div>
      <svg className="lane-svg" width="100%" height={72 + top} role="img" aria-label={`${below} below ${lineLabel}; ${above} past it`}>
        <g transform={`translate(0 ${top})`}>
          <rect x="0" y="28" width={`${lx}%`} height="6" className="lane-own" />
          <rect x={`${lx}%`} y="28" width={`${100 - lx}%`} height="6" className={ask ? "lane-ask" : open ? "plane-open" : "plane-past"} />
          {axis.ticks.map((t) => (
            <g key={t.v}>
              <line x1={`${axis.x(t.v)}%`} x2={`${axis.x(t.v)}%`} y1="38" y2="46" className="lane-tick" />
              <text
                x={`${axis.x(t.v)}%`}
                y="64"
                className="lane-tick-label"
                data-narrow={t.narrow ? "hide" : undefined}
                textAnchor={t.v === axis.min ? "start" : t.v === axis.max ? "end" : "middle"}
              >
                {t.label}
              </text>
            </g>
          ))}
          <line x1={`${lx}%`} x2={`${lx}%`} y1="6" y2="46" className="lane-line" />
          <text x={`${lx}%`} dx="-8" y="18" className="lane-zone" textAnchor="end">
            {below}
          </text>
          <text x={`${lx}%`} dx="8" y="18" className={`lane-zone${ask ? " lane-zone-ask" : ""}`} textAnchor="start">
            {above}
          </text>
          {extra && (
            <>
              <line x1={`${axis.x(extra.v)}%`} x2={`${axis.x(extra.v)}%`} y1="10" y2="46" className="plane-extra" />
              <text x={`${axis.x(extra.v)}%`} dx="6" y="18" className="lane-tick-label plane-extra-label" textAnchor="start">
                {extra.label}
              </text>
            </>
          )}
          {groups.map((g) => (
            <line key={g[0]} x1={`${g[0]}%`} x2={`${g[g.length - 1]}%`} y1="31" y2="31" className="lane-mark" />
          ))}
        </g>
        {marks && last !== undefined && (
          <text x={`${last}%`} dx={last > 50 ? 6 : -6} y="12" className="lane-mark-label" textAnchor={last > 50 ? "end" : "start"}>
            {marks.label}
          </text>
        )}
      </svg>
    </div>
  );
}
