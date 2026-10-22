import type { APIRoute } from 'astro';
import { clearCookie, json } from '../../../lib/badges/auth';

export const prerender = false;

export const POST: APIRoute = async () => {
  return json({ ok: true }, { headers: { 'set-cookie': clearCookie() } });
};
