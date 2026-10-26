// "Your lines": the seller's approval lines engraved on a dollar scale (log, like a film-speed dial).
import { usd } from "../_lib/format";

const MIN = 5;
const MAX = 1000;
const TICKS = [5, 10, 25, 50, 100, 250, 500, 1000];
/** Labels dropped when the lane is narrow. */
const NARROW_HIDE = new Set([10, 25, 500]);
const x = (v: number) => (Math.log(Math.min(MAX, Math.max(MIN, v)) / MIN) / Math.log(MAX / MIN)) * 100;
const short = (v: number) => usd(v).replace(".00", "");

/** Cases placed on the scale; their dots share one label (the amounts sit too close to name apart). */
type Marks = { label: string; values: number[] };

function Lane({ title, line, own, ask, marks }: { title: string; line: number; own: string; ask: string; marks?: Marks }) {
  const lx = x(line);
  return (
    <div className="lane">
      <p className="lane-title">{title}</p>
      <svg className="lane-svg" width="100%" height={marks ? 92 : 72} role="img" aria-label={`${own} below ${short(line)}; ${ask} from ${short(line)}`}>
        <g transform={marks ? "translate(0 20)" : undefined}>
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
          <text x={`${lx}%`} dx="-8" y="18" className="lane-zone" textAnchor="end">
            {own}
          </text>
          <text x={`${lx}%`} dx="8" y="18" className="lane-zone lane-zone-ask" textAnchor="start">
            {ask}
          </text>
          {marks?.values.map((v) => <circle key={v} cx={`${x(v)}%`} cy="31" r="5" className="lane-mark" />)}
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
      <Lane title="Refunds and offers" line={moneyLine} own="Under your rules" ask="Asks you"  />
    </div>
  );
}
