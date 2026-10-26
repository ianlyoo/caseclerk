"use client";
// The engraved scale: a case's elapsed time on a logarithmic, shutter-dial-like axis.
// Stops sit at their real times; the index travels stop to stop (replay on the landing, "now" on a case).
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { logPos, type Stop, type Tick } from "../_lib/story";

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
  /** Right end of the scale, e.g. the deadline. */
  endLabel?: string;
  /** Rendered under the active stop's proof line. */
  footer?: ReactNode;
  /** Readout label per stop id (server components can't pass functions); falls back to the stop title. */
  readouts?: Record<string, string>;
};

const STEP_MS = 900;

export function Scale({ stops, ticks, tau, tMax, replay, nowT, nowLabel, caption, endLabel, footer, readouts }: Props) {
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
  const p = pos(indexT);
  const shown = Math.round(indexT);
  const min = Math.floor(shown / 60);
  const sec = shown % 60;
  const hours = Math.floor(shown / 3600);

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
          <line x1="0%" x2="0%" y1="24" y2="44" className="sc-major" />
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
            style={{ "--x": pos(s.t) } as CSSProperties}
          />
        ))}
        <span className="sc-index" aria-hidden="true" />
      </div>

      <ol className="sc-stops">
        {stops.map((s, i) => {
          if (s.quiet) return null;
          const row = stops.slice(0, i).filter((o) => !o.quiet).length % 2 ? "2" : "1";
          const x = pos(s.t);
          const state = active >= 0 ? (i < active ? "past" : i === active ? "current" : "future") : "past";
          return (
            <li
              key={s.id}
              className="sc-stop"
              data-row={row}
              data-end={x > 0.86 ? "right" : "left"}
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
        {endLabel && (
          <li className="sc-stop sc-end" data-row={stops.filter((o) => !o.quiet).length % 2 ? "2" : "1"} data-end="right" data-state="future" style={{ "--x": 1 } as CSSProperties}>
            <span className="sc-stop-title">{endLabel}</span>
          </li>
        )}
      </ol>

      <div className="sc-foot">
        <p className="sc-proof">
          {picked && current?.proof?.length ? (
            current.proof.map((p) => (
              <span key={p.label} className="sc-proof-item">
                <span className="sc-proof-k">{p.label}</span> <code>{p.value}</code>
              </span>
            ))
          ) : (
            <span className="sc-proof-hint">Select a stop for PayPal&rsquo;s record of it.</span>
          )}
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
