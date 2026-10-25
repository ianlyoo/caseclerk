// Final B, round 4: re-cut the B4 ceremony from its own take (no new click). The judge asked for two things:
// - the "Real time, not sped up" caption sat beside the CUSTOMER.DISPUTE.UPDATED row; it moves to the empty middle of
//   the masthead. Under the old caption there was only blank paper and the sheet's shadow (no row text reaches
//   x 1000 at that height), so each of those frames is repaired from its own blank column just left of it.
// - the ending: a card with "You kept" and the time since the approval, then IHX resolved, re-recorded read-only from
//   the current build (GET only; every POST is refused).
//   OUT=... PW=... CHROME=... node recut-b4.cjs <base>
const { chromium } = require(process.env.PW);
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const BASE = process.argv[2];
const OUT = process.env.OUT;
const dir = path.join(OUT, "take-b4");
const T = JSON.parse(fs.readFileSync(path.join(dir, "take.json"), "utf8"));
const CASE = T.case;
const RULING = "Sandbox only: we asked PayPal's sandbox to rule. On a live account PayPal decides on its own.";
const ff = (...a) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...a]);
const pt = (iso) => new Date(iso).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour12: false }) + " PT";
// The take's frames that carry the old caption (found by its dark fill at x 1200, y 479), and its box with shadow.
const FIRST = 383;
const LAST = 579;
const HOLE = { x: 990, y: 466, w: 450, h: 76 };
const PILL = { position: "fixed", zIndex: 99, background: "#16140f", color: "#fbf9f4", font: "500 15px/1.3 system-ui, sans-serif", padding: "9px 14px", borderRadius: "6px", boxShadow: "0 8px 24px -10px rgba(0,0,0,.5)" };
const pill = (text, where) => `(() => {
  const d = document.createElement("div");
  d.id = "cc-caption";
  d.textContent = ${JSON.stringify(text)};
  Object.assign(d.style, ${JSON.stringify(PILL)}, ${JSON.stringify(where)});
  document.body.appendChild(d);
})()`;

