// Browser checks for Final B ("Darkroom paper"), the verdict's guardrails that apply to it (G-numbers from
// docs/design/VERDICT-meeting-r1.md §5, adapted where B differs: no Wire plane, the dark surface is the decision sheet,
// no blue at all). Also takes the owner's shots and the approval recording.
//   node docs/design/finals/b/check-ui-b.cjs <base-url> [--shots] [--video]
// PW: path to playwright-core; CHROME: path to a Chromium binary (defaults below are this host's).
const PW = process.env.PW || "/srv/company/work/web-design/terra/node_modules/playwright-core";
const CHROME = process.env.CHROME || "/srv/company/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux-arm64/chrome-headless-shell";
const { chromium } = require(PW);
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const BASE = process.argv[2].replace(/\/$/, "");
const SHOTS = process.argv.includes("--shots");
const VIDEO = process.argv.includes("--video");
const OUT = path.join(__dirname);
const HERO = "PP-R-NKT-10227591";
const REAL = "PP-R-JKB-10194463";
const PAGES = {
  landing: "/finals/b",
  inbox: "/finals/b/inbox",
  "case-pending": `/finals/b/case/${HERO}`,
  "case-approved": `/finals/b/case/${HERO}?state=approved`,
  "case-resolved": `/finals/b/case/${HERO}?state=resolved`,
  "case-real": `/finals/b/case/${REAL}`,
};
const VP = {
  1440: { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 },
  1920: { viewport: { width: 1920, height: 940 }, deviceScaleFactor: 1 },
  1536: { viewport: { width: 1536, height: 752 }, deviceScaleFactor: 1.25 },
  2560: { viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 1 },
  390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

let fails = 0;
let passes = 0;
const out = (ok, name, note) => {
  if (ok) passes++;
  else fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? ` (${note})` : ""}`);
};

async function open(browser, vp, p, extra = {}) {
  const ctx = await browser.newContext({ ...VP[vp], ...extra });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  const res = await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await settle(page, p);
  return { ctx, page, status: res.status(), errs };
}

/** Wait until the page has hydrated and the state the URL asks for is on screen. */
async function settle(page, p) {
  if (p.includes(HERO) && !p.includes("state=")) await page.waitForSelector("[data-sheet] button[data-phase=pending]", { timeout: 60000 });
  else if (p.includes("state=approved")) await page.waitForFunction(() => /Evidence filed with PayPal/.test(document.body.innerText), null, { timeout: 60000 });
  else if (p.includes("state=resolved")) await page.waitForFunction(() => /You kept/.test(document.body.innerText), null, { timeout: 60000 });
  else if (p === "/finals/b") await page.waitForFunction(() => /verified/.test(document.body.innerText), null, { timeout: 60000 });
  await page.waitForTimeout(1600);
}

// ---------------------------------------------------------------- probes run in the page

const probeColours = () => {
  const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => {
    const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const hls = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, l, 0];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, l, s];
  };
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = rgb(getComputedStyle(e).backgroundColor);
      if (c.length === 3 || (c.length === 4 && c[3] > 0.9)) return c.slice(0, 3);
    }
    return [255, 255, 255];
  };
  const W = innerWidth, H = innerHeight;
  const darkOutside = [], blue = [], smallText = [], lowContrast = [], shadows = [];
  for (const el of document.querySelectorAll(".__never, body *")) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || cs.visibility === "hidden" || cs.display === "none") continue;
    const bg = rgb(cs.backgroundColor);
    if ((bg.length === 3 || bg[3] > 0.9) && lum(bg) < 0.1) {
      const vis = Math.max(0, Math.min(r.right, W) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, H) - Math.max(r.top, 0));
      if (vis > 0.04 * W * H && !el.closest("[data-sheet]")) darkOutside.push(el.className || el.tagName);
    }
    for (const prop of ["color", "backgroundColor", "borderTopColor", "borderLeftColor"]) {
      const c = rgb(cs[prop]);
      if (c.length < 3 || (c.length === 4 && c[3] === 0)) continue;
      const [h, l, s] = hls(c);
      if (h >= 180 && h <= 260 && s > 0.25 && l > 0.08 && l < 0.92) blue.push(`${el.tagName}.${prop}=${cs[prop]}`);
    }
    if (cs.boxShadow !== "none" && !el.closest("[data-object]")) shadows.push(el.className || el.tagName);
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own || el.closest("[aria-hidden=true],[aria-hidden='']") || r.bottom < 0 || r.top > H * 3) continue;
    const fs = parseFloat(cs.fontSize);
    if (fs < 13) smallText.push(`${el.tagName} ${fs}px "${el.textContent.trim().slice(0, 30)}"`);
    const fg = rgb(cs.color);
    const bgc = bgOf(el);
    const a = lum(fg.slice(0, 3)), b = lum(bgc);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const disabled = el.closest("button:disabled");
    if (ratio < 4.5 && !disabled && parseFloat(cs.opacity) > 0.5) lowContrast.push(`${ratio.toFixed(2)} "${el.textContent.trim().slice(0, 30)}"`);
  }
  return { darkOutside, blue: [...new Set(blue)].slice(0, 6), smallText: smallText.slice(0, 6), lowContrast: [...new Set(lowContrast)].slice(0, 6), shadows: [...new Set(shadows)].slice(0, 6) };
};

const probeFirstScreen = () => {
  const H = innerHeight;
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= H && r.width > 0;
  };
  const els = [...document.querySelectorAll("body *")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const find = (re, minPx = 0) => els.find((e) => vis(e) && re.test(e.textContent) && parseFloat(getComputedStyle(e).fontSize) >= minPx);
  return {
    event: !!find(/CUSTOMER\.DISPUTE\.[A-Z_]+/, 14),
    debug: !!find(/debug id [0-9a-f]{12,13}\b/, 14),
    cents: !!find(/\$[\d,]+\.\d{2}/),
    replay: !!find(/Replay of PP-R-[A-Z]{3}-\d{8}, recorded/),
  };
};

const probeAnimations = () =>
  document.getAnimations().map((a) => {
    const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : {};
    const target = a.effect && a.effect.target;
    return {
      dur: typeof t.duration === "number" ? t.duration : 0,
      iter: t.iterations,
      live: !!(target && target.closest && target.closest("[data-live-dot],[data-inflight]")),
      cause: !!(target && target.closest && target.closest("[data-cause]")),
      undo: !!(target && target.closest && target.closest("[data-phase]")),
      replay: !!(target && target.closest && target.closest("[aria-label='Replay of a real case']")),
      name: a.animationName || (target && target.className && String(target.className).slice(0, 40)) || "waapi",
    };
  });

// ---------------------------------------------------------------- the checks

async function pageChecks(browser) {
  for (const [name, p] of Object.entries(PAGES)) {
    for (const vp of [1440, 1920, 1536, 2560, 390]) {
      const { ctx, page, status, errs } = await open(browser, vp, p);
      const tag = `${name} @${vp}`;
      out(status === 200 && errs.length === 0, `${tag}: loads without errors`, errs[0]);
      if (name === "landing") await page.waitForTimeout(9500); // the replay of the real case runs 9 s
      const c = await page.evaluate(probeColours);
      out(c.darkOutside.length === 0, `${tag}: G5 one dark surface, only the decision sheet`, c.darkOutside.join(", "));
      out(c.blue.length === 0, `${tag}: B no blue or teal anywhere (G6/G20 for B)`, c.blue.join("; "));
      out(c.shadows.length === 0, `${tag}: G8 shadows only on objects`, c.shadows.join(", "));
      out(c.smallText.length === 0, `${tag}: G9 text >= 13 px`, c.smallText.join("; "));
      out(c.lowContrast.length === 0, `${tag}: G9 contrast >= 4.5:1`, c.lowContrast.join("; "));
      const anims = await page.evaluate(probeAnimations);
      const loops = anims.filter((a) => a.iter === Infinity && !a.live);
      out(loops.length === 0, `${tag}: G3 only the live dot and in-flight rules loop`, loops.map((a) => a.name).join(", "));
      const long = anims.filter((a) => a.dur > 900 && a.iter !== Infinity && !a.undo && !a.replay);
      out(long.length === 0, `${tag}: G3 animations <= 900 ms`, long.map((a) => `${a.name} ${a.dur}`).join(", "));
      const nocause = anims.filter((a) => !a.cause && !a.live);
      out(nocause.length === 0, `${tag}: G2 every running animation has a data-cause`, nocause.map((a) => a.name).join(", "));
      const lines = await page.evaluate(() =>
        [...document.querySelectorAll("[data-wire-line]")].map((l) => ({ ok: l.dataset.origin === "paypal", text: l.textContent })),
      );
      const bad7 = lines.filter((l) => !l.ok || /claude-|\$0\.|Triage|policy/.test(l.text));
      out(bad7.length === 0, `${tag}: G7 PayPal rows are PayPal-only`, `${bad7.length} of ${lines.length}`);
      if (vp === 1440 && ["landing", "inbox", "case-real"].includes(name)) {
        const f = await page.evaluate(probeFirstScreen);
        out(f.event && f.debug && f.cents && (name !== "landing" || f.replay), `${tag}: G13 first screen shows a webhook, a debug id >= 14 px and cents`, JSON.stringify(f));
      }
      if (name === "case-pending" && vp !== 2560) {
        const box = await page.locator("[data-sheet] button[data-phase]").boundingBox();
        const amt = await page.locator("[data-sheet] [data-cause=approve]").first().boundingBox();
        const h = VP[vp].viewport.height;
        const sheet = await page.locator("[data-sheet]").boundingBox();
        const okFold = box && box.y + box.height <= h && amt && amt.y >= 0 && amt.y + amt.height <= h;
        out(okFold, `${tag}: G14 the amount and Approve on the first screen`, box ? `button bottom ${Math.round(box.y + box.height)} of ${h}, sheet ${Math.round(sheet.height)} px` : "no button");
        const fit = await page.locator("[data-sheet] button[data-phase]").evaluate((b) => b.scrollWidth <= b.clientWidth && b.scrollHeight <= b.clientHeight && b.getClientRects().length === 1 && b.querySelector("[class*=approveText]").getClientRects().length === 1 && parseFloat(getComputedStyle(b).height) >= 44);
        out(fit, `${tag}: G14 the Approve label sits on one line inside the button`);
        const btn = await page.locator("[data-sheet] button[data-phase]").innerText();
        out(/\$412\.00/.test(btn), `${tag}: G14 the button names the amount`, btn);
      }
      if (name === "inbox" && [1440, 1920, 2560].includes(vp)) {
        const s = await page.evaluate(() => {
          const st = document.querySelector("#deadlines");
          return { cells: st ? st.children.length : 0, fits: st ? st.scrollWidth <= st.clientWidth : false, marks: [...document.querySelectorAll("[data-due]")].map((m) => m.dataset.due) };
        });
        out(s.cells === 14 && s.fits && s.marks.every((d) => !Number.isNaN(Date.parse(d))), `${tag}: G19 the 14-day strip fits and every mark has a due date`, `${s.cells} cells, ${s.marks.length} marks`);
      }
      if (SHOTS && [1440, 1920, 390].includes(vp) && name !== "case-real") {
        await page.screenshot({ path: path.join(OUT, `${name}-${vp}.png`) });
      }
      if (SHOTS && name === "case-real" && vp === 1440) await page.screenshot({ path: path.join(OUT, `case-real-1440.png`) });
      await ctx.close();
    }
  }
}

async function honesty(browser) {
  const api = await (await fetch(`https://caseclerk.vercel.app/api/cases/${REAL}`)).json();
  const known = new Set();
  for (const a of api.actions) if (a.result && a.result.debugId) known.add(a.result.debugId);
  for (const a of api.audit) for (const k of ["debugId", "eventId"]) if (a.data && a.data[k]) known.add(a.data[k]);
  for (const p of [PAGES.landing, PAGES["case-real"], PAGES.inbox]) {
    const { ctx, page } = await open(browser, 1440, p);
    if (p === PAGES.landing) await page.waitForTimeout(9500);
    const ids = await page.evaluate(() => {
      const t = document.body.innerText;
      return { debug: [...t.matchAll(/debug id ([0-9a-f]{12,13})\b/g)].map((m) => m[1]), events: [...t.matchAll(/event (WH-[A-Z0-9-]+)/g)].map((m) => m[1]) };
    });
    const unknown = [...ids.debug, ...ids.events].filter((x) => !known.has(x));
    out(ids.debug.length > 0 && unknown.length === 0, `G12 ${p}: every PayPal id shown exists in production's audit for ${REAL}`, `${ids.debug.length} debug ids, ${ids.events.length} event ids, unknown: ${unknown.join(", ") || "none"}`);
    if (p === PAGES["case-real"]) {
      const lines = await page.evaluate(() => [...document.querySelectorAll("[data-wire-line]")].map((l) => (l.textContent.match(/debug id ([0-9a-f]{12,13})/) || [])[1]).filter(Boolean));
      out(new Set(lines).size === lines.length, `G12 no debug id is attached to two rows`, `${lines.length} rows with ids`);
    }
    await ctx.close();
  }
  for (const p of [PAGES["case-pending"], PAGES["case-approved"], PAGES["case-resolved"]]) {
    const { ctx, page } = await open(browser, 1440, p);
    const t = await page.evaluate(() => document.querySelector("main").innerText + "\n" + ([...document.querySelectorAll("[data-sheet]")].map((s) => s.innerText).join("\n")));
    out(/Sample case/.test(t) && !/debug id [0-9a-f]{12}/.test(t) && !/WH-[A-Z0-9]{17}/.test(t), `G12 ${p}: marked "Sample case", no PayPal ids on sample content`);
    await ctx.close();
  }
}

