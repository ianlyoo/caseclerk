// GET-only stills of production at 1920x1080, DSF 1: node stills.cjs <outdir> "name=/path[,full][#wait:ms]" ...
// Every non-GET request is aborted. No clicks.
const fs = require("fs");
const { chromium } = require("/home/company/g251/pw/node_modules/playwright-core");
const PROD = "https://caseclerk.vercel.app";
const FORBIDDEN = ["PP-R-XCS-10194591"];
(async () => {
  const [out, ...jobs] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ["--disable-gpu", "--disable-software-rasterizer", "--font-render-hinting=none"] });
  for (const job of jobs) {
    const m = job.match(/^([^=]+)=([^,#]+)(,full)?(?:#wait:(\d+))?$/);
    if (!m) throw new Error("bad job " + job);
    const [, name, path, full, wait] = m;
    if (FORBIDDEN.some((id) => path.includes(id))) throw new Error("forbidden case " + path);
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    await ctx.route("**/*", (r) => (["GET", "HEAD"].includes(r.request().method()) ? r.continue() : r.abort()));
    const page = await ctx.newPage();
    await page.goto(PROD + path, { waitUntil: "networkidle", timeout: 120000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(Number(wait || 2500));
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: Boolean(full) });
    console.log(name, "ok", path);
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
