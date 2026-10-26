"use client";
// The engraved scale: a case's elapsed time on a logarithmic, shutter-dial-like axis.
// Stops sit at their real times; the index travels stop to stop (replay on the landing, "now" on a case).
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { logPos, spread, type Stop, type Tick } from "../_lib/story";
import { placeLabels, type End } from "../_lib/rows";

type Props = {
  stops: Stop[];
  ticks: Tick[];
  tau: number;
  tMax: number;
  /** Plays the case once on load (landing). */
  replay?: boolean;
  /** Index position in seconds when nothing is selected (a live case's "now"); defaults to the last stop. */
  nowT?: number;
  nowLabel?: string;
  caption: ReactNode;
  /** Right end of the scale, e.g. the deadline; engraved on the axis like a tick. */
  endLabel?: string;
  /** Rendered under the active stop's proof line. */
  footer?: ReactNode;
  /** Readout label per stop id (server components can't pass functions); falls back to the stop title. */
  readouts?: Record<string, string>;
  /** A stop that just arrived (a filing, a PayPal webhook): its dot is stamped in and its label rises. */
  fresh?: string;
};

type Layout = { rows: Record<string, 1 | 2 | 3>; ends: Record<string, End>; hidden: string[]; nRows: number; width: number };

/**
 * Labels sit in rows under the rail; a lower label's leader runs up through the rows above it. `placeLabels`
 * picks rows and sides (right or left of the leader) so no two labels in a row come within 16px and no leader
 * crosses a label: two rows, alternating, when they fit; a third when they don't; then "now" gives up its label.
 */
function useRows(ol: RefObject<HTMLOListElement | null>, sig: string) {
  const [layout, setLayout] = useState<Layout>({ rows: {}, ends: {}, hidden: [], nRows: 2, width: 0 });
  useLayoutEffect(() => {
    const el = ol.current;
    if (!el) return;
    const place = () => {
      const W = el.clientWidth;
      const items = [...el.querySelectorAll<HTMLElement>(".sc-stop")];
      const set = (next: Layout) => setLayout((cur) => (JSON.stringify(cur) === JSON.stringify(next) ? cur : next));
      if (!W || items.length > 10 || items.some((li) => getComputedStyle(li).position !== "absolute")) {
        return set({ rows: {}, ends: {}, hidden: [], nRows: 2, width: W });
      }
      // a hidden label keeps its box (visibility), so it is measured like the rest
      const boxes = items.map((li) => ({ id: li.dataset.id ?? "", x: Number(li.dataset.x) * W, w: li.offsetWidth, passing: li.dataset.id === "now" }));
      const { rows, ends, hidden, nRows } = placeLabels(boxes, W);
      set({ rows, ends, hidden, nRows, width: W });
    };
    place();
    // labels change width when the web font arrives, without the scale itself resizing
    const ro = new ResizeObserver(place);
    ro.observe(el);
    el.querySelectorAll(".sc-stop").forEach((li) => ro.observe(li));
    let live = true;
    void document.fonts?.ready.then(() => live && place());
    return () => {
      live = false;
      ro.disconnect();
    };
  }, [ol, sig]);
  return layout;
}

const STEP_MS = 900;