async function approvePath(browser, vp, reduced) {
  const tag = `approve @${vp}${reduced ? " reduced motion" : ""}`;
  const { ctx, page } = await open(browser, vp, PAGES["case-pending"], reduced ? { reducedMotion: "reduce" } : {});
  const count = () => page.evaluate(() => Number(document.querySelector("header nav [data-count]").dataset.count || 0));
  const before = await count();
  const rowsBefore = await page.locator("[data-wire-line]").count();
  await page.locator("[data-sheet] button[data-phase=pending]").click();
  await page.waitForTimeout(500);
  const a1 = await page.evaluate(probeAnimations);
  if (reduced) {
    const long = a1.filter((a) => a.dur > 150 && a.iter !== Infinity);
    out(long.length === 0, `${tag}: G4 every animation <= 150 ms`, long.map((a) => `${a.name} ${a.dur}`).join(", "));
  } else {
    out(a1.length >= 1, `${tag}: G1 Approve starts the brass fill`, `${a1.length} animations`);
  }
  out(/Undo/.test(await page.locator("[data-sheet]").innerText()), `${tag}: a 4 s undo window with Undo and Send now`);
  await page.getByRole("button", { name: "Send now" }).click();
  await page.waitForTimeout(250);
  const inflight = await page.locator("[data-inflight]").count();
  const a2 = await page.evaluate(probeAnimations);
  out(inflight >= 1 && (reduced || a2.length >= 2), `${tag}: G1 sending shows the in-flight rule`, `${inflight} in-flight, ${a2.length} animations`);
  await page.waitForFunction(() => /Evidence filed with PayPal/.test(document.body.innerText), null, { timeout: 15000 });
  await page.waitForTimeout(3600);
  const after = await count();
  const t = await page.evaluate(() => document.body.innerText);
  const rowsAfter = await page.locator("[data-wire-line]").count();
  const landed = await page.evaluate(() => [...document.querySelectorAll("[data-wire-line]")].some((l) => /provide-evidence/.test(l.innerText) && /^200$/m.test(l.innerText)));
  out(landed && rowsAfter === rowsBefore + 2, `${tag}: a provide-evidence 200 row and PayPal's update land in the timeline`, `${rowsBefore} -> ${rowsAfter} PayPal rows`);
  out(after === before - 1, `${tag}: the nav count rolls down by one`, `${before} -> ${after}`);
  const sheetH = (await page.locator("[data-sheet]").boundingBox()).height;
  out(sheetH < 100 && /Evidence filed with PayPal\s+\d\d:\d\d:\d\d/.test(t), `${tag}: the sheet collapses to one line with the time`, `${Math.round(sheetH)} px`);
  out((await page.locator("[data-sheet] button[data-phase]").count()) === 0 && !/until you decide/i.test(t), `${tag}: no way back to Approve after sending`);
  const listLine = await page.evaluate((id) => document.querySelector(`aside a[href$='${id}']`)?.textContent ?? "", HERO);
  out(vp === 390 || !/Needs your answer/.test(listLine), `${tag}: the case list line updates`, listLine.slice(0, 60));
  // Resolution beat.
  await page.getByRole("button", { name: "Ask PayPal to decide for the seller" }).click();
  await page.waitForFunction(() => /You kept/.test(document.querySelector("h1").textContent), null, { timeout: 5000 });
  await page.waitForTimeout(1200);
  const res = await page.evaluate(() => ({ h1: document.querySelector("h1").textContent, resolved: [...document.querySelectorAll("[data-wire-line]")].some((l) => /CUSTOMER\.DISPUTE\.RESOLVED/.test(l.textContent)) }));
  out(res.resolved && /You kept \$392\.00/.test(res.h1), `${tag}: resolution: RESOLVED lands and the h1 says what you kept`, res.h1.slice(0, 60));
  await ctx.close();
}

