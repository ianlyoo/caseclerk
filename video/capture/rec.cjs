// Records real CaseClerk footage from production at 1920x1080 (viewport = recordVideo.size, DSF 1).
//   node rec.cjs <outdir> <take> [--allow-test-dispute]
// Guards, in this order, for every request the page makes:
//   - GET and HEAD pass.
//   - POST /api/test-dispute passes only with --allow-test-dispute and only while the shared budget file
//     (audit/test-dispute-budget.json, max 2 for phase A) has room; the use is written before the request goes out.
//   - Everything else is aborted and logged.
// Clicks go through click(), which refuses any control that approves, denies, files or rules.
// PP-R-XCS-10194591 is never opened. Each take writes <take>.webm and <take>.events.json (times from page creation).
const fs = require("fs");
const path = require("path");
const { chromium } = require("/home/company/g251/pw/node_modules/playwright-core");

const PROD = "https://caseclerk.vercel.app";
const VPY = "PP-R-VPY-10194485";
const XCS = "PP-R-XCS-10194591";
const RSL = "PP-R-RSL-10194603"; // opened by the arrival take on 2026-10-26
const BUDGET_FILE = path.join(__dirname, "..", "audit", "test-dispute-budget.json");
const BUDGET_MAX = 2;
const REFUSE = /file the evidence|don.?t file|yes, file|yes, don|approve|deny|undo|ask paypal|rule/i;
const W = 1920;
const H = 1080;

const [out, take, ...flags] = process.argv.slice(2);
const allowTestDispute = flags.includes("--allow-test-dispute");
if (!out || !take) throw new Error("usage: node rec.cjs <outdir> <take> [--allow-test-dispute]");
fs.mkdirSync(out, { recursive: true });

const events = [];
let t0 = 0;
const now = () => (Date.now() - t0) / 1000;
const log = (what, extra = {}) => {
  const e = { t: +now().toFixed(3), wall: new Date().toISOString(), what, ...extra };
  events.push(e);
  console.log(JSON.stringify(e));
};

function readBudget() {
  try {
    return JSON.parse(fs.readFileSync(BUDGET_FILE, "utf8"));
  } catch {
    return { max: BUDGET_MAX, used: [] };
  }
}

// An arrow cursor drawn in the page, so the recording shows where the real mouse is.
const CURSOR = `
(() => {
  const mk = () => {
    if (document.getElementById("rec-cursor")) return;
    const c = document.createElement("div");
    c.id = "rec-cursor";
    c.style.cssText = "position:fixed;left:0;top:0;width:34px;height:46px;z-index:2147483647;pointer-events:none;transform:translate(-200px,-200px);will-change:transform";
    c.innerHTML = '<svg width="34" height="46" viewBox="0 0 17 23"><path d="M1 1 L1 18.5 L5.2 14.6 L8.1 21.4 L11 20.2 L8.2 13.5 L14 13.5 Z" fill="#101214" stroke="#ffffff" stroke-width="1.3" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
    const last = sessionStorage.getItem("rec-cursor");
    if (last) c.style.transform = last;
  };
  addEventListener("mousemove", (e) => {
    mk();
    const v = "translate(" + e.clientX + "px," + e.clientY + "px)";
    document.getElementById("rec-cursor").style.transform = v;
    sessionStorage.setItem("rec-cursor", v);
  }, true);
  addEventListener("DOMContentLoaded", mk);
})();
`;

let mouse = { x: W * 0.62, y: H + 40 };
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

async function moveTo(page, x, y, ms = 700) {
  const steps = Math.max(8, Math.round(ms / 16));
  const from = { ...mouse };
  for (let i = 1; i <= steps; i++) {
    const k = ease(i / steps);
    await page.mouse.move(from.x + (x - from.x) * k, from.y + (y - from.y) * k);
    await page.waitForTimeout(ms / steps);
  }
  mouse = { x, y };
}

