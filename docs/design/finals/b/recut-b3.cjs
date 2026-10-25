// Final B, round 3: re-cut the B3 ceremony from its raw take (no new click), and end on the same case's own
// resolved state, recorded fresh from the hosted build as a read-only page view.
//   OUT=... PW=... CHROME=... node recut-b3.cjs http://localhost:4102 <raw frames dir>
// Edit decisions (frame numbers are the raw take's, 1440x810):
// - f00743..f00758 are the 0.11 s where the old build drew the filed row over the sliding rows and the sheet's
//   "Sending to PayPal" faded under the success headline. f00742 holds for exactly their duration, so the clock and
//   the fast-forward ratio are unchanged; the take resumes at f00759, where everything has landed.
// - f00418..f00764 carry the old caption; a new one with the real numbers is drawn over it, same place and size or larger.
// - The take ends at f01118, before the old NJA card. A new card, then IMW itself, resolved.
const { chromium } = require(process.env.PW);
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const BASE = process.argv[2];
const RAW = process.argv[3];
const OUT = process.env.OUT;
const CASE = "PP-R-IMW-10194496";
const RULING = "Sandbox only: we asked PayPal's sandbox to rule. On a live account PayPal decides on its own.";
const ff = (...a) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...a]);

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
  const work = fs.mkdtempSync(path.join(OUT, "recut-"));
  // The raw take's numbers, from its log: the wait for PayPal and the speed it was shown at.
  const raw = fs.readFileSync(path.join(OUT, "log-b3.txt"), "utf8");
  const m = raw.match(/wait for PayPal ([\d.]+) s shown at ([\d.]+)x/);
  const caption = `Fast-forward ${m[2]}× (real PayPal wait ${m[1]} s): PayPal is taking the evidence`;

  const b = await chromium.launch({ executablePath: process.env.CHROME });
  // 1. The caption overlay, transparent, at the old caption's anchor (bottom 296, right 28).
  {
    const page = await b.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
    await page.setContent("<html><body style='margin:0;background:transparent'></body></html>");
    await page.evaluate(pill(caption, { bottom: "296px", right: "28px" }));
    const r = await page.evaluate(() => document.getElementById("cc-caption").getBoundingClientRect().toJSON());
    log.push(`caption "${caption}" at ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    await page.screenshot({ path: path.join(work, "pill.png"), omitBackground: true });
    // 2. The card.
    await page.setContent(`<html><body style="margin:0;width:1440px;height:810px;background:#f4f0e6;color:#16140f;display:grid;place-content:center;gap:14px;text-align:center">
      <p style="font:400 44px/1.15 Georgia,serif;margin:0">8 minutes later: PayPal closed it.</p>
      <p style="font:400 18px/1.4 system-ui,sans-serif;color:#4a463d;margin:0">Same case, ${CASE}: filed 04:28:41 PT; PayPal's closing webhook arrived 04:37:09 PT.</p>
      <p style="font:400 16px/1.4 system-ui,sans-serif;color:#4a463d;margin:8px 0 0">${RULING}</p></body></html>`);
    await page.screenshot({ path: path.join(work, "card.png") });
    await page.close();
  }
  // 3. Burn the new caption into the raw frames that carry the old one.
  const fr = path.join(work, "a");
  fs.mkdirSync(fr);
  ff("-start_number", "418", "-i", path.join(RAW, "f%05d.jpg"), "-i", path.join(work, "pill.png"), "-filter_complex", "overlay=0:0", "-frames:v", String(764 - 418 + 1), "-q:v", "1", "-start_number", "418", path.join(fr, "f%05d.jpg"));
  // Same pixel format as the screencast frames, or the concat demuxer drops it.
  ff("-i", path.join(work, "card.png"), "-pix_fmt", "yuvj420p", "-q:v", "1", path.join(work, "card.jpg"));

  // 4. The edit list for the take.
  const L = fs.readFileSync(path.join(RAW, "list.txt"), "utf8").split("\n");
  const take = [];
  for (let i = 0; i < L.length - 1; i++) {
    const f = L[i].match(/f(\d{5})\.jpg/);
    const d = L[i + 1].match(/^duration ([\d.]+)/);
    if (f && d) take.push({ n: Number(f[1]), d: Number(d[1]) });
  }
  const A = [];
  let held = 0;
  for (const x of take) {
    if (x.n > 1118) break;
    if (x.n >= 743 && x.n <= 758) {
      held += x.d;
      continue;
    }
    A.push({ ...x });
  }
  A.find((x) => x.n === 742).d += held;
  const fileOf = (n) => (n >= 418 && n <= 764 ? path.join(fr, `f${String(n).padStart(5, "0")}.jpg`) : path.join(RAW, `f${String(n).padStart(5, "0")}.jpg`));
  log.push(`take: ${A.length} frames, ${A.reduce((s, x) => s + x.d, 0).toFixed(2)} s; f00742 held ${held.toFixed(3)} s in place of f00743-f00758`);

  // 5. IMW itself, resolved: a fresh read-only page view of the hosted build (GET only; every POST is refused).
  const ctx = await b.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 });
  await ctx.route("**/*", (r) => (r.request().method() === "GET" ? r.continue() : r.abort()));
  const page = await ctx.newPage();
  await page.goto(`${BASE}/finals/b/case/${CASE}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => /You keep \$382\.33: .* PayPal paid the buyer itself\.$/.test(document.querySelector("h1")?.innerText || ""), null, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1300, 700);
  await page.evaluate(pill(`Same case, ${CASE}, after PayPal closed it`, { bottom: "20px", left: "20px" }));
  await page.waitForTimeout(400);
  log.push("END H1 " + (await page.locator("h1").innerText()));
  log.push("END META " + (await page.locator("[class*=figMeta]").innerText()).replace(/\s+/g, " "));
  log.push("END MAST " + (await page.locator("header [data-origin=paypal]").innerText()).replace(/\s+/g, " "));
  await page.screenshot({ path: path.join(OUT, "b3-end.png") });
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
  await page.waitForTimeout(800);
  // Hold still, then show the money line and the disclosure under the figure.
  await page.waitForTimeout(4800);
  const tEnd = Date.now() / 1000;
  await cdp.send("Page.stopScreencast");
  await ctx.close();
  await b.close();
  if (!C.length) throw new Error("no frames for the end");

  const lines = [];
  for (const x of A) lines.push(`file '${fileOf(x.n)}'`, `duration ${x.d.toFixed(4)}`);
  lines.push(`file '${path.join(work, "card.jpg")}'`, "duration 3.6");
  // A still page sends few frames; each lasts until the next, the last until the end (at least 5 s in all).
  const span = Math.max(5, tEnd - C[0].t);
  C.forEach((c, i) => lines.push(`file '${c.file}'`, `duration ${Math.max(0.001, (C[i + 1] ? C[i + 1].t : C[0].t + span) - c.t).toFixed(4)}`));
  lines.push(`file '${C[C.length - 1].file}'`);
  fs.writeFileSync(path.join(work, "list.txt"), lines.join("\n") + "\n");
  const total = A.reduce((s, x) => s + x.d, 0) + 3.6 + span;
  const mp4 = path.join(OUT, "case-approve-real-b3-recut.mp4");
  ff("-f", "concat", "-safe", "0", "-i", path.join(work, "list.txt"), "-t", total.toFixed(2), "-vf", "scale=2880:1620:flags=lanczos,fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-movflags", "+faststart", mp4);
  log.push(`video ${mp4} ${total.toFixed(1)} s: take ${A.reduce((s, x) => s + x.d, 0).toFixed(1)} s, card 3.6 s, ${CASE} resolved ${span.toFixed(1)} s (${C.length} frames)`);
  fs.writeFileSync(path.join(OUT, "log-b3-recut.txt"), log.join("\n") + "\n");
  console.log(log.join("\n"));
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