async function failurePath(browser) {
  const { ctx, page } = await open(browser, 1440, `${PAGES["case-pending"]}?fail=1`);
  await page.locator("[data-sheet] button[data-phase=pending]").click();
  await page.getByRole("button", { name: "Send now" }).click();
  await page.waitForFunction(() => /Nothing was sent/.test(document.body.innerText), null, { timeout: 10000 });
  const t = await page.locator("[data-sheet]").innerText();
  out(/Nothing was sent/.test(t) && /UNPROCESSABLE_ENTITY/.test(t), `approve failure: "Nothing was sent." with PayPal's error name`);
  await ctx.close();
}

async function reader(browser) {
  for (const p of [PAGES["case-pending"], PAGES["case-real"]]) {
    const { ctx, page } = await open(browser, 1440, p);
    await page.locator("[role=button][aria-label^='Read page 3']").click();
    await page.waitForSelector("[role=dialog]");
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const d = document.querySelector("[role=dialog]");
      const body = [...d.querySelectorAll("article p, article dd, article td")].filter((e) => !/pgKicker|pageFoot/.test(e.className));
      const all = [...d.querySelectorAll("article *")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
      const fs = (e) => parseFloat(getComputedStyle(e).fontSize);
      return { min: Math.min(...body.map(fs)), minAll: Math.min(...all.map(fs)), text: [...d.querySelectorAll("article")].map((a) => a.innerText).join("\n") };
    });
    out(r.min >= 16 && r.minAll >= 13, `G21 ${p}: reader body text >= 16 px, nothing under 13 px`, `body ${r.min.toFixed(1)} px, smallest ${r.minAll.toFixed(1)} px`);
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), page.getByRole("button", { name: /Download/ }).click()]);
    const file = await dl.path();
    const pdf = fs.readFileSync(file);
    out(pdf.slice(0, 5).toString() === "%PDF-", `G21 ${p}: the download is a PDF built from the same input`, `${pdf.length} bytes`);
    // Parity: every sentence of the statement and every exhibit body in the reader appears in the PDF's text.
    // The PDF repeats a running footer at each page break, sometimes mid-paragraph; drop it before comparing.
    const pdfText = pdfStrings(file).replace(/PayPal case PP-R-[A-Z]{3}-\d{8}\s+\|\s+Generated [^|]*?UTC\s+Page \d+ of \d+/g, " ");
    const norm = (s) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
    const flat = norm(pdfText).replace(/ /g, "");
    const chunks = r.text.split("\n").map(norm).filter((x) => x.length > 24 && !/^PayPal case .*Section/.test(x));
    const missing = chunks.filter((x) => !flat.includes(x.replace(/ /g, "")));
    out(missing.length === 0, `G21 ${p}: the reader's text equals the PDF's text`, missing.length ? `missing: "${missing[0].slice(0, 70)}"` : `${chunks.length} passages matched`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    out((await page.locator("[role=dialog]").count()) === 0, `${p}: Esc closes the reader`);
    await ctx.close();
  }
}

