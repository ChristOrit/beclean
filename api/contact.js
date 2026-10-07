import { handleLead } from './_lib/mailer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }
  const result = await handleLead('Message', req.body ?? {});
  res.status(result.ok ? 200 : 400).json(result);
}
