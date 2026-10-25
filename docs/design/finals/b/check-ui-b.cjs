// Browser checks for Final B ("Darkroom paper"), the verdict's guardrails that apply to it (G-numbers from
// docs/design/VERDICT-meeting-r1.md §5, adapted where B differs: no Wire plane, the dark surface is the decision sheet,
// PayPal blue only in the PayPal register) plus judge round 1's must-fix list for B. Also takes the shots and the video.
// Safety: every browser context aborts POST /api/actions/** and POST /api/test-dispute unless a test fulfils it itself,
// so no run of this script can approve a real action (PP-R-VPY-10194485 is reserved for the owner's camera) or open a
// real test dispute (capped per visitor and per day; the PM opens those by hand).
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
const HERO = "PP-R-NKT-10227591"; // the staged sample with a decision
const PENDING = "PP-R-VPY-10194485"; // real, awaiting approval: never approved here
const RESOLVED = "PP-R-NJA-10194486"; // real, approved, filed, RESOLVED
const DECIDING = "PP-R-JKB-10194463"; // real, filed, PayPal deciding
const REALS = [PENDING, RESOLVED, DECIDING, "PP-R-RCJ-10194476", "PP-R-GDS-10194475"];
const MOCK = "PP-R-ZZZ-99999999"; // a made-up real-shaped id the mocked approve flow serves itself
const PAGES = {
  landing: "/finals/b",
  inbox: "/finals/b/inbox",
  "case-pending": `/finals/b/case/${PENDING}`,
  "case-deciding": `/finals/b/case/${DECIDING}`,
  "case-resolved": `/finals/b/case/${RESOLVED}`,
  "case-sample": `/finals/b/case/${HERO}`,
};
const VP = {
  1440: { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 },
  1920: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 },
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

// API=https://caseclerk.vercel.app serves /api GETs from production when the page runs on a local dev server
// (same payloads the preview reads; POSTs are never forwarded).
const API = process.env.API;
async function guard(ctx) {
  if (API)
    await ctx.route("**/api/**", async (r) => {
      if (r.request().method() !== "GET") return r.abort();
      const u = new URL(r.request().url());
      const res = await fetch(API + u.pathname + u.search).catch(() => null);
      if (!res) return r.abort();
      r.fulfill({ status: res.status, body: Buffer.from(await res.arrayBuffer()), headers: { "content-type": res.headers.get("content-type") || "application/json" } });
    });
  await ctx.route("**/api/actions/**", (r) => (r.request().method() === "GET" ? (API ? r.fallback() : r.continue()) : r.abort()));
  await ctx.route("**/api/test-dispute", (r) => r.abort());
}
async function open(browser, vp, p, extra = {}, before) {
  const ctx = await browser.newContext({ ...VP[vp], ...extra });
  await guard(ctx);
  if (before) await before(ctx);
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
  if ((p.includes(HERO) || p.includes(PENDING) || p.includes(MOCK)) && !p.includes("state=")) await page.waitForSelector("[data-sheet] button[data-phase=pending]", { timeout: 60000 });
  else if (p.includes("state=resolved")) await page.waitForFunction(() => /RESOLVED/.test(document.body.innerText), null, { timeout: 60000 });
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
      // A control is not a surface: one ink button may be wide on a phone. Surfaces (panels, bands) still count.
      const control = el.matches("a, button") && vis < 0.08 * W * H;
      if (vis > 0.04 * W * H && !el.closest("[data-sheet]") && !control) darkOutside.push(el.className || el.tagName);
    }
    for (const prop of ["color", "backgroundColor", "borderTopColor", "borderLeftColor"]) {
      const c = rgb(cs[prop]);
      if (c.length < 3 || (c.length === 4 && c[3] === 0)) continue;
      const [h, l, s] = hls(c);
      if (h >= 180 && h <= 260 && s > 0.25 && l > 0.08 && l < 0.92 && !el.closest("[data-origin=paypal]")) blue.push(`${el.tagName}.${prop}=${cs[prop]}`);
      if (h >= 30 && h <= 60 && s > 0.45 && l > 0.15 && l < 0.7 && prop !== "backgroundColor") blue.push(`brass ${el.tagName}.${prop}=${cs[prop]}`);
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
  const pick = (process.argv.find((x) => x.startsWith("--pages=")) || "").slice(8).split(",").filter(Boolean);
  const vps = (process.argv.find((x) => x.startsWith("--vps=")) || "").slice(6).split(",").filter(Boolean).map(Number);
  for (const [name, p] of Object.entries(PAGES)) {
    if (pick.length && !pick.includes(name)) continue;
    for (const vp of vps.length ? vps : [1440, 1920, 1536, 2560, 390]) {
      const { ctx, page, status, errs } = await open(browser, vp, p);
      const tag = `${name} @${vp}`;
      out(status === 200 && errs.length === 0, `${tag}: loads without errors`, errs[0]);
      if (name === "landing") await page.waitForTimeout(4000); // the three receipts of the real case land in 3 s
      const c = await page.evaluate(probeColours);
      out(c.darkOutside.length === 0, `${tag}: G5 one dark surface, only the decision sheet`, c.darkOutside.join(", "));
      out(c.blue.length === 0, `${tag}: B PayPal blue only in the PayPal register, no brass (fix 2, 8)`, c.blue.join("; "));
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
      if (vp === 1440 && ["landing", "inbox", "case-pending", "case-resolved"].includes(name)) {
        const f = await page.evaluate(probeFirstScreen);
        // Round 3 took the event id out of the masthead; the inbox's first screen proves PayPal with debug ids instead.
        out((f.event || name === "inbox") && f.debug && f.cents && (name !== "landing" || f.replay), `${tag}: G13 first screen shows a webhook (case pages, landing), a debug id >= 14 px and cents`, JSON.stringify(f));
      }
      if (["case-pending", "case-deciding", "case-resolved"].includes(name)) {
        const reg = await page.evaluate(() =>
          [...document.querySelectorAll("main ol[aria-label^='What happened'] [data-wire-line]")].map((l) => {
            const cs = getComputedStyle(l);
            const id = [...l.querySelectorAll("code")].find((c) => /^(debug id|event) /.test(c.textContent));
            return { w: cs.borderLeftWidth, st: cs.borderLeftStyle, c: cs.borderLeftColor, id: id ? getComputedStyle(id).color : "rgb(0, 89, 184)" };
          }),
        );
        const bad = reg.filter((r) => r.w !== "2px" || r.st !== "solid" || r.c !== "rgb(0, 89, 184)" || r.id !== "rgb(0, 89, 184)");
        out(reg.length > 0 && bad.length === 0, `${tag}: fix 2 real PayPal rows carry the 2 px #0059B8 rule and blue ids`, `${reg.length} rows, ${bad.length} off ${bad[0] ? JSON.stringify(bad[0]) : ""}`);
        const agent = await page.evaluate(() => [...document.querySelectorAll("main ol[aria-label^='What happened'] li")].filter((li) => !li.querySelector("[data-wire-line]")).map((li) => getComputedStyle(li.querySelector("p, blockquote") || li).borderLeftStyle));
        out(agent.every((x) => x === "none"), `${tag}: fix 2 agent rows have no rule`);
      }
      if (name === "case-sample") {
        const reg = await page.evaluate(() => [...document.querySelectorAll("main ol[aria-label^='What happened'] [data-wire-line]")].map((l) => ({ st: getComputedStyle(l).borderLeftStyle, staged: /staged/.test(l.innerText), ok: /\b(200|verified)\b/.test(l.innerText) })));
        out(reg.length > 0 && reg.every((r) => r.st === "dashed" && r.staged && !r.ok), `${tag}: fix 2 sample rows: dashed rule, "staged", no 200 or verified`, `${reg.length} rows`);
      }
      if (["case-pending", "case-sample"].includes(name)) {
        const m = await page.evaluate(() => {
          const l = document.querySelector("header [data-origin=paypal]");
          return { text: l ? l.innerText.replace(/\s+/g, " ") : "", live: l ? l.hasAttribute("data-live") : false };
        });
        out((vp === 390 ? /(PayPal sandbox, last webhook|Staged sample, real webhook) .+ ago$/.test(m.text) : /PayPal sandbox/.test(m.text) && !/PP-R-[A-Z]{3}-\d{8}|CUSTOMER\./.test(m.text) && (name === "case-sample" ? /last real webhook/ : /last webhook on this case/).test(m.text)) && (m.live || !/Live/.test(m.text)) && (name !== "case-sample" || /Staged sample/.test(m.text)), `${tag}: fix 5 masthead names the last real webhook; "Live" only with the live state; agrees with the sample banner`, m.text.slice(0, 140));
      }
      if (name === "case-pending" && vp === 1440) {
        const f = await page.evaluate(() => {
          const sheet = document.querySelector("[data-sheet]").getBoundingClientRect();
          const rows = [...document.querySelectorAll("main ol[class*=_tl_] > li")].slice(0, 2).map((li) => ({ pp: !!li.querySelector("[data-wire-line],[data-origin=paypal]"), bottom: li.getBoundingClientRect().bottom }));
          const note = document.querySelector("[data-sheet] [class*=sdNote]");
          const lh = parseFloat(getComputedStyle(note).lineHeight) || 24;
          return { sheetH: sheet.height, sheetTop: sheet.top, rows, noteLines: Math.round(note.getBoundingClientRect().height / lh), noteText: note.innerText, clipped: note.scrollWidth > note.clientWidth };
        });
        // Round 4 put the agent's call and the evidence link in the sheet; the cap grew with that one line.
        out(f.sheetH <= 340, `${tag}: fix 3 the sheet is <= 340 px tall (r4: the recommendation lines)`, `${Math.round(f.sheetH)} px`);
        out(f.rows.length === 2 && f.rows.every((r) => r.pp && r.bottom <= f.sheetTop), `${tag}: fix 3 the two newest PayPal rows sit above the sheet`, JSON.stringify(f.rows));
        out(f.noteLines <= 1 && !f.clipped && /^What PayPal receives: .+\.$/.test(f.noteText.trim()), `${tag}: fix 3 "What PayPal receives" is one complete line`, f.noteText.trim().slice(0, 100));
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
        out(/\$412(\.00)?/.test(btn), `${tag}: G14 the button names the amount`, btn);
      }
      if (name === "inbox" && [1440, 1920, 2560].includes(vp)) {
        const s = await page.evaluate(() => {
          const st = document.querySelector("#deadlines");
          return { cells: st ? st.children.length : 0, fits: st ? st.scrollWidth <= st.clientWidth : false, marks: [...document.querySelectorAll("[data-due]")].map((m) => m.dataset.due) };
        });
        out(s.cells === 14 && s.fits && s.marks.every((d) => !Number.isNaN(Date.parse(d))), `${tag}: G19 the 14-day strip fits and every mark has a due date`, `${s.cells} cells, ${s.marks.length} marks`);
      }
      if (SHOTS && [1440, 1920, 390].includes(vp)) await page.screenshot({ path: path.join(OUT, `${name}-${vp}.png`) });
      await ctx.close();
    }
  }
}

