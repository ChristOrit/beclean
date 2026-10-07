import { ping } from './_lib/ping.js';
export default function handler(req: { method?: string }, res: { status: (c: number) => unknown; json: (p: unknown) => unknown }) {
  res.status(200).json({ ok: true, probe: 'import-js-extension', ping, method: req.method ?? 'none' });
}
