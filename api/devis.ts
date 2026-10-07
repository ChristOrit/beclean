import { NAP } from './_lib/mailer';
export default function handler(req: { method?: string }, res: { status: (c: number) => unknown; json: (p: unknown) => unknown }) {
  res.status(200).json({ ok: true, probe: 'import-mailer', to: NAP.to, method: req.method ?? 'none' });
}