async function moveToEl(page, loc, ms = 700, dx = 0.5, dy = 0.55) {
  await loc.scrollIntoViewIfNeeded();
  const b = await loc.boundingBox();
  if (!b) throw new Error("no box");
  await moveTo(page, b.x + b.width * dx, b.y + b.height * dy, ms);
  return b;
}

async function click(page, loc, label, ms = 700) {
  const text = ((await loc.innerText().catch(() => "")) + " " + ((await loc.getAttribute("aria-label")) || "")).trim();
  const allowedOpen = /^open a test dispute$/i.test(text) && allowTestDispute;
  if (REFUSE.test(text) && !allowedOpen) throw new Error("refused click on: " + text);
  if (/open a test dispute/i.test(text) && !allowTestDispute) throw new Error("test dispute click without --allow-test-dispute");
  const href = await loc.getAttribute("href");
  if (href && href.includes(XCS)) throw new Error("refused link to " + XCS);
  await moveToEl(page, loc, ms);
  await page.waitForTimeout(180);
  await page.mouse.down();
  await page.waitForTimeout(70);
  await page.mouse.up();
  log("click", { label, text: text.slice(0, 80) });
}

async function scrollTo(page, y, ms = 1200) {
  await page.evaluate(
    ([y, ms]) =>
      new Promise((done) => {
        const y0 = scrollY;
        const t0 = performance.now();
        const e = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
        const step = (t) => {
          const k = Math.min(1, (t - t0) / ms);
          scrollTo(0, y0 + (y - y0) * e(k));
          if (k < 1) requestAnimationFrame(step);
          else done();
        };
        requestAnimationFrame(step);
      }),
    [y, ms],
  );
  log("scroll", { y });
}

async function scrollToEl(page, loc, top = 120, ms = 1200) {
  const y = await loc.evaluate((el, top) => el.getBoundingClientRect().top + scrollY - top, top);
  await scrollTo(page, Math.max(0, y), ms);
}

const hold = async (page, ms, what) => {
  if (what) log("hold", { ms, note: what });
  await page.waitForTimeout(ms);
};

async function goto(page, p) {
  if (p.includes(XCS)) throw new Error("refused " + p);
  await page.goto(PROD + p, { waitUntil: "domcontentloaded", timeout: 120000 });
  log("goto", { path: p });
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => log("networkidle-timeout"));
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(mouse.x, mouse.y);
}

const stop = (page, name) => page.locator(".sc-stop-btn", { hasText: name }).first();