async function honesty(browser) {
  // Every id a real page shows must exist in production's payload for one of the real cases.
  const known = new Set();
  for (const id of REALS) {
    const api = await (await fetch(`https://caseclerk.vercel.app/api/cases/${id}`)).json();
    for (const a of api.actions) if (a.result && a.result.debugId) known.add(a.result.debugId);
    for (const a of api.audit) for (const k of ["debugId", "eventId"]) if (a.data && a.data[k]) known.add(a.data[k]);
    for (const w of api.wire || []) for (const k of ["debugId", "eventId"]) if (w[k]) known.add(w[k]);
  }
  for (const p of [PAGES.landing, PAGES["case-pending"], PAGES["case-deciding"], PAGES["case-resolved"], PAGES.inbox]) {
    const { ctx, page } = await open(browser, 1440, p);
    if (p === PAGES.landing) await page.waitForTimeout(4000);
    const ids = await page.evaluate(() => {
      const t = document.body.innerText;
      return { debug: [...t.matchAll(/debug id ([0-9a-f]{12,13})\b/g)].map((m) => m[1]), events: [...t.matchAll(/event (WH-[A-Z0-9-]+)/g)].map((m) => m[1]) };
    });
    const unknown = [...ids.debug, ...ids.events].filter((x) => !known.has(x));
    out(ids.debug.length > 0 && unknown.length === 0, `G12 ${p}: every PayPal id shown exists in production's payload`, `${ids.debug.length} debug ids, ${ids.events.length} event ids, unknown: ${unknown.join(", ") || "none"}`);
    const lines = await page.evaluate(() => [...document.querySelectorAll("ol [data-wire-line]")].filter((l) => l.checkVisibility()).map((l) => (l.textContent.match(/debug id ([0-9a-f]{12,13})/) || [])[1]).filter(Boolean));
    out(new Set(lines).size === lines.length, `G12 ${p}: no debug id is attached to two rows`, `${lines.length} rows with ids`);
    const t = await page.evaluate(() => {
      let t = document.body.innerText;
      for (const e of document.querySelectorAll("[aria-label='Evidence pack']")) t = t.replace(e.innerText, "");
      return t;
    });
    out(!/\bUTC\b|Pacific/.test(t), `${p}: fix 10 one time zone, PT (outside the evidence pack, which mirrors the PDF)`);
    out(!/sample cases written for this preview|defended/i.test(t), `${p}: fix 6/10 no "defended", no inbox meta sentence`);
    await ctx.close();
  }
  for (const p of [PAGES["case-sample"], `${PAGES["case-sample"]}?state=approved`, `${PAGES["case-sample"]}?state=resolved`]) {
    const { ctx, page } = await open(browser, 1440, p);
    const t = await page.evaluate(() => document.querySelector("main").innerText + "\n" + [...document.querySelectorAll("[data-sheet]")].map((s) => s.innerText).join("\n") + "\n" + document.querySelector("header").innerText);
    out(/Staged sample/.test(t) && !/debug id [0-9a-f]{12}/.test(t.replace(/last real webhook[^\n]*/g, "")) && !/WH-[A-Z0-9]{17}/.test(t) && !/Nov 4|2026-11-04/.test(t), `G12 ${p}: marked "Staged sample", no PayPal ids, no future dates`);
    await ctx.close();
  }
}

