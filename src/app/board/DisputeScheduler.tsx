"use client";
// The deadline board: Bryntum Scheduler, one row per case. A bar runs from PayPal opening the dispute to its
// deadline (or its close, or now); the case's moments sit on it as dots; "now" is the orange index line.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BryntumScheduler, type BryntumSchedulerProps } from "@bryntum/scheduler-react";
import { StringHelper } from "@bryntum/scheduler";
import "@bryntum/scheduler/scheduler.css";
import "@bryntum/scheduler/svalbard-light.css";
import "@bryntum/scheduler/fontawesome/css/fontawesome.css";
import "@bryntum/scheduler/fontawesome/css/solid.css";
import "./board.css";
import type { Board, BoardRow, Span as View } from "../d2/_lib/board";
import { spread } from "../d2/_lib/story";

type Dom = Record<string, unknown>;
type EventRenderer = NonNullable<BryntumSchedulerProps["eventRenderer"]>;
type TooltipTemplate = (data: { eventRecord: { resourceId: unknown } }) => string;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const BANDS = ["waiting", "open", "closed"] as const;
/** a band says its count the way the headline does: "2 waiting for your yes" */
const BAND_WORDS: Record<(typeof BANDS)[number], string> = { waiting: "waiting for your yes", open: "open", closed: "closed" };
/** dots are 9px; centres at least this far apart so no two touch */
const GAP = 14;
const DOT = 9;
/** a row: a phone's stacks the amount over the item */
const ROW = (narrow: boolean) => (narrow ? 76 : 64);

/** The page margin, as d2.css computes it: the case column's text starts on the headline's edge. */
const marginFor = (w: number) => Math.min(96, Math.max(20, w * 0.0445));

let ctx: CanvasRenderingContext2D | null = null;
function textWidth(s: string, font: string) {
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return s.length * 7;
  ctx.font = font;
  return ctx.measureText(s).width;
}

/** how many lines a case name wraps to in its cell (greedy, by words, as the browser wraps it) */
function linesOf(s: string, font: string, w: number) {
  let lines = 1;
  let line = "";
  for (const word of s.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(next, font) > w) {
      lines++;
      line = word;
    } else line = next;
  }
  return lines;
}

