import { ping } from './_lib/ping';
export default function handler(req: { method?: string }, res: { status: (c: number) => unknown; json: (p: unknown) => unknown }) {
  res.status(200).json({ ok: true, probe: 'import-trivial', ping, method: req.method ?? 'none' });
}
