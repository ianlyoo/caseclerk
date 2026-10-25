// Item photos under public/finals/b/items, each credited in public/finals/b/CREDITS.md. No entry, no photo.
export type Photo = { src: string; credit: string; w: number; h: number };

const p = (file: string, credit: string): Photo => ({ src: `/finals/b/items/${file}.webp`, credit, w: 480, h: 360 });

export const PHOTOS: Record<string, Photo> = {
  "om-1n": p("om-1n", "Gary Pearce, CC BY 2.0, Wikimedia Commons"),
  "rollei-35": p("rollei-35", "John Nuttall, CC BY 2.0, Wikimedia Commons"),
  hasselblad: p("hasselblad", "Benjamin Balazs, CC0, Wikimedia Commons"),
  "nikon-fm2": p("nikon-fm2", "JorgeGT, public domain, Wikimedia Commons"),
};
