import type { APIRoute } from 'astro';
import { isAuthenticated, unauthorized, json, badRequest, serverError } from '../../../lib/badges/auth';
import { setCompany } from '../../../lib/badges/db';

export const prerender = false;

export const PUT: APIRoute = async ({ request }) => {
  if (!isAuthenticated(request)) return unauthorized();
  try {
    const body: any = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('corps invalide');
    return json({ company: await setCompany(body) });
  } catch (e) {
    return serverError(e);
  }
};
