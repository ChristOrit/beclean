import { handleLead } from '../../lib/mailer.js';

export const prerender = false;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

export const POST = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) ?? {};
  const result = await handleLead('Message', body);
  return json(result, result.ok ? 200 : 400);
};

export const ALL = () => json({ ok: false, error: 'Method not allowed' }, 405);
