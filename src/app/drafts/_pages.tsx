// The evidence-pack PDF pages, drawn in HTML so both drafts can preview them.
// Text sizes are in container units, so a page reads the same at any width.

import { HERO, SELLER, usd } from "./_data";
import s from "./pages.module.css";

const frames = Array.from({ length: 24 }, (_, i) => i + 1);
const speeds = ["1/1000", "1/500", "1/250", "1/125", "1/60", "1/30", "1/15", "1/8"];

function Letter() {
  return (
    <div className={s.page} aria-label="Page 1, response letter">
      <p className={s.from}>
        {SELLER.name}
        <br />
        2131 SE Division St, Portland, OR 97202
      </p>
      <p>October 25, 2026</p>
      <p className={s.re}>Re: PayPal case {HERO.id}, {usd(HERO.amount)}</p>
      <p>
        The buyer reports a slow shutter at 1/15 and below and haze in the lens. The camera was tested on a full roll
        before it shipped (Exhibit D) and was described with its known wear (Exhibit C). UPS delivered it on October 14,
        signed by the buyer (Exhibit B).
      </p>
      <p>
        We asked for a video on October 23 and offered a partial refund toward a shutter service, which the buyer said
        he would prefer to a return (Exhibit E).
      </p>
      <ol className={s.exlist}>
        {HERO.evidence.exhibits.map((e) => (
          <li key={e.ref}>
            {e.ref}. {e.name}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Order() {
  return (
    <div className={s.page} aria-label="Page 2, order and listing">
      <p className={s.ex}>Exhibit A, order receipt</p>
      <table className={s.tbl}>
        <tbody>
          {HERO.order.lines.map((l) => (
            <tr key={l.name}>
              <td>{l.name}</td>
              <td className={s.num}>{usd(l.amount)}</td>
            </tr>
          ))}
          <tr className={s.total}>
            <td>Paid Oct 9, 2026, order {HERO.order.id}</td>
            <td className={s.num}>{usd(HERO.amount)}</td>
          </tr>
        </tbody>
      </table>
      <p className={s.ex}>Exhibit C, listing as published Oct 6</p>
      <div className={s.photos}>
        <span className={s.ph1} />
        <span className={s.ph2} />
        <span className={s.ph3} />
      </div>
      <p>&ldquo;{HERO.order.listingNote}&rdquo;</p>
    </div>
  );
}

function Delivery() {
  const ev = [
    ["Oct 14, 11:02 am", "Toronto, ON", "Delivered, signed OKAFOR"],
    ["Oct 14, 7:48 am", "Toronto, ON", "Out for delivery"],
    ["Oct 13, 9:15 pm", "Mississauga, ON", "Cleared customs"],
    ["Oct 12, 4:30 am", "Louisville, KY", "Departed facility"],
    ["Oct 10, 5:12 pm", "Portland, OR", "Picked up"],
  ];
  return (
    <div className={s.page} aria-label="Page 3, delivery">
      <p className={s.ex}>Exhibit B, UPS proof of delivery</p>
      <p className={s.mono}>{HERO.shipment.tracking}</p>
      <table className={s.tbl}>
        <tbody>
          {ev.map(([a, b, c]) => (
            <tr key={a}>
              <td>{a}</td>
              <td>{b}</td>
              <td>{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Ship to: D. Okafor, Toronto, ON M6J, Canada. Weight 1.9 lb. Service: Worldwide Saver.</p>
    </div>
  );
}

function TestRoll() {
  return (
    <div className={s.page} aria-label="Page 4, test roll">
      <p className={s.ex}>Exhibit D, pre-shipment test roll, Oct 7</p>
      <div className={s.sheet}>
        {frames.map((f) => (
          <span key={f} className={s.frame} style={{ filter: `brightness(${0.7 + ((f * 37) % 30) / 100})` }}>
            <i>{f}</i>
          </span>
        ))}
      </div>
      <p>
        Kodak Portra 400, body serial 1428803. Frames 1 to 8 bracket {speeds[0]} down to {speeds[7]}; all exposures
        within half a stop.
      </p>
    </div>
  );
}

export const PAGES = [Letter, Order, Delivery, TestRoll];
export const PAGE_TITLES = ["Letter", "Order and listing", "Delivery", "Test roll"];

export function EvidencePages({ className }: { className?: string }) {
  return (
    <div className={className}>
      {PAGES.map((P, i) => (
        <figure key={i} className={s.fig}>
          <P />
          <figcaption>
            {i + 1}. {PAGE_TITLES[i]}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
