// Item photos in /public/finals, one per case where a CC0 / CC BY photo exists. Credits: public/finals/CREDITS.md.

export type Photo = { src: string; alt: string; credit: string };

export const PHOTOS: Record<string, Photo> = {
  "PP-R-NKT-10227591": { src: "/finals/om1n.webp", alt: "Olympus OM-1n body", credit: "Hiyotada, CC0, via Wikimedia Commons" },
  "PP-R-PLZ-10225917": { src: "/finals/rollei35s.webp", alt: "Rollei 35 S", credit: "John Nuttall from Hampshire, United Kingdom, CC BY 2.0, via Wikimedia Commons" },
  "PP-R-TVA-10227066": { src: "/finals/portra-box.webp", alt: "Kodak Portra 135 film box and rolls (Portra 160 shown)", credit: "SkywalkerPL, CC BY 3.0, via Wikimedia Commons" },
  "PP-R-HBW-10226180": { src: "/finals/hasselblad500cm.webp", alt: "Hasselblad 500C/M", credit: "Benjamin Balazs, CC0, via Wikimedia Commons" },
  "PP-R-WEX-10226653": { src: "/finals/nikonfm2.webp", alt: "Nikon FM2", credit: "lovesx-70, CC BY 2.0, via Wikimedia Commons" },
  // Real sandbox cases: museum photos of similar items, not the seller's own.
  "PP-R-JKB-10194463": { src: "/finals/ring-dish.webp", alt: "Small celadon-glazed dish, sage green", credit: "Cleveland Museum of Art, CC0, via Wikimedia Commons" },
  "PP-R-RCJ-10194476": { src: "/finals/walnut-spoon.webp", alt: "Hand-carved wooden spoon", credit: "Public domain, via Wikimedia Commons" },
};