function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia("(max-width: 899px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

/** One bar: the track (lit up to now), the end (PayPal's deadline, the close, or now), the moments, and what the end means. */
function barFor(row: BoardRow, width: number, visible: number, nowMs: number, font: string, narrow: boolean): Dom[] {
  const a = Date.parse(row.start);
  const b = Math.max(Date.parse(row.end), a + 1);
  const frac = (iso: string) => Math.min(1, Math.max(0, (Date.parse(iso) - a) / (b - a)));
  const n = row.moments.length;
  const real = row.moments.map((m) => frac(m.at) * width);
  const spaced = spread(real.map((x) => x / width), GAP / width).map((f) => f * width);
  // Dots too close to space without pushing one past the case's latest moment (and so past now) sit in a strip, in
  // order: a sequence that starts where the case's first moment is, not a span of time. The tooltip has their times.
  const strip = n > 1 && (width < (n - 1) * GAP + DOT || spaced[n - 1] > real[n - 1] + GAP / 2);
  const lit = row.endKind === "due" ? frac(new Date(nowMs).toISOString()) : 1;
  const stripW = (n - 1) * GAP + DOT + 8;
  // a strip never reaches past now: a recent case's strip ends just before the now line
  const nowX = ((nowMs - a) / (b - a)) * width;
  const x0 = strip ? Math.min(Math.max(0, real[0] - DOT / 2 - 4), nowX - 3 - stripW) : 0;
  const xs = strip ? row.moments.map((_, i) => x0 + 4 + DOT / 2 + i * GAP) : spaced;
  const stripEnd = strip ? x0 + stripW : 0;
  const label = narrow ? row.endShort : row.endWords;
  const lastX = Math.max(stripEnd, xs.length ? xs[xs.length - 1] + DOT / 2 : 0);
  // a bar running past the view's end keeps its words at the view's end
  const end = Math.min(width, visible);
  const tw = textWidth(label, font);
  // inside the bar if it fits, else after its end; if neither fits in the view, inside at the view's end
  const inside = end - lastX - 24 >= tw + 16 || Math.max(width, lastX) + 12 + tw + 12 > visible;
  return [
    ...(width >= 4
      ? [
          { className: "bd-track" },
          { className: "bd-lit", style: { width: `${lit * 100}%` } },
          ...(row.endKind === "due" ? [{ className: "bd-cap" }] : []),
        ]
      : []),
    ...(strip ? [{ className: "bd-strip", style: { left: `${x0}px`, width: `${stripEnd - x0}px` } }] : []),
    ...row.moments.map((m, i) => ({
      className: "bd-dot",
      dataset: { who: m.who, tone: m.tone },
      style: { left: `${xs[i] - DOT / 2}px` },
    })),
    {
      className: "bd-label",
      dataset: { place: inside ? "in" : "out" },
      style: inside ? { right: `${width - end + 14}px` } : { left: `${Math.max(width, lastX) + 12}px` },
      text: label,
    },
  ];
}

export default function DisputeScheduler({ board, span: initial }: { board: Board; span: View }) {
  const router = useRouter();
  const narrow = useNarrow();
  const [view, setView] = useState<View>(initial);
  // the span is in the address, so a link (or a reload) opens the board on it
  const pick = (v: View) => {
    setView(v);
    window.history.replaceState(null, "", v === "hours" ? "?span=hours" : window.location.pathname);
  };
  const byId = useMemo(() => new Map(board.rows.map((r) => [r.id, r])), [board.rows]);
  const nowMs = Date.parse(board.now);
  const open = useCallback((id: unknown) => {
    const row = byId.get(String(id));
    if (row) router.push(row.href);
  }, [byId, router]);

  const [vw] = useState(() => window.innerWidth);
  const margin = marginFor(vw);
  // the bar labels' font, to measure whether a label fits inside its bar
  const family = useMemo(() => getComputedStyle(document.querySelector(".d2") ?? document.body).fontFamily, []);
  const font = `500 13px ${family}`;

  const span = useMemo(() => {
    const first = Math.min(...board.rows.map((r) => Date.parse(r.start)));
    const last = Math.max(nowMs, ...board.rows.filter((r) => r.endKind === "due").map((r) => Date.parse(r.end)));
    const end = last + 2 * DAY;
    // a fitted axis keeps room before now for the longest strip (a phone's days are ~15px): solve
    // (now - start) / (end - start) * timeline >= room for start
    const most = Math.max(1, ...board.rows.filter((r) => r.band !== "closed").map((r) => r.moments.length));
    const room = (most - 1) * GAP + DOT + 8 + 16;
    const timeline = vw - Math.round(margin + (narrow ? 140 : 400));
    const roomy = timeline > room * 2 ? (nowMs * timeline - room * end) / (timeline - room) : first - DAY;
    return view === "deadlines"
      ? { startDate: new Date(Math.min(first - DAY, roomy)), endDate: new Date(end) }
      : { startDate: new Date(first - 3 * HOUR), endDate: new Date(nowMs + 9 * HOUR) };
  }, [board.rows, nowMs, view, vw, margin, narrow]);

  // a name that wraps past the row's lines gets a taller row (Bryntum's per-record rowHeight), not clipped words
  const resources = useMemo(() => {
    const nameFont = narrow ? `500 13px ${family}` : `600 15px ${family}`;
    const nameW = narrow ? 140 - 16 : 400 - 16 - 15 * 6.5 - 12;
    return board.rows.map((r) => {
      const n = linesOf(r.title, nameFont, nameW);
      const tall = narrow ? Math.ceil(14 * 1.3 + 4 + n * 13 * 1.3 + 20) : Math.ceil(n * 15 * 1.3 + 13 * 1.3 + 16);
      return { id: r.id, name: r.title, band: BANDS.indexOf(r.band), ...(tall > ROW(narrow) ? { rowHeight: tall } : {}) };
    });
  }, [board.rows, narrow, family]);
  const events = useMemo(
    () =>
      board.rows.map((r) => ({
        id: r.id,
        resourceId: r.id,
        name: r.title,
        startDate: r.start,
        endDate: r.end,
        cls: `bd-ev bd-${r.band} bd-${r.key} bd-end-${r.endKind}`,
      })),
    [board.rows],
  );

  const columns = useMemo(
    () => [
      {
        text: "Case",
        field: "name",
        width: Math.round(margin + (narrow ? 140 : 400)),
        cls: "bd-case-head",
        sortable: false,
        groupable: false,
        draggable: false,
        resizable: false,
        cellCls: "bd-case-cell",
        renderer: ({ record }: { record: { id: unknown } }) => {
          const r = byId.get(String(record.id));
          if (!r) return "";
          return {
            className: narrow ? "bd-case bd-case-narrow" : "bd-case",
            children: [
              { tag: "span", className: "bd-amount", text: r.amount },
              { tag: "a", className: "bd-name", href: r.href, text: r.title },
              ...(narrow ? [] : [{ tag: "span", className: "bd-state", text: r.held ? "Kept waiting for a demo recording" : r.state }]),
            ],
          };
        },
      },
    ],
    [byId, margin, narrow],
  );

  const eventRenderer = useCallback<EventRenderer>(
    ({ eventRecord, renderData, scheduler }) => {
      const row = byId.get(String(eventRecord.resourceId));
      if (!row) return "";
      // what a screen reader hears on the focusable bar (Bryntum's default reads its raw duration)
      renderData.ariaLabel = `${row.amount} ${row.title}. ${row.state}. ${row.endWords}. Opens the case.`;
      const total = (scheduler as unknown as { timeAxisViewModel?: { totalSize?: number } }).timeAxisViewModel?.totalSize ?? Infinity;
      return barFor(row, renderData.width, total - renderData.left, nowMs, font, narrow);
    },
    [byId, nowMs, font, narrow],
  );

  const tooltip = useCallback<TooltipTemplate>(
    ({ eventRecord }) => {
      const r = byId.get(String(eventRecord.resourceId));
      if (!r) return "";
      const e = StringHelper.encodeHtml;
      const lines = r.moments.map((m) => `<li data-who="${m.who}" data-tone="${m.tone}"><span class="bd-tip-at">${e(m.when)}</span> ${e(m.title)}</li>`).join("");
      return `<p class="bd-tip-title">${e(r.amount)} ${e(r.title)}</p><p class="bd-tip-state">${e(r.claim)}. ${e(r.state)}.</p><ol class="bd-tip-moments">${lines}</ol><p class="bd-tip-end">${e(r.endWords)}</p>`;
    },
    [byId],
  );

  const preset = useMemo(
    () =>
      view === "deadlines"
        ? {
            id: "bd-days",
            name: "Days",
            mainUnit: "day",
            shiftUnit: "day",
            shiftIncrement: 1,
            defaultSpan: 14,
            tickWidth: narrow ? 44 : 64,
            timeResolution: { unit: "hour", increment: 1 },
            // a phone has room for a tick every three days
            headers: narrow
              ? [
                  { unit: "month", dateFormat: "MMM" },
                  { unit: "day", increment: 3, dateFormat: "D" },
                ]
              : [
                  { unit: "month", dateFormat: "MMMM" },
                  { unit: "day", dateFormat: "D" },
                ],
          }
        : {
            id: "bd-hours",
            name: "Hours",
            mainUnit: "hour",
            shiftUnit: "hour",
            shiftIncrement: 3,
            defaultSpan: 30,
            tickWidth: narrow ? 64 : 96,
            timeResolution: { unit: "minute", increment: 1 },
            headers: [
              { unit: "day", dateFormat: "ddd, MMM D" },
              { unit: "hour", increment: 3, dateFormat: "h a" },
            ],
          },
    [view, narrow],
  );

  const rowHeight = ROW(narrow);
  const barHeight = 28;

  return (
    <section className="bd-board" aria-label="Deadline board">
      {/* the board's toolbar: its own band above the time axis */}
      <div className="wrap bd-tools" data-section>
        <fieldset className="bd-views" aria-label="Span">
          <legend className="bd-views-k">Span</legend>
          {(
            [
              ["deadlines", "To the deadlines"],
              ["hours", "Hour by hour"],
            ] as const
          ).map(([v, words]) => (
            <label key={v} className="bd-view">
              <input type="radio" name="bd-view" value={v} checked={view === v} onChange={() => pick(v)} />
              <span>{words}</span>
            </label>
          ))}
        </fieldset>
        <ul className="bd-key" aria-label="Key">
          <li>
            <span className="bd-key-dot" data-who="caseclerk" aria-hidden="true" />
            CaseClerk or you
          </li>
          <li>
            <span className="bd-key-dot" data-who="paypal" aria-hidden="true" />
            PayPal
          </li>
          <li>
            <span className="bd-key-now" aria-hidden="true" />
            Now
          </li>
          <li className="bd-key-fine">Times in PT. Select a case to open it.</li>
        </ul>
      </div>
      <div className="bd-sched">
        <BryntumScheduler
          key={`${view}-${narrow}`}
          cls="bd-scheduler"
          readOnly
          timeZone="America/Los_Angeles"
          startDate={span.startDate}
          endDate={span.endDate}
          viewPreset={preset}
          forceFit={view === "deadlines" || !narrow}
          zoomOnMouseWheel={false}
          zoomOnTimeAxisDoubleClick={false}
          rowHeight={rowHeight}
          barMargin={(rowHeight - barHeight) / 2}
          eventLayout="none"
          eventStyle={null}
          enableEventAnimations={false}
          useInitialAnimation={false}
          columns={columns}
          resources={resources}
          events={events}
          eventRenderer={eventRenderer}
          visibleDate={view === "hours" && narrow ? { date: new Date(nowMs), block: "center" } : undefined}
          groupFeature={{
            field: "band",
            headerHeight: narrow ? 56 : 44,
            renderer: ({ groupRowFor, count, isFirstColumn }: { groupRowFor: unknown; count: number; isFirstColumn: boolean }) =>
              isFirstColumn ? { tag: "span", className: "bd-group", text: `${count} ${BAND_WORDS[BANDS[Number(groupRowFor)]] ?? ""}` } : "",
          }}
          sortFeature={false}
          cellEditFeature={false}
          cellMenuFeature={false}
          headerMenuFeature={false}
          timeAxisHeaderMenuFeature={false}
          eventMenuFeature={false}
          scheduleMenuFeature={false}
          scheduleTooltipFeature={false}
          eventDragFeature={false}
          eventResizeFeature={false}
          eventDragCreateFeature={false}
          eventEditFeature={false}
          columnReorderFeature={false}
          columnResizeFeature={false}
          stripeFeature={false}
          timeRangesFeature={{ showCurrentTimeLine: { name: "Now" }, showHeaderElements: false }}
          eventTooltipFeature={{ template: tooltip, cls: "bd-tip", hoverDelay: 100, hideDelay: 0, allowOver: false }}
          onPaint={({ source }) => {
            source.element
              ?.querySelector(".b-sch-time-axis-column")
              ?.setAttribute("data-align-ok", "Bryntum's generated time-axis header: its date labels sit on their ticks, placed by date, not on the page's text edges");
            // Tab lands on this header; Bryntum's own label offers a column menu the board turns off
            source.element?.querySelector(".bd-case-head")?.setAttribute("aria-label", "Cases. Arrow down to a case, Enter opens it.");
          }}
          onEventClick={({ eventRecord }) => open(eventRecord.resourceId)}
          onEventKeyDown={({ eventRecords, event }) => {
            if (event.key === "Enter" && eventRecords[0]) open(eventRecords[0].resourceId);
          }}
          onScheduleClick={({ resourceRecord }) => open(resourceRecord?.id)}
          onCellClick={({ record, event }) => {
            // a modified click on the case's link opens it the browser's way (a new tab); a plain one stays in the app
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
            event.preventDefault();
            open(record.id);
          }}
        />
      </div>
    </section>
  );
}