const TAKES = {
  // Landing at load: the index travels the scale; then the "Asked the seller" stop's record.
  async landing(page) {
    await goto(page, "/");
    await hold(page, 9000, "load replay");
    await click(page, stop(page, "Asked the seller"), "stop asked", 900);
    await hold(page, 3500, "asked record");
    await click(page, stop(page, "Closed for the seller"), "stop closed", 800);
    await hold(page, 4000, "closed record");
    await moveTo(page, W * 0.8, H * 0.95, 700);
    await scrollToEl(page, page.getByText("It asks before", { exact: false }).first(), 140, 1400);
    await hold(page, 4000, "asks before");
  },

  // The reserved $412 case: scale stops, the decide panel (hovered, never clicked), the evidence.
  async vpy(page) {
    await goto(page, `/case/${VPY}`);
    await hold(page, 3500, "top");
    await click(page, stop(page, "Chargeback in"), "stop in", 900);
    await hold(page, 3500, "in record");
    await click(page, stop(page, "Asked you"), "stop asked", 800);
    await hold(page, 4500, "asked record");
    const panel = page.locator(".decide, [class*=decide]").first();
    await moveToEl(page, page.getByText("About 35%").first(), 900);
    await hold(page, 2500, "35%");
    await moveToEl(page, page.getByText(/Filing \$292\.22/).first(), 700);
    await hold(page, 2500, "expected loss");
    await moveToEl(page, page.getByRole("button", { name: "File the evidence" }), 800, 0.5, 0.5);
    log("hover", { label: "file the evidence (hover only)" });
    await hold(page, 3000, "hover file");
    await moveTo(page, W * 0.55, H * 0.92, 700);
    await scrollToEl(page, page.getByText("What CaseClerk will send PayPal").first(), 110, 1500);
    await hold(page, 4000, "evidence list");
    await click(page, page.locator(".more-toggle", { hasText: "The exact text" }).first(), "exact text", 900);
    await hold(page, 2000, "exact text open");
    await scrollTo(page, await page.evaluate(() => scrollY + 520), 1800);
    await hold(page, 4000, "exact text read");
    void panel;
  },

  // A resolved case: PayPal ruled for the seller, kept amount, the RESOLVED webhook in the record.
  async vab(page) {
    await goto(page, "/case/PP-R-VAB-10194570");
    await hold(page, 4000, "top");
    await click(page, stop(page, "Closed for you"), "stop closed", 900);
    await hold(page, 4500, "closed record");
    await click(page, stop(page, "You said yes"), "stop filed", 800);
    await hold(page, 4500, "filed record");
    await moveToEl(page, page.getByText("Held, then released").first(), 900);
    await hold(page, 3500, "held released");
  },

  async policy(page) {
    await goto(page, "/policy");
    await hold(page, 3000, "top");
    await scrollToEl(page, page.getByText("It asks before").first(), 150, 1500);
    await hold(page, 6000, "lanes");
    await scrollToEl(page, page.getByText("It fights when").first(), 150, 1500);
    await hold(page, 5000, "45% band");
  },

  async cases(page) {
    await goto(page, "/cases");
    await hold(page, 3500, "top");
    await scrollToEl(page, page.locator("#closed-title, h2", { hasText: "Closed" }).first(), 110, 1800);
    await hold(page, 3000, "closed head");
    await scrollTo(page, await page.evaluate(() => scrollY + 640), 6000);
    await hold(page, 4000, "kept rows");
  },

  // One real test dispute, from the click to the agent's question. Keeps the real clock.
  async arrival(page) {
    if (!allowTestDispute) throw new Error("arrival needs --allow-test-dispute");
    await goto(page, "/cases");
    await hold(page, 3000, "top");
    const btn = page.getByRole("button", { name: "Open a test dispute" }).first();
    await click(page, btn, "open test dispute", 1100);
    await moveTo(page, mouse.x + 160, mouse.y + 120, 600);
    const deadline = Date.now() + 15 * 60_000;
    let arrived = false;
    let worked = false;
    while (Date.now() < deadline) {
      const s = await page.evaluate(() => {
        const steps = [...document.querySelectorAll(".td-step")].map((li) => li.getAttribute("data-state"));
        const link = [...document.querySelectorAll(".td-wait a.btn")].map((a) => a.textContent);
        const msg = document.querySelector(".td-msg")?.textContent || "";
        return { steps, link, msg };
      });
      if (s.msg) {
        log("td-message", { msg: s.msg });
        break;
      }
      if (!arrived && s.steps[1] === "done") {
        arrived = true;
        log("arrived");
      }
      if (!worked && s.steps[2] === "done") {
        worked = true;
        log("worked", { link: s.link });
        break;
      }
      await page.waitForTimeout(1000);
    }
    await hold(page, 6000, "after worked");
    const open = page.locator(".td-wait a.btn").first();
    if (worked && (await open.count())) {
      await click(page, open, "open arrived case", 1000);
      await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
      log("case page", { url: page.url() });
      await hold(page, 6000, "case top");
      await click(page, stop(page, "Asked you"), "stop asked", 900);
      await hold(page, 5000, "asked record");
      await moveToEl(page, page.getByText(/Chance PayPal sides/).first(), 900);
      await hold(page, 4000, "panel");
    }
  },

  // The case the arrival take opened, after the agent asked (GET only; the decide panel is hovered, never clicked).
  async rsl(page) {
    await goto(page, `/case/${RSL}`);
    await hold(page, 4000, "top");
    await click(page, stop(page, "Asked you"), "stop asked", 900);
    await hold(page, 4500, "asked record");
    await moveToEl(page, page.getByText(/About \d+%/).first(), 900);
    await hold(page, 2500, "odds");
    await moveToEl(page, page.getByRole("button", { name: "File the evidence" }), 800, 0.5, 0.5);
    log("hover", { label: "file the evidence (hover only)" });
    await hold(page, 2500, "hover file");
    await moveTo(page, W * 0.55, H * 0.92, 700);
    await scrollToEl(page, page.getByText("What CaseClerk will send PayPal").first(), 110, 1500);
    await hold(page, 4000, "evidence list");
  },

  // The rules page, held on the two "asks you" lanes (the cut needs a longer hold than `policy`).
  async rules(page) {
    await goto(page, "/policy");
    await hold(page, 3500, "top");
    await scrollToEl(page, page.getByText("It asks before").first(), 150, 1500);
    await hold(page, 2500, "lanes");
    await moveToEl(page, page.getByText("Asks you", { exact: true }).first(), 1000, 0.5, 0.5);
    await hold(page, 4000, "evidence asks");
    await moveToEl(page, page.getByText("Asks you", { exact: true }).nth(1), 900, 0.5, 0.5);
    await hold(page, 5000, "refund asks");
  },

  // The inbox with the arrived case waiting for a yes.
  async inbox(page) {
    await goto(page, "/cases");
    await hold(page, 3000, "top");
    await moveToEl(page, page.locator(".wrow", { hasText: "$289.00" }).first(), 1000, 0.3, 0.5);
    await hold(page, 4000, "waiting row");
  },
};

