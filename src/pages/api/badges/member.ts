import type { APIRoute } from 'astro';
import { isAuthenticated, unauthorized, json, badRequest, serverError } from '../../../lib/badges/auth';
import { sanitizeMember, saveMember, deleteMember } from '../../../lib/badges/db';
import { uid } from '../../../lib/badges/uid';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthenticated(request)) return unauthorized();
  try {
    const body: any = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('corps invalide');
    const m = sanitizeMember(body);
    if (!m.id || !/^[a-z0-9-]{1,40}$/.test(m.id)) m.id = uid();
    if (!m.prenom && !m.nom) return badRequest('prénom ou nom requis');
    return json({ member: await saveMember(m) });
  } catch (e) {
    return serverError(e);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!isAuthenticated(request)) return unauthorized();
  try {
    const id = new URL(request.url).searchParams.get('id') || '';
    if (!/^[a-z0-9-]{1,40}$/.test(id)) return badRequest('id invalide');
    return json({ ok: await deleteMember(id) });
  } catch (e) {
    return serverError(e);
  }
};
