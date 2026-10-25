// Browser checks for the drafts, the ones a static grep can't make (see TELLS.md, "Round 2").
// Runs on a machine with Playwright: node check-ui.cjs https://<deploy>
// check-tells.sh runs it over ssh on the Mac; set PW to another playwright-core path elsewhere.
const { chromium } = require(process.env.PW || "/opt/homebrew/lib/node_modules/@playwright/mcp/node_modules/playwright-core");

const BASE = process.argv[2].replace(/\/$/, "");
const HERO = "PP-R-NKT-10227591";
const FOLDS = [
  { name: "1920x940 (1080p window)", viewport: { width: 1920, height: 940 }, deviceScaleFactor: 1 },
  { name: "1536x752 @1.25 (1920 at 125%)", viewport: { width: 1536, height: 752 }, deviceScaleFactor: 1.25 },
];
const WIDE = [...FOLDS, { name: "2560x1440", viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 1 }];
const PHONE = { name: "390x844", viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

let fail = 0;
const out = (ok, name, note) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? ` (${note})` : ""}`);
  if (!ok) fail = 1;
};

async function open(browser, ctxOpts, path) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  return { ctx, page, status: res.status() };
}

const approveBtn = (page) => page.getByRole("button", { name: /^Approve/ });
const navCount = (page) =>
  page.evaluate(() => {
    const a = [...document.querySelectorAll("header nav a")].find((x) => /Approvals|Waiting for you/.test(x.textContent));
    const m = a && a.textContent.match(/(\d+)/);
    return m ? Number(m[1]) : 0;
  });

// Text colour against the first opaque background up the tree, for every visible text node's element.
const contrastFails = (page, firstScreenOnly) =>
  page.evaluate((first) => {
    const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
    const lum = ([r, g, b]) => {
      const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const bg = (el) => {
      for (let e = el; e; e = e.parentElement) {
        const c = rgb(getComputedStyle(e).backgroundColor);
        if (c.length === 3 || (c.length === 4 && c[3] > 0.9)) return c.slice(0, 3);
      }
      return [255, 255, 255];
    };
    const bad = [];
    const seen = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!n.textContent.trim() || seen.has(el) || el.closest("figure,[aria-hidden],button:disabled")) continue;
      seen.add(el);
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || (first && r.top > innerHeight)) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      const a = lum(rgb(cs.color)), b = lum(bg(el));
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      if (ratio < 4.5) bad.push(`${n.textContent.trim().slice(0, 30)} ${ratio.toFixed(2)}`);
    }
    return bad;
  }, firstScreenOnly);

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const d of ["a", "b"]) {
    const D = d.toUpperCase();

    // 1. Fold: Approve, with its amount, inside a real browser window at 100 % and 125 %; the live PayPal line on the first screen.
    for (const v of FOLDS) {
      const { ctx, page } = await open(browser, v, `/drafts/${d}/case`);
      const btn = approveBtn(page);
      const box = await btn.boundingBox();
      const vh = v.viewport.height;
      out(box && box.y + box.height <= vh - 24, `${D} Approve above the fold at ${v.name}`, box ? `bottom ${Math.round(box.y + box.height)} of ${vh}` : "no button");
      out(/\$180\.00/.test(await btn.textContent()), `${D} Approve button states the amount`, (await btn.textContent()).trim());
      const live = await page.evaluate(() => {
        const p = [...document.querySelectorAll("p")].find((x) => x.textContent.includes("Live on PayPal sandbox"));
        if (!p) return null;
        const codes = [...p.querySelectorAll("span")].filter((s) => /CUSTOMER\.|^[0-9a-f]{13}$/.test(s.textContent));
        return {
          bottom: p.getBoundingClientRect().bottom,
          text: p.textContent,
          minPx: Math.min(...codes.map((s) => parseFloat(getComputedStyle(s).fontSize))),
          n: codes.length,
        };
      });
      out(live && live.bottom <= vh && live.n >= 2, `${D} live PayPal line (webhook + debug id) on the first screen at ${v.name}`, live ? live.text.slice(0, 90) : "missing");
      out(live && live.minPx >= 13, `${D} webhook and debug id at >= 13 px at ${v.name}`, live ? `${live.minPx.toFixed(1)} px` : "");
      const bad = await contrastFails(page, true);
      out(!bad.length, `${D} first-screen text contrast >= 4.5:1 at ${v.name}`, bad.slice(0, 3).join("; "));
      await ctx.close();
    }

    // 2. Base type size (A must read in a 1280 video player).
    {
      const { ctx, page } = await open(browser, FOLDS[0], `/drafts/${d}/case`);
      const px = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector("[class*='root']")).fontSize));
      out(d === "b" || px >= 15, `${D} base text at 1920`, `${px.toFixed(2)} px${d === "a" ? ", needs >= 15" : ""}`);
      await ctx.close();
    }

    // 3. Follow the Approve click: the whole page changes and Approve can't come back.
    {
      const { ctx, page } = await open(browser, FOLDS[0], `/drafts/${d}/case`);
      const before = await navCount(page);
      await approveBtn(page).click();
      await page.waitForTimeout(5500); // the 4 s undo window, then "sent"
      const body = await page.evaluate(() => document.body.innerText);
      const after = await navCount(page);
      out(after === before - 1, `${D} after Approve the nav count drops`, `${before} to ${after}`);
      out(!/Needs your approval|until you decide/.test(body), `${D} after Approve no "Needs your approval" / "until you decide"`);
      out(body.includes("You approved the $180.00 offer"), `${D} after Approve the timeline has "You approved the $180.00 offer"`);
      out(/Sent to PayPal[\s\S]*make-offer[\s\S]*3c81e0f5a9d27/.test(body), `${D} after Approve "Sent to PayPal" with endpoint and debug id`);
      out((await approveBtn(page).count()) === 0, `${D} after sending, no Approve button`);
      await page.screenshot({ path: `${process.env.SHOTS || "/tmp"}/${d}-case-approved-1920.png` });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      out((await approveBtn(page).count()) === 0, `${D} after a reload, still no Approve button`);
      await page.getByRole("button", { name: /buyer accepts/i }).click();
      await page.waitForTimeout(300);
      const end = await page.evaluate(() => document.body.innerText);
      out(end.includes("CUSTOMER.DISPUTE.RESOLVED") && /you kept \$232\.00/i.test(end), `${D} sandbox "buyer accepts" closes the case with the money line`);
      await ctx.close();
    }

    // 4. Every link on the inbox, case and deadlines pages resolves, and none goes to /board.
    {
      const { ctx, page } = await open(browser, FOLDS[0], `/drafts/${d}/inbox`);
      const hrefs = new Set();
      for (const p of ["inbox", "case", "deadlines"]) {
        await page.goto(`${BASE}/drafts/${d}/${p}`, { waitUntil: "networkidle" });
        for (const h of await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")))) hrefs.add(h);
      }
      const navHrefs = await page.$$eval("header a[href]", (as) => as.map((a) => a.getAttribute("href")));
      const bad = [];
      for (const h of hrefs) {
        if (h.includes("/board") || !h.startsWith("/")) { bad.push(h); continue; }
        const r = await page.request.get(BASE + h.split("#")[0]);
        if (r.status() !== 200) bad.push(`${h} ${r.status()}`);
      }
      out(!bad.length, `${D} all ${hrefs.size} links resolve 200, none to /board`, bad.join(", "));
      out(navHrefs.every((h) => h.startsWith(`/drafts/${d}/`)), `${D} nav links stay inside draft ${D}`, navHrefs.join(" "));

      // 5. Inbox rows open their own case.
      await page.goto(`${BASE}/drafts/${d}/inbox`, { waitUntil: "networkidle" });
      const rows = [...new Set(await page.$$eval("main a[href*='/case/'], article a[href*='/case/']", (as) => as.map((a) => a.getAttribute("href"))))];
      const h1s = new Set();
      const kinds = new Set();
      const wrong = [];
      for (const h of rows) {
        await page.goto(BASE + h, { waitUntil: "networkidle" });
        const t = await page.evaluate(() => ({ h1: document.querySelector("h1").textContent, body: document.body.innerText }));
        h1s.add(t.h1);
        if (!t.body.includes(h.split("/").pop())) wrong.push(h);
        if ((await approveBtn(page).count()) > 0) kinds.add("approval");
        if (/Agent working/.test(t.body)) kinds.add("working");
        if (/You kept \$/.test(t.body)) kinds.add("closed");
      }
      out(rows.length >= 3 && h1s.size === rows.length && !wrong.length, `${D} ${rows.length} inbox rows open ${h1s.size} distinct cases, each showing its own id`, wrong.join(" "));
      out(kinds.size === 3, `${D} cases cover approval, agent working and closed`, [...kinds].join(", "));
      await ctx.close();
    }

    // 6. Phone: nav fits, no sideways scroll, Approve on the first screen.
    {
      const { ctx, page } = await open(browser, PHONE, `/drafts/${d}/case`);
      const m = await page.evaluate(() => {
        const nav = document.querySelector("header nav");
        return { nav: nav.scrollWidth - nav.clientWidth, doc: document.documentElement.scrollWidth };
      });
      out(m.nav <= 0, `${D} phone nav fits`, `overflow ${m.nav}px`);
      out(m.doc <= 390, `${D} phone page has no sideways scroll`, `${m.doc}px`);
      const box = await approveBtn(page).boundingBox();
      out(box && box.y + box.height <= 844, `${D} phone Approve on the first screen`, box ? `bottom ${Math.round(box.y + box.height)} of 844` : "no button");
      await ctx.close();
    }
  }

  // 7. B's calendar: all 14 days visible, no hidden scroll, no names over the day lines.
  for (const v of WIDE) {
    const { ctx, page } = await open(browser, v, "/drafts/b/inbox");
    const c = await page.evaluate(() => {
      const ol = [...document.querySelectorAll("ol")].find((o) => o.children.length === 14 && o.textContent.startsWith("Today"));
      if (!ol) return null;
      const box = ol.getBoundingClientRect();
      const lis = [...ol.children];
      const hidden = lis.filter((li) => li.getBoundingClientRect().right > box.right + 0.5).length;
      const spill = lis.filter((li) => li.scrollWidth > li.clientWidth + 0.5).length;
      let wrapScroll = 0;
      for (let e = ol; e && e !== document.body; e = e.parentElement) wrapScroll = Math.max(wrapScroll, e.scrollWidth - e.clientWidth);
      return { hidden, spill, wrapScroll };
    });
    out(c && !c.hidden && !c.spill && c.wrapScroll <= 0, `B calendar shows all 14 days with no overflow at ${v.name}`, c ? JSON.stringify(c) : "calendar missing");
    await ctx.close();
  }

  // 8. Whole-page contrast on every page (first screen is checked above).
  for (const p of ["a/case", "a/inbox", "a/deadlines", "b/case", "b/inbox", "b/deadlines", "a/case/PP-R-RBN-10224961", "b/case/PP-R-RBN-10224961"]) {
    const { ctx, page, status } = await open(browser, FOLDS[0], `/drafts/${p}`);
    const bad = await contrastFails(page, false);
    out(status === 200 && !bad.length, `/drafts/${p} all text >= 4.5:1`, bad.slice(0, 3).join("; "));
    await ctx.close();
  }

  await browser.close();
  process.exit(fail);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
