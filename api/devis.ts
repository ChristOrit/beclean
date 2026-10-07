export default function handler(req: { method?: string }, res: { status: (c: number) => unknown; json: (p: unknown) => unknown }) {
  res.status(200).json({ ok: true, probe: 'control-no-import', method: req.method ?? 'none' });
}