async function approvePath(browser, vp, reduced) {
  const tag = `approve @${vp}${reduced ? " reduced motion" : ""}`;
  const { ctx, page } = await open(browser, vp, PAGES["case-sample"], reduced ? { reducedMotion: "reduce" } : {});
  const rowsBefore = await page.locator("[data-wire-line]").count();
  await page.locator("[data-sheet] button[data-phase=pending]").click();
  await page.waitForTimeout(500);
  const a1 = await page.evaluate(probeAnimations);
  if (reduced) {
    const long = a1.filter((a) => a.dur > 150 && a.iter !== Infinity);
    out(long.length === 0, `${tag}: G4 every animation <= 150 ms`, long.map((a) => `${a.name} ${a.dur}`).join(", "));
  } else {
    out(a1.length >= 1, `${tag}: G1 Approve starts the ink-on-paper fill`, `${a1.length} animations`);
  }
  out(/Undo/.test(await page.locator("[data-sheet]").innerText()), `${tag}: a 4 s undo window with Undo and Send now`);
  await page.getByRole("button", { name: "Send now" }).click();
  await page.waitForSelector("[data-inflight]", { timeout: 2000 }).catch(() => {});
  const inflight = await page.locator("[data-inflight]").count();
  const a2 = await page.evaluate(probeAnimations);
  out(inflight >= 1 && (reduced || a2.length >= 2), `${tag}: G1 sending shows the in-flight rule`, `${inflight} in-flight, ${a2.length} animations`);
  await page.waitForSelector("[data-sheet] [data-wire-line]", { timeout: 15000 });
  const inSheet = await page.locator("[data-sheet] [data-wire-line]").innerText();
  out(/Staged/.test(inSheet) && !/debug id [0-9a-f]/.test(inSheet), `${tag}: fix 4 the answer lands inside the sheet (staged on a sample)`, inSheet.replace(/\s+/g, " ").slice(0, 80));
  await page.waitForFunction(() => /Staged: evidence filed/.test(document.body.innerText), null, { timeout: 6000 });
  await page.waitForTimeout(2600);
  const t = await page.evaluate(() => document.body.innerText);
  const rowsAfter = await page.locator("[data-wire-line]").count();
  out(rowsAfter >= rowsBefore + 2 && /Staged: on a real case, CaseClerk files the evidence and PayPal returns a debug id here\./.test(t), `${tag}: fix 6 the staged after-approve row and PayPal's staged update land`, `${rowsBefore} -> ${rowsAfter} PayPal rows`);
  const sheetH = (await page.locator("[data-sheet]").boundingBox()).height;
  out(sheetH < (vp === 390 ? 140 : 100) && /Staged: evidence filed\s+\d\d:\d\d:\d\d PT/.test(t) && /PayPal is deciding/.test(t), `${tag}: fix 4/6 the sheet collapses to one line with the PT time and "PayPal is deciding"`, `${Math.round(sheetH)} px`);
  out((await page.locator("[data-sheet] button[data-phase]").count()) === 0 && !/until you decide/i.test(t), `${tag}: no way back to Approve after sending`);
  await ctx.close();
}

/**
 * The real loop, without touching a real action: a made-up case id whose GET and approve POST this script serves.
 * Proves the POST goes to /api/actions/<id>/approve, the 200 and PayPal's debug id land inside the sheet for 1.5 s,
 * then the sheet collapses to the filed bar with that debug id, and the timeline row is not doubled when the
 * next poll brings the same id from the server.
 */