export function Scale({ stops, ticks, tau, tMax, replay, nowT, nowLabel, caption, endLabel, footer, readouts, fresh }: Props) {
  const last = stops.length - 1;
  // The landing starts at the first stop and replays; reduced motion parks the index on the last stop.
  const [active, setActive] = useState<number>(replay ? 0 : nowT !== undefined ? -1 : last);
  const [picked, setPicked] = useState(false);
  const timers = useRef<number[]>([]);
  const pos = (t: number) => Math.min(1, Math.max(0, logPos(t, tau, tMax)));

  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const play = useCallback(() => {
    clear();
    setPicked(false);
    setActive(0);
    for (let i = 1; i <= last; i++) {
      timers.current.push(window.setTimeout(() => setActive(i), 500 + i * STEP_MS));
    }
  }, [last]);

  useEffect(() => {
    if (!replay) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(last);
      return;
    }
    play();
    return clear;
  }, [replay, play, last]);

  const current = active >= 0 ? stops[active] : null;
  const indexT = current ? current.t : (nowT ?? stops[last]?.t ?? 0);
  const olRef = useRef<HTMLOListElement>(null);
  const [width, setWidth] = useState(0);
  // every stop keeps its dot: stops closer than ~20px on the rail are spaced, in order, rather than dropped
  const xs = spread(
    stops.map((s) => pos(s.t)),
    width ? Math.max(0.02, 20 / width) : 0.025,
  );
  const nowAt = stops.findIndex((s) => s.id === "now");
  const p = current ? xs[active] : nowT !== undefined ? (nowAt >= 0 ? xs[nowAt] : pos(nowT)) : (xs[last] ?? 0);
  const shown = Math.round(indexT);
  const min = Math.floor(shown / 60);
  const sec = shown % 60;
  const hours = Math.floor(shown / 3600);

  // the record line is the selected stop's own; unselected, the stop the index rests on
  const proofStop = current ?? (nowAt >= 0 ? stops[nowAt] : stops[last]);
  const { rows, ends, hidden, nRows, width: measured } = useRows(olRef, stops.map((s, i) => `${s.id}:${s.title}:${s.detail}:${xs[i].toFixed(3)}`).join("|"));
  useEffect(() => setWidth(measured), [measured]);

  const pick = (i: number) => {
    clear();
    setPicked(true);
    setActive(i);
  };

  // minor ticks: geometric midpoints between labelled ticks
  const marks = [0, ...ticks.map((t) => t.t)];
  const minors = marks.slice(1).map((t, i) => Math.sqrt(Math.max(marks[i], tau / 2) * t));

  return (
    <div className="sc" style={{ "--p": p } as CSSProperties}>
      <div className="sc-head">
        <p className="sc-caption">{caption}</p>
        <div className="sc-readout" aria-live="polite">
          <NumberFlowGroup>
            <span className="sc-figure">
              {hours >= 1 ? (
                <>
                  <NumberFlow value={hours} />
                  <span className="sc-unit"> h </span>
                  <NumberFlow value={Math.floor((shown % 3600) / 60)} />
                  <span className="sc-unit"> min</span>
                </>
              ) : (
                <>
                  {min > 0 && (
                    <>
                      <NumberFlow value={min} />
                      <span className="sc-unit"> min </span>
                    </>
                  )}
                  <NumberFlow value={sec} />
                  <span className="sc-unit"> s</span>
                </>
              )}
            </span>
          </NumberFlowGroup>
          <span className="sc-readout-label">{current ? (readouts?.[current.id] ?? current.title) : nowLabel}</span>
        </div>
      </div>

      <div className="sc-rail">
        <svg className="sc-ticks" width="100%" height="56" aria-hidden="true">
          <text x="0%" y="14" className="sc-tick-label" textAnchor="start">0</text>
          {ticks.map((t) => (
            <text key={t.t} x={`${pos(t.t) * 100}%`} y="14" className="sc-tick-label" data-narrow={t.narrow} textAnchor={pos(t.t) > 0.98 ? "end" : "middle"}>
              {t.label}
            </text>
          ))}
          {endLabel && (
            <text x="100%" y="14" className="sc-tick-label sc-tick-end" textAnchor="end">
              {endLabel}
            </text>
          )}
          <line x1="0%" x2="0%" y1="24" y2="44" className="sc-major" />
          {endLabel && <line x1="100%" x2="100%" y1="20" y2="44" className="sc-major sc-major-end" />}
          {ticks.map((t) => (
            <line key={`M${t.t}`} x1={`${pos(t.t) * 100}%`} x2={`${pos(t.t) * 100}%`} y1="24" y2="44" className="sc-major" />
          ))}
          {minors.map((t) => (
            <line key={`m${t}`} x1={`${pos(t) * 100}%`} x2={`${pos(t) * 100}%`} y1="34" y2="44" className="sc-minor" />
          ))}
        </svg>
        <div className="sc-line" aria-hidden="true" />
        <div className="sc-line sc-line-lit" aria-hidden="true" />
        {stops.map((s, i) => (
          <span
            key={s.id}
            className="sc-dot"
            aria-hidden="true"
            data-tone={s.tone}
            data-state={active >= 0 ? (i < active ? "past" : i === active ? "current" : "future") : "past"}
            data-new={s.id === fresh || undefined}
            style={{ "--x": xs[i] } as CSSProperties}
          />
        ))}
        <span className="sc-index" aria-hidden="true" />
      </div>

      <ol className="sc-stops" ref={olRef} data-rows={nRows > 2 ? nRows : undefined}>
        {stops.map((s, i) => {
          if (s.quiet) return null;
          const row = rows[s.id] ?? (stops.slice(0, i).filter((o) => !o.quiet).length % 2 ? "2" : "1");
          const x = xs[i];
          const state = active >= 0 ? (i < active ? "past" : i === active ? "current" : "future") : "past";
          return (
            <li
              key={s.id}
              className="sc-stop"
              data-row={row}
              data-hidden={hidden.includes(s.id) || undefined}
              data-id={s.id}
              data-x={x}
              data-new={s.id === fresh || undefined}
              data-end={ends[s.id] ?? (x > 0.76 ? "right" : "left")}
              data-tone={s.tone}
              data-state={state}
              style={{ "--x": x } as CSSProperties}
            >
              <button type="button" className="sc-stop-btn" onClick={() => pick(i)} aria-pressed={i === active}>
                <span className="sc-stop-title">{s.title}</span>
                <span className="sc-stop-detail">{s.detail}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="sc-foot">
        <p className="sc-proof">
          {proofStop && (
            <>
              {/* the readout above names the stop; this line is its record */}
              <span className="sc-proof-stop">Record</span>
              {proofStop.proof?.map((p) => (
                <span key={p.label} className="sc-proof-item">
                  <span className="sc-proof-k">{p.label}</span> {p.words ? p.value : <code>{p.value}</code>}
                </span>
              ))}
            </>
          )}
          {/* the landing keeps its first screen to the story; a case page says how to read its stops */}
          {!picked && !replay && <span className="sc-proof-hint">Select a stop for its record.</span>}
        </p>
        <div className="sc-actions">
          {footer}
          {replay && (
            <button type="button" className="sc-replay" onClick={play}>
              Replay the case
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