(async () => {
  const log = [];
  const j = await (await fetch(`${BASE}/api/cases/${CASE}`)).json();
  const approved = j.audit.find((a) => a.actor === "seller" && /approv/i.test(a.kind));
  const closed = j.wire.filter((w) => w.kind === "event" && w.eventType === "CUSTOMER.DISPUTE.RESOLVED" && w.verify === "SUCCESS").pop();
  if (!approved || !closed || j.case.status !== "resolved") throw new Error("IHX is not approved and resolved");
  const mins = Math.floor((Date.parse(closed.at) - Date.parse(approved.at)) / 60000);
  const work = fs.mkdtempSync(path.join(OUT, "recut-b4-"));
  const b = await chromium.launch({ executablePath: process.env.CHROME });

  // 1. The read-only resolved view first: the card quotes the figure this build shows.
  const ctx = await b.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 });
  await ctx.route("**/*", (r) => (r.request().method() === "GET" ? r.continue() : r.abort()));
  const page = await ctx.newPage();
  await page.goto(`${BASE}/finals/b/case/${CASE}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => /PayPal closed the case\.$/.test(document.querySelector("h1")?.innerText || ""), null, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1300, 700);
  await page.waitForTimeout(2200);
  // NumberFlow draws its digits in a shadow root, so the figure's value is read from the element's own data.
  const fig = await page.evaluate(() => [...document.querySelector("p[class*=_figure_]").childNodes].map((e) => { const n = e.querySelector?.("number-flow-react"); const d = n && (n.data || n._data); return d ? [...d.pre, ...d.integer, ...d.fraction, ...d.post].map((x) => x.value).join("") : e.textContent; }).join(" "));
  const keptUsd = (fig.match(/^You kept (\$[\d,.]+)$/) || [])[1] || "";
  if (!/^\$380\.38$/.test(keptUsd)) throw new Error(`figure is "${fig}", not You kept $380.38`);
  await page.evaluate(pill(`Same case, ${CASE}, after PayPal closed it`, { bottom: "20px", left: "20px" }));
  await page.waitForTimeout(300);
  log.push("END H1 " + (await page.locator("h1").innerText()));
  log.push("END FIGURE " + fig);
  log.push("END META " + (await page.locator("[class*=figMeta]").innerText()).replace(/\s+/g, " "));
  log.push("END MAST " + (await page.locator("header [data-origin=paypal]").innerText()).replace(/\s+/g, " "));
  await page.screenshot({ path: path.join(OUT, "b4-end-r4.png") });
  const cdir = path.join(work, "c");
  fs.mkdirSync(cdir);
  const cdp = await ctx.newCDPSession(page);
  const C = [];
  cdp.on("Page.screencastFrame", async (f) => {
    const file = path.join(cdir, `c${String(C.length).padStart(5, "0")}.jpg`);
    fs.writeFileSync(file, Buffer.from(f.data, "base64"));
    C.push({ file, t: f.metadata.timestamp });
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: 1440, maxHeight: 810, everyNthFrame: 1 });
  await page.waitForTimeout(5600);
  const tEnd = Date.now() / 1000;
  await cdp.send("Page.stopScreencast");
  await ctx.close();
  if (!C.length) throw new Error("no frames for the end");

  // 2. The moved caption (transparent overlay, masthead middle) and the card.
  const caption = "Real time, not sped up: PayPal is taking the evidence";
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
    await p.setContent("<html><body style='margin:0;background:transparent'></body></html>");
    await p.evaluate(pill(caption, { top: "11px", left: "650px" }));
    const r = await p.evaluate(() => document.getElementById("cc-caption").getBoundingClientRect().toJSON());
    log.push(`caption moved to the masthead: ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} (frames f${String(FIRST).padStart(5, "0")}-f${String(LAST).padStart(5, "0")}); the old spot repaired from blank paper`);
    await p.screenshot({ path: path.join(work, "pill.png"), omitBackground: true });
    await p.setContent(`<html><body style="margin:0;width:1440px;height:810px;background:#f4f0e6;color:#16140f;display:grid;place-content:center;gap:14px;text-align:center">
      <p style="font:400 44px/1.15 Georgia,serif;margin:0">${mins} minutes after you approved, PayPal closed it.</p>
      <p style="font:400 26px/1.3 Georgia,serif;margin:0">Same case, ${CASE}. You kept ${keptUsd}.</p>
      <p style="font:400 18px/1.4 system-ui,sans-serif;color:#4a463d;margin:6px 0 0">Approved ${pt(approved.at)}; PayPal's closing webhook arrived ${pt(closed.at)}. The wait is cut.</p>
      <p style="font:400 16px/1.4 system-ui,sans-serif;color:#4a463d;margin:8px 0 0">${RULING}</p></body></html>`);
    await p.screenshot({ path: path.join(work, "card.png") });
    await p.close();
  }
  await b.close();
  ff("-i", path.join(work, "card.png"), "-pix_fmt", "yuvj420p", "-q:v", "1", path.join(work, "card.jpg"));

  // 3. Repair and re-caption the frames that carried the old caption: each takes its own blank column at x 986.
  const fr = path.join(work, "a");
  fs.mkdirSync(fr);
  const { x, y, w, h } = HOLE;
  ff(
    "-start_number", String(FIRST), "-i", path.join(dir, "f%05d.jpg"), "-i", path.join(work, "pill.png"),
    "-filter_complex", `[0]split[a][b];[b]crop=2:${h}:986:${y},scale=${w}:${h}:flags=neighbor[p];[a][p]overlay=${x}:${y}[c];[c][1]overlay=0:0,format=yuvj420p`,
    "-frames:v", String(LAST - FIRST + 1), "-q:v", "1", "-start_number", String(FIRST), path.join(fr, "f%05d.jpg"),
  );
  const fileOf = (name) => {
    const n = Number(name.slice(1, 6));
    return n >= FIRST && n <= LAST ? path.join(fr, name) : path.join(dir, name);
  };

  // 4. Stitch: the take at 1x, the card, IHX resolved.
  const lines = [];
  for (const t of T.take) lines.push(`file '${fileOf(t.file)}'`, `duration ${t.d.toFixed(4)}`);
  lines.push(`file '${path.join(work, "card.jpg")}'`, "duration 4.2");
  const span = Math.max(5, tEnd - C[0].t);
  C.forEach((c, i) => lines.push(`file '${c.file}'`, `duration ${Math.max(0.001, (C[i + 1] ? C[i + 1].t : C[0].t + span) - c.t).toFixed(4)}`));
  lines.push(`file '${C[C.length - 1].file}'`);
  fs.writeFileSync(path.join(work, "list.txt"), lines.join("\n") + "\n");
  const takeS = T.take.reduce((s, t) => s + t.d, 0);
  const total = takeS + 4.2 + span;
  const mp4 = path.join(OUT, "case-approve-real-b4-r4.mp4");
  ff("-f", "concat", "-safe", "0", "-i", path.join(work, "list.txt"), "-t", total.toFixed(2), "-vf", "scale=2880:1620:flags=lanczos,fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-movflags", "+faststart", mp4);
  log.push(`card: "${mins} minutes after you approved, PayPal closed it. Same case, ${CASE}. You kept ${keptUsd}." approved ${approved.at}, RESOLVED ${closed.eventId} at ${closed.at}`);
  log.push(`video ${path.basename(mp4)} ${total.toFixed(1)} s: take ${takeS.toFixed(1)} s at 1x (same take, no new click), card 4.2 s, ${CASE} resolved ${span.toFixed(1)} s, recorded read-only from ${BASE}`);
  fs.writeFileSync(path.join(OUT, "log-b4-r4.txt"), log.join("\n") + "\n");
  console.log(log.join("\n"));
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