async function realLoop(browser) {
  const base = JSON.parse(JSON.stringify(await (await fetch(`https://caseclerk.vercel.app/api/cases/${PENDING}`)).json()));
  const swap = (o) => JSON.parse(JSON.stringify(o).replaceAll(PENDING, MOCK));
  const pending = swap(base);
  pending.actions = pending.actions.map((a) => ({ ...a, id: "mock-action-1" }));
  const DEBUG = "f0000000000a1";
  let approved = false;
  let posted = null;
  let postedAt = 0;
  const before = async (ctx) => {
    await ctx.route(`**/api/cases/${MOCK}`, (r) => {
      if (!approved) return r.fulfill({ json: pending });
      const j = JSON.parse(JSON.stringify(pending));
      j.case.status = "waiting_on_paypal";
      j.actions = j.actions.map((a) => ({ ...a, status: "executed", result: { debugId: DEBUG } }));
      j.wire.push({ id: "mock-w-1", at: new Date(postedAt).toISOString(), kind: "call", origin: "agent", caseId: MOCK, method: "POST", path: `/v1/customer/disputes/${MOCK}/provide-evidence`, status: 200, debugId: DEBUG });
      j.wire.push({ id: "mock-w-2", at: new Date(postedAt + 1500).toISOString(), kind: "call", origin: "agent", caseId: MOCK, method: "PUT", path: `/v1/shipping/trackers/MOCKCAPTURE-9400111899622344435537`, status: 204, debugId: "f0000000000a2" });
      return r.fulfill({ json: j });
    });
    await ctx.route("**/api/actions/mock-action-1/approve", async (r) => {
      posted = r.request().method();
      approved = true;
      postedAt = Date.now();
      // PayPal takes its time (the real filing took ~20 s); one poll lands while the POST is still open.
      await new Promise((z) => setTimeout(z, 7000));
      r.fulfill({ json: { action: { id: "mock-action-1", status: "executed" }, message: "ok", status: 200, debugId: DEBUG, at: new Date().toISOString() } });
    });
  };
  const { ctx, page } = await open(browser, 1440, `/finals/b/case/${MOCK}`, {}, before);
  await page.locator("[data-sheet] button[data-phase=pending]").click();
  const h1Before = await page.locator("h1").innerText();
  const count = () => page.evaluate(() => Number(document.querySelector("header [data-count]")?.dataset.count));
  const countBefore = await count();
  await page.getByRole("button", { name: "Send now" }).click();
  await page.waitForTimeout(6200);
  const mid = await page.evaluate(() => ({
    sheet: document.querySelector("[data-sheet]").innerText,
    tl: document.querySelector("main ol[aria-label^='What happened']").innerText,
    h1: document.querySelector("h1").innerText,
  }));
  out(/Sending to PayPal/.test(mid.sheet) && !/provide-evidence\s+200/.test(mid.tl) && /provide-evidence\s+sending/.test(mid.tl) && mid.h1 === h1Before, `real loop: r2 fix 8 while the sheet says "Sending to PayPal" the timeline shows only the in-flight row and the headline holds, even after a poll that carries the filing`, mid.tl.split("\n").slice(0, 4).join(" | "));
  const countMid = await count();
  out(countMid === countBefore && /^Waiting for you/.test(mid.sheet), `r4 fix 3 while "Sending to PayPal", the nav still counts this case (${countBefore}) and the sheet still says "Waiting for you"`, `${countBefore} -> ${countMid}`);
  await page.waitForSelector("[data-sheet] [data-wire-line]", { timeout: 10000 });
  const landed = await page.evaluate(() => ({ sheet: document.querySelector("[data-sheet]").innerText, n: Number(document.querySelector("header [data-count]")?.dataset.count) }));
  out(/^Filed with PayPal/.test(landed.sheet) && /Evidence filed with PayPal\./.test(landed.sheet) && !/Waiting for you|File this evidence with PayPal\?/.test(landed.sheet) && landed.n === countBefore - 1, `r4 fix 3 when PayPal's 200 lands: "Filed with PayPal" label and title in the same render, and the nav count drops then (${countBefore} -> ${landed.n})`, landed.sheet.replace(/\s+/g, " ").slice(0, 90));
  const t0 = Date.now();
  const same = await page.evaluate(() => document.querySelector("main ol[aria-label^='What happened'] li").innerText);
  out(/provide-evidence\s+200/.test(same), `real loop: r2 fix 8 the timeline's filing row turns 200 in the same frame the sheet shows PayPal's answer`, same.replace(/\s+/g, " ").slice(0, 90));
  const line = await page.locator("[data-sheet] [data-wire-line]").innerText();
  out(posted === "POST" && /PayPal answered/.test(line) && /\b200\b/.test(line) && line.includes(`debug id ${DEBUG}`), `real loop (mocked API): fix 4 the 200 and the debug id land inside the dark sheet`, line.replace(/\s+/g, " "));
  const blue = await page.locator("[data-sheet] [data-wire-line]").evaluate((l) => getComputedStyle(l).borderLeftColor + " " + getComputedStyle(l).borderLeftStyle + " " + l.dataset.origin);
  out(/solid paypal/.test(blue) && !/dashed/.test(blue), `real loop: the in-sheet line is in the PayPal register (solid blue rule)`, blue);
  await page.waitForFunction(() => !document.querySelector("[data-sheet] [data-wire-line]"), null, { timeout: 5000 });
  const held = Date.now() - t0;
  out(held >= 1200 && held <= 2600, `real loop: the line holds about 1.5 s, then the sheet collapses`, `${held} ms`);
  await page.waitForTimeout(6500); // one poll brings the same debug id from the "server"
  const bar = await page.locator("[data-sheet]").innerText();
  out(/Evidence filed with PayPal\s+\d\d:\d\d:\d\d PT/.test(bar) && bar.includes(`debug id ${DEBUG}`) && /PayPal is deciding/.test(bar) && !/defended/.test(bar), `real loop: the bar reads "Evidence filed with PayPal <time> PT  debug id <id>" and "PayPal is deciding"`, bar.replace(/\s+/g, " "));
  const n = await page.evaluate((d) => [...document.querySelectorAll("ol [data-wire-line]")].filter((l) => l.textContent.includes(d)).length, DEBUG);
  out(n === 1, `real loop: the server's row replaces the local one (no doubled debug id)`, `${n} rows`);
  const top = await page.evaluate(() => document.querySelector("main ol[aria-label^='What happened'] li").innerText);
  out(/provide-evidence\s+200/.test(top), `real loop: r2 fix 4 the filing's 200 is the pinned top row, above the later tracker calls`, top.replace(/\s+/g, " ").slice(0, 80));
  for (let i = 0; i < 12 && (await page.locator("main ol[aria-label^='What happened'] button[aria-expanded=false]").count()); i++) await page.locator("main ol[aria-label^='What happened'] button[aria-expanded=false]").first().click();
  await page.waitForTimeout(500);
  const put = await page.evaluate(() => [...document.querySelectorAll("main ol [data-wire-line]")].map((l) => l.innerText).find((t) => /PUT \/v1\/shipping\/trackers/.test(t)) || "");
  if (!put) console.log("debug rows:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("main ol[aria-label^='What happened'] > li")].map((l) => l.innerText.replace(/\s+/g, " ").slice(0, 120)))));
  out(/update tracker\s+204/.test(put) && /updated the tracking/.test(put) && !/get tracker|Read the tracking/.test(put), `real loop: r2 fix 2 a tracker PUT reads "update tracker 204", not a read`, put.replace(/\s+/g, " ").slice(0, 100));
  await ctx.close();
}

/** Judge round 2: the landing, the test dispute (mocked), timeline order, phones, the money line, one column. */
async function round2(browser) {
  {
    const { ctx, page } = await open(browser, 1440, PAGES.landing);
    await page.waitForTimeout(4000);
    const l = await page.evaluate(() => {
      const main = document.querySelector("main");
      const btn = main.querySelector("a[class*=ctaBtn]");
      const rows = [...document.querySelectorAll("[aria-label='Replay of a real case'] > ol > li")].map((li) => li.innerText.replace(/\s+/g, " "));
      return { h1: document.querySelector("h1").innerText, btn: btn ? btn.innerText : "", href: btn ? btn.getAttribute("href") : "", test: [...main.querySelectorAll("button")].map((b) => b.innerText + "|" + b.className), rows, drawer: (document.querySelector("details summary") || {}).innerText || "" };
    });
    out(/filed the evidence, and PayPal closed the case \d+ minutes after the filing\.$/.test(l.h1) && !/answered 200/.test(l.h1), `r2 fix 3 landing h1 ends on the close, not on "200"`, l.h1);
    out(l.btn === "Review the $412.00 case waiting for you" && l.href.endsWith(PENDING) && l.test.some((t) => /^Open a test dispute\|.*ghostBtn/.test(t)), `r2 fix 3 primary: review the $412.00 case; secondary: open a test dispute`, `${l.btn} -> ${l.href}`);
    out(l.rows.length === 3 && /CUSTOMER\.DISPUTE\.CREATED/.test(l.rows[0]) && /provide-evidence 200 .*debug id f8469524f503f/.test(l.rows[1]) && /CUSTOMER\.DISPUTE\.RESOLVED .*event WH-01G68820AD177843M-8SL79965VW8605524/.test(l.rows[2]), `r2 fix 3 the replay is the 3-row receipt: CREATED, provide-evidence 200, RESOLVED`, l.rows.map((r) => r.slice(0, 50)).join(" | "));
    out(/^All PayPal traffic on this case \(\d+ calls and webhooks\)/.test(l.drawer), `r2 fix 3 routine traffic folds into the "All PayPal traffic" drawer`, l.drawer);
    await ctx.close();
  }
  for (const mode of ["202", "429"]) {
    let lists = 0;
    let body = null;
    const before = async (ctx) => {
      await ctx.route("**/api/test-dispute", async (r) => {
        body = r.request().postData();
        if (mode === "429") return r.fulfill({ status: 429, json: { error: { code: "rate_limited", message: "You've opened 3 test disputes today. Try again tomorrow." } } });
        r.fulfill({ status: 202, json: { scenario: "not_as_described", captureId: "MOCKCAPTURE0001", orderId: "MOCKORDER", disputeId: null } });
      });
      await ctx.route("**/api/cases?test=true*", async (r) => {
        const res = await fetch("https://caseclerk.vercel.app/api/cases?test=true&limit=50");
        const j = await res.json();
        if (body && ++lists > 1) j.cases.unshift({ ...j.cases[0], id: "PP-R-MOK-00000001", snapshot: { ...j.cases[0].snapshot, id: "PP-R-MOK-00000001", sellerTransactionId: "MOCKCAPTURE0001" } });
        r.fulfill({ json: j });
      });
    };
    const { ctx, page } = await open(browser, 1440, PAGES.landing, {}, before);
    await page.getByRole("button", { name: "Open a test dispute" }).click();
    if (mode === "429") {
      await page.waitForSelector("[class*=testErr]", { timeout: 10000 });
      const t = await page.locator("[class*=testErr]").innerText();
      out(/3 test disputes today/.test(t), `r2 test dispute (mocked 429): PayPal-side cap shows its message, nothing claimed`, t);
    } else {
      await page.waitForFunction(() => /PayPal is opening the chargeback\. Its webhook usually arrives in 3–5 minutes\./.test(document.body.innerText), null, { timeout: 10000 });
      out(JSON.parse(body).scenario === "not_as_described", `r2 test dispute (mocked 202): POST /api/test-dispute {scenario}, then the honest wait line`, body);
      await page.waitForSelector("a[href='/finals/b/case/PP-R-MOK-00000001']", { timeout: 30000 }).catch(() => {});
      out((await page.locator("a[href='/finals/b/case/PP-R-MOK-00000001']").count()) === 1, `r2 test dispute (mocked): polls the case list and links the new case by its capture id`);
    }
    await ctx.close();
  }
  for (const [p, re, label] of [
    [PAGES["case-resolved"], /CUSTOMER\.DISPUTE\.RESOLVED/, "RESOLVED"],
    [PAGES["case-pending"], /CUSTOMER\.DISPUTE\.(UPDATED|CREATED)/, "the latest webhook"],
    [PAGES["case-deciding"], /provide-evidence\s+200|CUSTOMER\.DISPUTE/, "the filing or the latest webhook"],
  ]) {
    const { ctx, page } = await open(browser, 1440, p);
    const o = await page.evaluate(() => {
      const lis = [...document.querySelectorAll("main ol[class*=_tl_] > li")];
      const routine = (li) => { const t = li.innerText; return /\b(GET|verify-webhook-signature)\b/.test(t) && !!li.querySelector("[data-wire-line]"); };
      let runs = 0;
      for (let i = 1; i < lis.length; i++) if (routine(lis[i]) && routine(lis[i - 1])) runs++;
      return { top: lis[0] ? lis[0].innerText : "", runs };
    });
    out(re.test(o.top) && o.runs === 0, `r2 fix 4 ${p.split("/").pop()}: ${label} is the pinned top row; runs of routine reads are folded`, `${o.top.replace(/\s+/g, " ").slice(0, 60)}; ${o.runs} unfolded runs`);
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, 1440, PAGES["case-resolved"]);
    const t = await page.evaluate(() => ({ h1: document.querySelector("h1").innerText, meta: document.querySelector("[class*=figMeta]").innerText, fig: ((p) => [...p.childNodes].map((e) => { const n = e.querySelector?.("number-flow-react"); const d = n && (n.data || n._data); return d ? [...d.pre, ...d.integer, ...d.fraction, ...d.post].map((x) => x.value).join("") : e.textContent; }).join(" "))(document.querySelector("p[class*=_figure_]")) }));
    out(/PayPal closed the case\.$/.test(t.h1) && /Youkept\$378\.43/.test(t.fig.replace(/\s+/g, "")), `r2 fix 6 (r4) the resolved h1 is short; the figure carries the seller's money from PayPal's fund movements`, t.h1);
    out(/The \$389\.00 sale less PayPal's \$10\.57 fee\. PayPal held your \$378\.43 while it decided, then released all of it; it shows no chargeback fee and no debit\./.test(t.meta) && /^Sandbox only: we asked PayPal's sandbox to rule\. On a live account PayPal decides on its own\.$/m.test(t.meta) && !/RESOLVED_WITH_PAYOUT/.test(t.meta + t.h1), `r2 fix 6 the money line and the sandbox-ruling disclosure`, t.meta.replace(/\s+/g, " ").slice(-160));
    await ctx.close();
  }
  for (const vp of [390]) {
    for (const p of Object.values(PAGES)) {
      const { ctx, page } = await open(browser, vp, p);
      const o = await page.evaluate((W) => {
        const over = [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > W + 0.5 && getComputedStyle(e).position !== "fixed" && !e.closest("nav"); }).map((e) => `${e.tagName}.${String(e.className).slice(0, 24)} "${(e.innerText || "").slice(0, 24)}"`);
        const live = document.querySelector("header [data-origin=paypal]");
        const btn = document.querySelector("[data-sheet] button[data-phase]");
        const b = btn && btn.getBoundingClientRect();
        // A phone widens its layout viewport to fit overflowing content, so measure against the device width.
        return { over: over.slice(0, 3), wide: document.documentElement.scrollWidth, mast: live ? live.innerText.replace(/\s+/g, " ").trim() : "", btn: b ? [Math.round(b.left), Math.round(W - b.right)] : null };
      }, vp);
      out(o.over.length === 0 && o.wide <= vp, `r2 fix 5 ${p.split("/").pop()} @390: nothing runs off the right edge`, `${o.wide} px wide; ${o.over.join("; ")}`);
      out(/^((Live on )?PayPal sandbox, last (real webhook|webhook on this case)|Staged sample, real webhook) (just now|\d+ (min|h \d+ min|days) ago)$/.test(o.mast), `r2 fix 5 @390 the masthead is one short line, no middot`, o.mast);
      if (o.btn) out(o.btn[0] >= 16 && o.btn[1] >= 16, `r2 fix 5 @390 the sheet's button keeps 16 px each side`, o.btn.join(" / "));
      await ctx.close();
    }
  }
  for (const vp of [1440, 1920]) {
    const { ctx, page } = await open(browser, vp, PAGES["case-pending"]);
    const o = await page.evaluate(() => {
      const m = document.querySelector("[class*=caseGrid] > aside").getBoundingClientRect();
      const c = document.querySelector("[class*=caseGrid] > [class*=col]").getBoundingClientRect();
      const rail = document.querySelector("[aria-label='Your disputes']");
      return { l: m.left, r: innerWidth - c.right, rail: !!(rail && rail.checkVisibility()), w: c.right - m.left };
    });
    out(!o.rail && Math.abs(o.l - o.r) < 4, `r2 fix 7 @${vp}: no case-list rail; the reading column is centred`, `left ${Math.round(o.l)} right ${Math.round(o.r)} width ${Math.round(o.w)}`);
    await ctx.close();
  }
}

