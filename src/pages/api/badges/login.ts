import type { APIRoute } from 'astro';
import { passwordOk, sessionCookie, json } from '../../../lib/badges/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    /* corps vide */
  }
  if (!passwordOk(body?.password)) {
    return json({ error: 'Mot de passe incorrect' }, { status: 401 });
  }
  return json({ ok: true }, { headers: { 'set-cookie': sessionCookie() } });
};
