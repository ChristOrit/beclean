import type { APIRoute } from 'astro';
import { isAuthenticated, unauthorized, json, serverError } from '../../../lib/badges/auth';
import { listMembers, getCompany } from '../../../lib/badges/db';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!isAuthenticated(request)) return unauthorized();
  try {
    const [members, company] = await Promise.all([listMembers(), getCompany()]);
    return json({ members, company });
  } catch (e) {
    return serverError(e);
  }
};