/** Round 3: scoped masthead, fund-movement fallback, inbox leaks, insider copy, phone CTA and sheet clearance. */
const IMW = "PP-R-IMW-10194496"; // real, resolved (B3), fund movements verified by W1
async function round3(browser) {
  const NO_DEBIT = "PayPal closed the chargeback. Seller money outcome not yet verified."; // r4: the judge's fallback
  const RULING = "Sandbox only: we asked PayPal's sandbox to rule. On a live account PayPal decides on its own.";
  for (const [p, scoped] of [[PAGES.landing, false], [PAGES.inbox, false], [PAGES["case-pending"], true], [`/finals/b/case/${IMW}`, true]]) {
    const { ctx, page } = await open(browser, 1440, p);
    const m = await page.evaluate(() => document.querySelector("header [data-origin=paypal]").innerText.replace(/\s+/g, " ").trim());
    out(!/PP-R-|CUSTOMER\.|WH-/.test(m) && (scoped ? /last webhook on this case/ : /last real webhook/).test(m), `r3 fix 2 ${p.split("/").pop() || "b"}: masthead ${scoped ? "scoped to this case" : "global"}, no ids or enums`, m);
    await ctx.close();
  }
  const read = () => ({ h1: document.querySelector("h1").innerText, meta: document.querySelector("[class*=figMeta]").innerText, fig: ((p) => [...p.childNodes].map((e) => { const n = e.querySelector?.("number-flow-react"); const d = n && (n.data || n._data); return d ? [...d.pre, ...d.integer, ...d.fraction, ...d.post].map((x) => x.value).join("") : e.textContent; }).join(" "))(document.querySelector("p[class*=_figure_]")), prose: [...document.querySelectorAll("main ol[aria-label^='What happened'] li")].filter((li) => !li.querySelector("[data-wire-line]")).map((li) => li.innerText).join("\n") });
  {
    const { ctx, page } = await open(browser, 1440, `/finals/b/case/${IMW}`);
    await page.waitForFunction(() => /You keep|PayPal closed/.test(document.querySelector("h1")?.innerText || ""), null, { timeout: 20000 }).catch(() => {});
    const t = await page.evaluate(read);
    out(t.h1.endsWith("PayPal closed the case.") && /Youkept\$382\.33/.test(t.fig.replace(/\s+/g, "")) && /The \$393\.00 sale less PayPal's \$10\.67 fee/.test(t.meta), `r3 fix 3 IMW: verified fund movements, "You kept $382.33"`, t.h1);
    out(t.meta.includes(RULING) && !/RESOLVED_WITH_PAYOUT/.test(t.h1 + t.meta + t.prose), `r3 fix 3 IMW: sandbox disclosure; PayPal's enum only in the Wire`, t.meta.replace(/\s+/g, " ").slice(-120));
    out(!/\d\.\d{2} USD/.test(t.prose) && !/Nothing left to do/.test(t.prose), `r3 fix 5 IMW agent rows: "$393.00", "Case closed; nothing left to do."`, t.prose.split("\n").filter((l) => /\$|closed/i.test(l)).slice(0, 2).join(" | "));
    await ctx.close();
  }
  {
    // A resolved case missing from the verified map: IMW's payload served under a made-up id.
    const Q = "PP-R-QQQ-00000001";
    const { ctx, page } = await open(browser, 1440, `/finals/b/case/${Q}`, {}, (c) =>
      c.route(`**/api/cases/${Q}`, async (r) => {
        const j = await (await fetch(`${BASE}/api/cases/${IMW}`)).json();
        r.fulfill({ json: JSON.parse(JSON.stringify(j).replaceAll(IMW, Q)) });
      }),
    );
    await page.waitForFunction(() => /PayPal closed/.test(document.querySelector("h1")?.innerText || ""), null, { timeout: 20000 }).catch(() => {});
    const t = await page.evaluate(read);
    out(t.h1.endsWith(NO_DEBIT) && !/You kept/.test(t.fig) && t.meta.includes(RULING) && !/RESOLVED_WITH_PAYOUT/.test(t.h1 + t.meta), `r3 fix 3 a resolved case without verified fund movements: the judge's fallback line, no kept figure`, t.h1);
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, 1440, PAGES.inbox);
    const t = await page.evaluate(() => ({ proofs: [...document.querySelectorAll("[class*=rowProof]")].map((e) => e.innerText), lasts: [...document.querySelectorAll("[class*=rowLast]")].map((e) => e.innerText), who: [...document.querySelectorAll("[class*=rowReal] [class*=rowWho]")].filter((e) => e.checkVisibility()).map((e) => e.innerText) }));
    out(t.proofs.length > 0 && !t.proofs.some((x) => /adjudicate|require-evidence/.test(x)), `r3 fix 4 inbox: "Last PayPal call" is CaseClerk's, never the operator's adjudicate`, t.proofs.slice(0, 3).join(" | "));
    out(!t.lasts.some((x) => /\b(once|twice|times)\b/.test(x)), `r3 fix 4 inbox: no "filed twice"`, t.lasts.filter((x) => /Filed/.test(x)).slice(0, 2).join(" | "));
    out(t.who.length > 0 && t.who.every((x) => /^[A-Z][a-z ]+ (chargeback|inquiry)$/.test(x)), `r3 fix 4 inbox: real rows name the dispute reason, not "A buyer in the US"`, [...new Set(t.who)].join(" | "));
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, 1440, PAGES.landing);
    const t = await page.evaluate(() => document.querySelector("main").innerText);
    out(!/\bonce\b/.test(t) && t.includes(RULING) && /Shared limit: three a day\./.test(t) && !/per visitor/.test(t), `r3 fix 5 landing: no "once", the sandbox disclosure, "Shared limit: three a day."`);
    await ctx.close();
  }
  for (const p of [PAGES["case-pending"], PAGES["case-deciding"], PAGES["case-resolved"]]) {
    const { ctx, page } = await open(browser, 1440, p);
    // The evidence pack is the text PayPal received, verbatim; it is not CaseClerk's copy and stays as filed.
    const t = await page.evaluate(() => { const m = document.querySelector("main").cloneNode(true); m.querySelectorAll("[aria-label='Evidence pack']").forEach((e) => e.remove()); return m.innerText; });
    const bad = t.match(/.{0,40}(Every id here came from PayPal|\bonce\b|(^|[^$\d,.])\d[\d,]*\.\d{2} USD).{0,20}/m);
    out(!bad, `r3 fix 5 ${p.split("/").pop()}: no "Every id here…", no "once", no bare "USD" amounts`, bad ? bad[0] : "");
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, 390, PAGES.landing);
    const o = await page.evaluate(() => {
      const a = document.querySelector("a[class*=ctaBtn]");
      const r = document.createRange();
      r.selectNodeContents(a);
      const lines = [...r.getClientRects()].reduce((m, x) => ((m[Math.round(x.top)] = (m[Math.round(x.top)] || 0) + x.width), m), {});
      return Object.values(lines).map(Math.round);
    });
    out(o.length <= 2 && Math.min(...o) >= 0.5 * Math.max(...o), `r3 fix 5 landing @390: the primary CTA has no orphan word`, o.join(" / "));
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, 390, PAGES["case-pending"]);
    const o = await page.evaluate(() => {
      const li = document.querySelector("main ol[class*=_tl_] > li");
      return { row: Math.round(li.getBoundingClientRect().bottom), sheet: Math.round(document.querySelector("[data-sheet]").getBoundingClientRect().top) };
    });
    out(o.row <= o.sheet, `r3 fix 5 case-pending @390: the top PayPal row, event id included, clears the sheet`, `row ends ${o.row}, sheet starts ${o.sheet}`);
    await ctx.close();
  }
}

