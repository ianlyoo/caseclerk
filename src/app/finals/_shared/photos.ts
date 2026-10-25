// Item photos in /public/finals, one per case where a CC0 / CC BY photo exists. Credits: public/finals/CREDITS.md.

export type Photo = { src: string; alt: string; credit: string };

export const PHOTOS: Record<string, Photo> = {
  "PP-R-NKT-10227591": { src: "/finals/om1n.webp", alt: "Olympus OM-1n body", credit: "Hiyotada, CC0, via Wikimedia Commons" },
  "PP-R-PLZ-10225917": { src: "/finals/rollei35s.webp", alt: "Rollei 35 S", credit: "John Nuttall from Hampshire, United Kingdom, CC BY 2.0, via Wikimedia Commons" },
  "PP-R-TVA-10227066": { src: "/finals/portra400.webp", alt: "Kodak Portra 400, 135 roll", credit: "Markus Spiske from Forchheim, Bavaria Upper Franconia, CC0, via Wikimedia Commons" },
  "PP-R-HBW-10226180": { src: "/finals/hasselblad500cm.webp", alt: "Hasselblad 500C/M", credit: "Benjamin Balazs, CC0, via Wikimedia Commons" },
  "PP-R-WEX-10226653": { src: "/finals/nikonfm2.webp", alt: "Nikon FM2", credit: "lovesx-70, CC BY 2.0, via Wikimedia Commons" },
};
