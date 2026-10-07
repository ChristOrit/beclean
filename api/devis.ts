import { handleLead } from './_lib/mailer';
import type { VercelRequest, VercelResponse } from './_lib/vercel';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }
  const result = await handleLead('Devis', (req.body ?? {}) as Record<string, string>);
  res.status(result.ok ? 200 : 400).json(result);
}