// Judge round 4 and the fresh-reader test: the sheet's call and evidence link, counts that match the list, the
// landing's rule, baseline and second case, the filed-again row.
async function round4(browser) {
  for (const vp of [1440, 1920, 390]) {
    const { ctx, page } = await open(browser, vp, PAGES["case-pending"]);
    const t = await page.locator("[data-sheet]").innerText();
    out(/The agent recommends filing: 35% chance PayPal decides for you\. Tracking proves delivery, not condition\./.test(t) && /Review the evidence/.test(t), `r4 fix 1 case-pending @${vp}: the agent's call, its limit and "Review the evidence" are in the sheet`, t.split("\n").find((l) => /recommends/.test(l)));
    const btns = await page.evaluate(() => [...document.querySelectorAll("[data-sheet] button")].every((b) => { const r = b.getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0; }));
    out(btns, `r4 fix 1 case-pending @${vp}: both answers and the link are on screen without scrolling`);
    if (vp === 1440) {
      out(/Filing has no fee; accepting gives up the \$412\.00\./.test(t), `reader: why filing at 35% still pays, in the sheet`);
      await page.getByRole("button", { name: "Review the evidence" }).click();
      await page.waitForSelector("[role=dialog][aria-label='Evidence pack reader']", { timeout: 5000 }).catch(() => {});
      out(await page.locator("[role=dialog][aria-label='Evidence pack reader']").isVisible(), `r4 fix 1 "Review the evidence" opens the evidence reader`);
    }
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, 1440, PAGES.inbox);
    const t = await page.evaluate(() => {
      const h1 = document.querySelector("h1").innerText;
      const nav = Number(document.querySelector("header [data-count]").dataset.count);
      const top = [...document.querySelector("main > ol[class*=rows]").children].filter((li) => li.querySelector("a"));
      const needs = top.filter((li) => /Needs your answer/.test(li.innerText)).length;
      const strip = [...document.querySelectorAll("#deadlines a")].map((a) => a.getAttribute("href"));
      const listed = [...document.querySelectorAll("main ol[class*=rows] a")].filter((a) => a.checkVisibility()).map((a) => a.getAttribute("href"));
      return { h1, nav, open: top.length, needs, strip, stripListed: strip.every((h) => listed.includes(h)), text: document.querySelector("main").innerText };
    });
    const words = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    const m = t.h1.toLowerCase().match(/^(\w+) open disputes?,.* (\w+) waiting/);
    out(m && words.indexOf(m[1]) === t.open && words.indexOf(m[2]) === t.nav && t.needs === t.nav, `reader 3 inbox: h1 counts = rows listed (${t.open} open), nav badge = "${m && m[2]} waiting" = rows that need you (${t.needs})`, t.h1);
    out(t.strip.length > 0 && t.stripListed, `reader 3 inbox: every deadline on the strip is a case listed above it`, t.strip.join(" "));
    out(/Test disputes we opened on PayPal's sandbox for this demo/.test(t.text) && /closed test disputes?, .*on the same .* listing\. Each is a separate sandbox case\./.test(t.text) && /Staged samples/.test(t.text) && /none is counted above/.test(t.text), `reader 2 inbox: the test disputes are captioned, the closed ones fold into one row, the samples sit apart and uncounted`);
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, 1440, `/finals/b/case/${PENDING}`);
    const t = await page.evaluate(() => ({ where: document.querySelector("[class*=where] p").innerText, nav: Number(document.querySelector("header [data-count]").dataset.count) }));
    out(new RegExp(`, ${t.nav} need you$`).test(t.where), `reader 3 case page: "N need you" = the nav badge (${t.nav})`, t.where);
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, 1440, PAGES.landing);
    const t = await page.evaluate(() => ({ text: document.querySelector("[class*=landL]").innerText, policy: !!document.querySelector("[class*=landL] a[href='/finals/b/inbox#policy']"), cta: (() => { const r = document.querySelector("a[class*=ctaBtn]").getBoundingClientRect(); return r.bottom <= innerHeight; })() }));
    out(/Small cases it answers on its own, under your rules; over \$250 to file, or \$50 to refund or offer, it asks you first\./.test(t.text) && t.policy && !/before money moves/.test(t.text), `reader 1 landing: the real rule, linked to Policy`);
    out(/Without an answer by the deadline, PayPal rules for the buyer: the seller would have lost the \$389\.00 and the fee\./.test(t.text), `reader 5 landing: one honest baseline under the result`);
    out(/A separate test dispute on the same camera listing is waiting for your answer:/.test(t.text) && t.cta, `reader 2 landing: the CTA's case reads as a different case, and the CTA is in the first screen`);
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, 1440, PAGES["case-deciding"]);
    const t = await page.evaluate(() => document.querySelector("main ol[aria-label^='What happened']").innerText);
    out(/PayPal asked for more evidence, so CaseClerk filed again; PayPal answered 200/.test(t) && /CaseClerk filed the evidence on its own, under your \$250\.00 evidence line; PayPal answered 200/.test(t), `reader 4 + 1 JKB: the second filing says PayPal asked again; the first says it was under your line`);
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, 1440, `/finals/b/case/PP-R-IHX-10194506`);
    await page.waitForFunction(() => /PayPal closed the case\.$/.test(document.querySelector("h1")?.innerText || ""), null, { timeout: 20000 }).catch(() => {});
    const t = await page.evaluate(() => ({ h1: document.querySelector("h1").innerText, fig: ((p) => [...p.childNodes].map((e) => { const n = e.querySelector?.("number-flow-react"); const d = n && (n.data || n._data); return d ? [...d.pre, ...d.integer, ...d.fraction, ...d.post].map((x) => x.value).join("") : e.textContent; }).join(" "))(document.querySelector("p[class*=_figure_]")), meta: document.querySelector("[class*=figMeta]").innerText }));
    out(t.h1.endsWith("PayPal closed the case.") && /Youkept\$380\.38/.test(t.fig.replace(/\s+/g, "")) && /The \$391\.00 sale less PayPal's \$10\.62 fee/.test(t.meta) && /the sum of its model calls in this case's log/.test(t.meta), `r4 fix 2/4 IHX resolved: short h1, "You kept $380.38", the sale less the fee, the cost sourced`, t.h1);
    await ctx.close();
  }
}

