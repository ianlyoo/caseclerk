import { PHOTOS } from "../_lib/photos";
import s from "../b.module.css";

/** An item photo set on a paper mat. Renders nothing when the item has no credited photo. */
export function Photo({ name, size, alt }: { name?: string; size: "row" | "mat" | "list"; alt: string }) {
  const p = name ? PHOTOS[name] : undefined;
  if (!p) return null;
  return (
    <span className={`${s.mat} ${s["mat_" + size]}`} data-object>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.src} alt={alt} width={p.w} height={p.h} data-credit={p.credit} loading={size === "mat" ? "eager" : "lazy"} />
    </span>
  );
}
