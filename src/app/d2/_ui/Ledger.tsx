// "Your lines": the seller's approval lines engraved on a dollar scale (log, like a film-speed dial).
import { usd } from "../_lib/format";

const MIN = 5;
const MAX = 1000;
const TICKS = [5, 10, 25, 50, 100, 250, 500, 1000];
/** Labels dropped when the lane is narrow. */
const NARROW_HIDE = new Set([10, 25, 500]);
const x = (v: number) => (Math.log(Math.min(MAX, Math.max(MIN, v)) / MIN) / Math.log(MAX / MIN)) * 100;
const short = (v: number) => usd(v).replace(".00", "");

/** Cases placed on the scale under one label. Amounts within a few percent of the axis merge into one bead
 *  spanning both values, so two dots never touch. */
type Marks = { label: string; values: number[] };

function Beads({ values }: { values: number[] }) {
  const xs = [...values].map(x).sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const v of xs) {
    const g = groups[groups.length - 1];
    if (g && v - g[g.length - 1] < 3) g.push(v);
    else groups.push([v]);
  }
  return (
    <>
      {groups.map((g) => (
        <line key={g[0]} x1={`${g[0]}%`} x2={`${g[g.length - 1]}%`} y1="31" y2="31" className="lane-mark" />
      ))}
    </>
  );
}

function Lane({ title, line, own, ask, over, marks }: { title: string; line: number; own: string; ask: string; over?: boolean; marks?: Marks }) {
  const lx = x(line);
  // a line near the low end leaves no room to name the zone under it: the zone past it carries the figure instead
  const tight = lx < 25;
  return (
    <div className="lane">
      <p className="lane-title">{title}</p>
      <svg className="lane-svg" width="100%" height={marks ? 100 : 72} role="img" aria-label={over ? `${own} up to ${short(line)}; ${ask} over ${short(line)}` : `${own} below ${short(line)}; ${ask} from ${short(line)}`}>
        <g transform={marks ? "translate(0 28)" : undefined}>
          <rect x="0" y="28" width={`${lx}%`} height="6" className="lane-own" />
          <rect x={`${lx}%`} y="28" width={`${100 - lx}%`} height="6" className="lane-ask" />
          {TICKS.map((t) => (
            <g key={t}>
              <line x1={`${x(t)}%`} x2={`${x(t)}%`} y1="38" y2="46" className="lane-tick" />
              <text
                x={`${x(t)}%`}
                y="64"
                className="lane-tick-label"
                data-narrow={NARROW_HIDE.has(t) ? "hide" : undefined}
                textAnchor={t === MIN ? "start" : t === MAX ? "end" : "middle"}
              >
                {short(t)}
              </text>
            </g>
          ))}
          <line x1={`${lx}%`} x2={`${lx}%`} y1="6" y2="46" className="lane-line" />
          {!tight && (
            <text x={`${lx}%`} dx="-8" y="18" className="lane-zone" textAnchor="end">
              {own}
            </text>
          )}
          <text x={`${lx}%`} dx="8" y="18" className="lane-zone lane-zone-ask" textAnchor="start">
            {tight ? `${ask} over ${short(line)}` : ask}
          </text>
          {marks && <Beads values={marks.values} />}
        </g>
        {marks && (
          <text x={`${x(Math.max(...marks.values))}%`} dx="6" y="12" className="lane-mark-label" textAnchor="end">
            {marks.label}
          </text>
        )}
      </svg>
    </div>
  );
}

export function Ledger({ evidenceLine, moneyLine, marks }: { evidenceLine: number; moneyLine: number; marks: Marks }) {
  return (
    <div className="ledger">
      <Lane title="Filing evidence" line={evidenceLine} own="On its own" ask="Asks you" marks={marks} />
      <Lane title="Refunds and offers" line={moneyLine} own="On its own" ask="Asks you" over />
    </div>
  );
}