// Judge round 5: PayPal's pinned request gets its own heading, so "newest first" holds; the sandbox control row says
// "we", not "you"; the case pager walks open cases only, as the inbox folds the closed ones.
async function round5(browser) {
  for (const vp of [1440, 1920, 390]) {
    const { ctx, page } = await open(browser, vp, PAGES["case-pending"]);
    const t = await page.evaluate(() => {
      const h2s = [...document.querySelectorAll("main h2")].map((h) => h.innerText);
      const pin = document.querySelector("main ol[aria-label=\"PayPal's request\"]");
      const times = [...document.querySelectorAll("main ol[aria-label^='What happened'] > li > time")].map((x) => Date.parse(x.getAttribute("datetime")));
      return { h2s, pin: pin ? pin.innerText : "", n: pin ? pin.children.length : 0, ordered: times.every((x, i) => !i || x <= times[i - 1]), newest: times[0], pinAt: pin ? Date.parse(pin.querySelector("time").getAttribute("datetime")) : 0 };
    });
    const a = t.h2s.indexOf("PayPal's request");
    const b = t.h2s.indexOf("What happened, newest first");
    out(a >= 0 && a < b && t.n === 1 && /CUSTOMER\.DISPUTE\.UPDATED/.test(t.pin) && t.ordered && t.pinAt < t.newest, `r5 fix 3 case-pending @${vp}: PayPal's request has its own heading above "What happened, newest first", and that list is newest first`, `${t.h2s.join(" | ")}; ordered ${t.ordered}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, 1440, PAGES["case-deciding"]);
    const t = await page.evaluate(() => document.querySelector("main").innerText);
    out(/Sandbox test control: we asked PayPal's sandbox to rule \(a live account can't do this\)/.test(t) && !/you asked PayPal|Sandbox control:/.test(t), `r5 fix 4 JKB: the adjudicate row reads "we asked PayPal's sandbox", not "you"`);
    await ctx.close();
  }
  for (const p of [PAGES["case-resolved"], `/finals/b/case/PP-R-IHX-10194506`, PAGES["case-pending"]]) {
    const { ctx, page } = await open(browser, 1440, p);
    const t = await page.evaluate(async () => {
      const links = [...document.querySelectorAll("aside a[href^='/finals/b/case/']")].map((a) => ({ id: a.getAttribute("href").split("/").pop(), text: a.innerText.replace(/\s+/g, " ") }));
      const j = await (await fetch("/api/cases?test=true&limit=50")).json();
      const status = Object.fromEntries(j.cases.map((c) => [c.id, c.status]));
      return { links, closed: links.filter((l) => status[l.id] === "resolved").map((l) => l.text) };
    });
    out(t.links.length > 0 && t.closed.length === 0, `r5 fix 5 ${p.split("/").pop()}: the Previous / Next pager links open cases only`, t.links.map((l) => l.text).join(" | "));
    await ctx.close();
  }
}

async function failurePath(browser) {
  const { ctx, page } = await open(browser, 1440, `${PAGES["case-sample"]}?fail=1`);
  await page.locator("[data-sheet] button[data-phase=pending]").click();
  await page.getByRole("button", { name: "Send now" }).click();
  await page.waitForFunction(() => /Nothing was sent/.test(document.body.innerText), null, { timeout: 10000 });
  const t = await page.locator("[data-sheet]").innerText();
  out(/Nothing was sent/.test(t) && /UNPROCESSABLE_ENTITY/.test(t), `approve failure: "Nothing was sent." with PayPal's error name`);
  await ctx.close();
}

async function reader(browser) {
  for (const p of [PAGES["case-pending"], PAGES["case-resolved"]]) {
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
  out(rows.slice(0, 2).every((r) => /PP-R-[A-Z]{3}-1\d{7}/.test(r.href)) && rows[0].href.endsWith(PENDING), `fix 7 the inbox opens on the real cases, the pending $412 first`, rows.slice(0, 3).map((r) => r.href.split("/").pop()).join(", "));
  await page.goto(BASE + "/finals/b/case", { waitUntil: "networkidle" });
  out(page.url().endsWith(PENDING), `fix 7 /finals/b/case opens the real pending case`, page.url().split("/").pop());
  await page.goto(BASE + PAGES["case-pending"], { waitUntil: "networkidle" });
  await settle(page, PAGES["case-pending"]);
  const before = page.url();
  await page.keyboard.press("j");
  await page.waitForURL((u) => u.toString() !== before, { timeout: 15000 }).catch(() => {});
  out(page.url() !== before, `J moves to the next case`, page.url().split("/").pop());
  await ctx.close();
}

async function video(browser) {
  // The real story, no clicks on a real Approve: the $412 case waiting for the seller (the sheet, the blue PayPal
  // rows), then its sibling the seller approved, filed with PayPal (200, real debug id) and RESOLVED by PayPal.
  // Playwright's recordVideo needs its own ffmpeg build; record a CDP screencast instead and stitch it with ffmpeg.
  const dir = fs.mkdtempSync(path.join(require("os").tmpdir(), "ccb-video-"));
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 });
  await guard(ctx);
  const page = await ctx.newPage();
  await page.goto(BASE + PAGES["case-pending"], { waitUntil: "networkidle" });
  await settle(page, PAGES["case-pending"]);
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  const t0 = Date.now() / 1000;
  cdp.on("Page.screencastFrame", async (f) => {
    const file = path.join(dir, `f${String(frames.length).padStart(5, "0")}.jpg`);
    fs.writeFileSync(file, Buffer.from(f.data, "base64"));
    frames.push({ file, t: f.metadata.timestamp });
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: 2880, maxHeight: 1620, everyNthFrame: 1 });
  await page.mouse.move(700, 300);
  await page.waitForTimeout(1800);
  await page.locator("[data-sheet] button[data-phase=pending]").hover();
  await page.waitForTimeout(2200);
  await page.mouse.move(700, 300);
  await page.goto(BASE + PAGES["case-resolved"], { waitUntil: "networkidle" });
  await page.mouse.move(720, 320);
  await page.waitForTimeout(3000);
  await page.mouse.wheel(0, 520);
  await page.waitForTimeout(3600);
  const tEnd = Date.now() / 1000;
  await cdp.send("Page.stopScreencast");
  await ctx.close();
  const cut = Math.max(t0, tEnd - 14.8);
  let first = 0;
  while (frames[first + 1] && frames[first + 1].t <= cut) first++;
  if (frames[first].t < cut) frames[first].t = cut;
  frames.splice(0, first);
  const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, ((frames[i + 1] ? frames[i + 1].t : tEnd) - f.t)).toFixed(3)}`).join("\n");
  fs.writeFileSync(path.join(dir, "list.txt"), `${list}\nfile '${frames[frames.length - 1].file}'\n`);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"), "-t", "14.8", "-vf", "scale=2880:1620,fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "20", "-movflags", "+faststart", path.join(OUT, "case-real.mp4")]);
  console.log(`video: ${path.join(OUT, "case-real.mp4")} ${durationOf(path.join(OUT, "case-real.mp4")).toFixed(1)} s from ${frames.length} frames`);
}
function durationOf(f) {
  const s = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", f]).toString().trim();
  return Number(s) || 0;
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  try {
    if (process.argv.includes("--video-only")) return await video(browser);
    const only = (process.argv.find((x) => x.startsWith("--only=")) || "").slice(7);
    if (only) {
      const fns = { realLoop, round2, round3, round4, round5, honesty, failurePath, reader, links, pageChecks, approve: (b) => approvePath(b, 1440, false) };
      for (const n of only.split(",")) await fns[n](browser);
      return;
    }
    await pageChecks(browser);
    await honesty(browser);
    await realLoop(browser);
    await round2(browser);
    await round3(browser);
    await round4(browser);
    await round5(browser);
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
