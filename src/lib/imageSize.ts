/**
 * Dimensions réelles d'une image, lues dans le fichier — sans dépendance.
 *
 * Sert à `<Img>` pour poser `width`/`height` exacts sur chaque `<img>` : c'est
 * ce qui permet au navigateur de réserver la bonne place avant le chargement.
 * Une valeur fausse réserve la mauvaise place et provoque un décalage.
 *
 * Formats gérés : JPEG (marqueur SOF), PNG (IHDR), SVG (width/height ou viewBox).
 */
import fs from 'node:fs';

type Size = [number, number];

const cache = new Map<string, Size | null>();

function jpeg(buf: Buffer): Size | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let o = 2;
  while (o + 9 < buf.length) {
    if (buf[o] !== 0xff) {
      o++;
      continue;
    }
    const marker = buf[o + 1]!;
    // marqueurs sans charge utile
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      o += 2;
      continue;
    }
    const len = buf.readUInt16BE(o + 2);
    // SOF0..SOF15, sauf DHT (C4), JPG (C8) et DAC (CC)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return [buf.readUInt16BE(o + 7), buf.readUInt16BE(o + 5)];
    }
    if (marker === 0xda || marker === 0xd9) break; // début des données compressées
    o += 2 + len;
  }
  return null;
}

function png(buf: Buffer): Size | null {
  if (buf.length < 24 || buf.toString('latin1', 1, 4) !== 'PNG') return null;
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

function svg(text: string): Size | null {
  const w = /\bwidth\s*=\s*"([\d.]+)/.exec(text);
  const h = /\bheight\s*=\s*"([\d.]+)/.exec(text);
  if (w && h) return [Math.round(Number(w[1])), Math.round(Number(h[1]))];
  const vb = /viewBox\s*=\s*"[\d.\s,-]+?[\s,]+([\d.]+)[\s,]+([\d.]+)"/.exec(text);
  if (vb) return [Math.round(Number(vb[1])), Math.round(Number(vb[2]))];
  return null;
}

/** `file` = chemin absolu du fichier image. Renvoie `null` si illisible. */
export function imageSize(file: string): Size | null {
  const connu = cache.get(file);
  if (connu !== undefined) return connu;

  let taille: Size | null = null;
  try {
    const buf = fs.readFileSync(file);
    taille = file.endsWith('.svg') ? svg(buf.toString('utf8')) : (png(buf) ?? jpeg(buf));
  } catch {
    taille = null;
  }

  cache.set(file, taille);
  return taille;
}