/** Text drawn by pdf-lib (hex strings in uncompressed or Flate content streams), in drawing order. */
function pdfStrings(file) {
  const zlib = require("zlib");
  const buf = fs.readFileSync(file);
  const parts = [];
  let i = 0;
  const raw = buf.toString("latin1");
  const re = /stream\r?\n/g;
  let m;
  while ((m = re.exec(raw))) {
    const start = m.index + m[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) break;
    const chunk = buf.subarray(start, end);
    let s;
    try {
      s = zlib.inflateSync(chunk).toString("latin1");
    } catch {
      s = chunk.toString("latin1");
    }
    parts.push(s);
    i = end;
  }
  const out = [];
  for (const s of parts) for (const t of s.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) out.push(Buffer.from(t[1], "hex").toString("latin1"));
  return out.join(" ");
}

async function links(browser) {
  const { ctx, page } = await open(browser, 1440, PAGES.inbox);
  const rows = await page.evaluate(() => [...document.querySelectorAll("main ol a")].map((a) => ({ href: a.getAttribute("href"), item: a.querySelector("span:nth-child(3) span")?.textContent ?? "" })));
  let bad = [];
  for (const r of rows) {
    await page.goto(BASE + r.href, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1");
    const ok = await page.evaluate((h) => location.pathname.endsWith(h.split("/").pop()) && document.querySelector("main") && document.title.length > 0, r.href);
    if (!ok) bad.push(r.href);
  }
  out(rows.length >= 11 && bad.length === 0, `G15 every inbox row opens its own case`, `${rows.length} rows, ${bad.length} bad`);
  await page.goto(BASE + PAGES["case-pending"], { waitUntil: "networkidle" });
  await settle(page, PAGES["case-pending"]);
  const before = page.url();
  await page.keyboard.press("j");
  await page.waitForURL((u) => u.toString() !== before, { timeout: 15000 }).catch(() => {});
  out(page.url() !== before, `J moves to the next case`, page.url().split("/").pop());
  await ctx.close();
}

async function video(browser) {
  // Playwright's recordVideo needs its own ffmpeg build; record a CDP screencast instead and stitch it with the system ffmpeg.
  const dir = fs.mkdtempSync(path.join(require("os").tmpdir(), "ccb-video-"));
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + PAGES["case-pending"], { waitUntil: "networkidle" });
  await settle(page, PAGES["case-pending"]);
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    const file = path.join(dir, `f${String(frames.length).padStart(5, "0")}.jpg`);
    fs.writeFileSync(file, Buffer.from(f.data, "base64"));
    frames.push({ file, t: f.metadata.timestamp });
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 85, maxWidth: 1440, maxHeight: 810, everyNthFrame: 1 });
  // A still frame keeps arriving only when the page paints; nudge the mouse so the first seconds are captured.
  await page.mouse.move(700, 300);
  await page.waitForTimeout(700);
  await page.locator("[data-sheet] button[data-phase=pending]").hover();
  await page.waitForTimeout(500);
  await page.locator("[data-sheet] button[data-phase=pending]").click();
  await page.waitForFunction(() => /Evidence filed with PayPal/.test(document.body.innerText), null, { timeout: 20000 });
  await page.waitForTimeout(3200);
  const tEnd = Date.now() / 1000;
  await cdp.send("Page.stopScreencast");
  await ctx.close();
  // Keep the last 14.8 s (the brief asks for 10 to 15 s): the frame on screen at the cut starts the clip.
  const cut = tEnd - 14.8;
  let first = 0;
  while (frames[first + 1] && frames[first + 1].t <= cut) first++;
  if (frames[first].t < cut) frames[first].t = cut;
  frames.splice(0, first);
  // Concat list with each frame held until the next one; the last frame holds until the end.
  const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, ((frames[i + 1] ? frames[i + 1].t : tEnd) - f.t)).toFixed(3)}`).join("\n");
  fs.writeFileSync(path.join(dir, "list.txt"), `${list}\nfile '${frames[frames.length - 1].file}'\n`);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"), "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "20", "-movflags", "+faststart", path.join(OUT, "case-approve.mp4")]);
  console.log(`video: ${path.join(OUT, "case-approve.mp4")} ${durationOf(path.join(OUT, "case-approve.mp4")).toFixed(1)} s from ${frames.length} frames`);
}
function durationOf(f) {
  const s = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", f]).toString().trim();
  return Number(s) || 0;
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  try {
    if (process.argv.includes("--video-only")) return await video(browser);
    await pageChecks(browser);
    await honesty(browser);
    for (const vp of [1440, 1920, 1536, 390]) await approvePath(browser, vp, false);
    await approvePath(browser, 1440, true);
    await failurePath(browser);
    await reader(browser);
    await links(browser);
    if (VIDEO) await video(browser);
  } catch (e) {
    out(false, "check run", e.message.split("\n")[0]);
  } finally {
    await browser.close();
  }
  console.log(`\n${passes} PASS, ${fails} FAIL`);
  process.exit(fails ? 1 : 0);
})();
