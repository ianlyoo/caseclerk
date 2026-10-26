// Where the scale's stop labels go: rows under the rail, each label hanging right or left of its leader.
// A pure function of measured boxes, so the layout can be checked without a browser.

/** A stop's label as measured: its dot's x on the rail and its width (padding and leader border included), in px. */
export type LabelBox = { id: string; x: number; w: number; passing?: boolean };
export type End = "left" | "right";
export type Placed = { rows: Record<string, 1 | 2 | 3>; ends: Record<string, End>; hidden: string[]; nRows: number; clean: boolean };

/** clear space between two labels in a row */
const GAP = 16;
/** clear space between a leader and a label it passes */
const LEAD = 6;

type Pick = { row: number; end: End; l: number; r: number };

const span = (b: LabelBox, end: End) => (end === "right" ? { l: b.x - b.w, r: b.x } : { l: b.x, r: b.x + b.w });
/** the side a label takes when nothing is in its way: right of its leader unless it would run past the rail */
const natural = (b: LabelBox, W: number): End => (b.x + b.w > W ? "right" : "left");

/**
 * The cheapest clean layout in at most `maxRows` rows, or null. Clean: no two labels in a row within GAP, and no
 * leader (which runs up from its label through every row above) passes through a label in a row above it.
 * Cost: rows that break the 1, 2, 1, 2 alternation, a label on its unnatural side, a third row.
 */
function search(boxes: LabelBox[], W: number, maxRows: number): { cost: number; picks: Pick[] } | null {
  let best: { cost: number; picks: Pick[] } | null = null;
  const picks: Pick[] = [];
  const go = (i: number, cost: number) => {
    if (best && cost >= best.cost) return;
    if (i === boxes.length) {
      best = { cost, picks: picks.slice() };
      return;
    }
    const b = boxes[i];
    const nat = natural(b, W);
    const ends: End[] = [nat];
    const alt: End = nat === "left" ? "right" : "left";
    const s = span(b, alt);
    if (s.l >= 0 && s.r <= W) ends.push(alt);
    for (let row = 1; row <= maxRows; row++) {
      for (const end of ends) {
        const { l, r } = span(b, end);
        const ok = picks.every((p, j) => {
          const o = boxes[j];
          if (p.row === row) return l >= p.r + GAP || p.l >= r + GAP;
          // the lower label's leader runs up through the upper one's row
          if (row > p.row) return b.x <= p.l - LEAD || b.x >= p.r + LEAD;
          return o.x <= l - LEAD || o.x >= r + LEAD;
        });
        if (!ok) continue;
        const add = (row === 3 ? 4 : row - 1 !== i % 2 ? 1 : 0) + (end === nat ? 0 : 2);
        picks.push({ row, end, l, r });
        go(i + 1, cost + add);
        picks.pop();
      }
    }
  };
  go(0, 0);
  return best;
}

/** The stage-2 layout, kept for a scale nothing clean fits: two rows, natural sides, the fewest clashes. */
function leastBad(boxes: LabelBox[], W: number): Pick[] {
  const base = boxes.map((b) => ({ end: natural(b, W), ...span(b, natural(b, W)) }));
  let best = { cost: Infinity, mask: 0 };
  for (let mask = 0; mask < 1 << boxes.length; mask++) {
    const row = (i: number) => (mask >> i) & 1;
    let bad = 0;
    let off = 0;
    base.forEach((b, i) => {
      if (row(i) !== i % 2) off++;
      for (let j = i + 1; j < base.length; j++) {
        const o = base[j];
        if (row(i) === row(j) && o.l < b.r + GAP && b.l < o.r + GAP) bad++;
        if (row(j) === 1 && row(i) === 0 && boxes[j].x > b.l - LEAD && boxes[j].x < b.r + LEAD) bad++;
        if (row(i) === 1 && row(j) === 0 && boxes[i].x > o.l - LEAD && boxes[i].x < o.r + LEAD) bad++;
      }
    });
    const cost = bad * 100 + off;
    if (cost < best.cost) best = { cost, mask };
  }
  return base.map((b, i) => ({ row: ((best.mask >> i) & 1) + 1, end: b.end, l: b.l, r: b.r }));
}

/**
 * Two rows when they fit, sides chosen so leaders clear the labels; a third row when two can't; then a passing
 * stop ("now", which the index and the readout already mark) gives up its label. Only then may labels clash.
 */
export function placeLabels(boxes: LabelBox[], W: number): Placed {
  const out = (list: LabelBox[], picks: Pick[], hidden: string[], clean: boolean): Placed => {
    const rows: Placed["rows"] = {};
    const ends: Placed["ends"] = {};
    list.forEach((b, i) => {
      rows[b.id] = picks[i].row as 1 | 2 | 3;
      ends[b.id] = picks[i].end;
    });
    for (const id of hidden) {
      const b = boxes.find((x) => x.id === id)!;
      rows[id] = 1;
      ends[id] = natural(b, W);
    }
    return { rows, ends, hidden, nRows: Math.max(2, ...Object.values(rows)), clean };
  };
  // the search is exhaustive with pruning; past eight labels it keeps to the old layout
  if (boxes.length <= 8) {
    const kept = boxes.filter((b) => !b.passing);
    const hide = boxes.filter((b) => b.passing).map((b) => b.id);
    const tries: [LabelBox[], number, string[]][] = [
      [boxes, 2, []],
      [boxes, 3, []],
      ...(hide.length ? ([[kept, 2, hide], [kept, 3, hide]] as [LabelBox[], number, string[]][]) : []),
    ];
    for (const [list, maxRows, hidden] of tries) {
      const found = search(list, W, maxRows);
      if (found) return out(list, found.picks, hidden, true);
    }
  }
  return out(boxes, leastBad(boxes, W), [], false);
}