(async () => {
  if (!TAKES[take]) throw new Error("unknown take " + take);
  const browser = await chromium.launch({ args: ["--disable-gpu", "--disable-software-rasterizer", "--font-render-hinting=none"] });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    recordVideo: { dir: out, size: { width: W, height: H } },
  });
  await ctx.addInitScript(CURSOR);
  await ctx.route("**/*", (route) => {
    const req = route.request();
    const m = req.method();
    const u = new URL(req.url());
    if (m === "GET" || m === "HEAD") {
      if (u.pathname.includes(XCS) && !u.pathname.startsWith("/api/")) return route.abort();
      return route.continue();
    }
    if (allowTestDispute && m === "POST" && u.origin === PROD && u.pathname === "/api/test-dispute") {
      const b = readBudget();
      if (b.used.length >= BUDGET_MAX) {
        log("blocked-budget", { url: u.pathname });
        return route.abort();
      }
      b.used.push({ at: new Date().toISOString(), take });
      fs.mkdirSync(path.dirname(BUDGET_FILE), { recursive: true });
      fs.writeFileSync(BUDGET_FILE, JSON.stringify(b, null, 1));
      log("POST test-dispute", { use: b.used.length });
      return route.continue();
    }
    log("blocked", { method: m, url: u.origin + u.pathname });
    return route.abort();
  });
  const page = await ctx.newPage();
  t0 = Date.now();
  log("start", { take });
  page.on("response", (r) => {
    const u = new URL(r.url());
    if (u.pathname === "/api/test-dispute") r.json().then((j) => log("test-dispute response", { status: r.status(), body: j }), () => log("test-dispute response", { status: r.status() }));
  });
  let err = null;
  try {
    await TAKES[take](page);
  } catch (e) {
    err = String(e && e.stack ? e.stack : e);
    log("error", { err: err.slice(0, 400) });
  }
  log("end");
  const video = page.video();
  await ctx.close();
  const src = await video.path();
  const dst = path.join(out, `${take}.webm`);
  fs.renameSync(src, dst);
  fs.writeFileSync(path.join(out, `${take}.events.json`), JSON.stringify({ take, recordedAt: new Date(t0).toISOString(), events }, null, 1));
  await browser.close();
  console.log("saved", dst);
  if (err) process.exit(2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
