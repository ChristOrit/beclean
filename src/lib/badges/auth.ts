/**
 * Studio badges — authentification légère par mot de passe.
 * Jeton signé HMAC-SHA256 stocké dans un cookie HttpOnly (30 jours).
 * Secret : BADGES_STUDIO_SECRET si défini, sinon dérivé du mot de passe
 * BADGES_STUDIO_PWD (fallback de développement uniquement).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'bcs';
const DAY = 86400;
export const STUDIO_PATH = '/studio/badges';

/** Variable d'environnement : process.env (runtime Vercel) ou import.meta.env (dev Astro). */
function env(name: string): string | undefined {
  const fromProc = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  if (fromProc) return fromProc;
  return (import.meta as any).env?.[name];
}

function password(): string {
  return env('BADGES_STUDIO_PWD') || 'beclean2026';
}

function secret(): string {
  return env('BADGES_STUDIO_SECRET') || `beclean-studio::${password()}`;
}

function sign(exp: string): string {
  return createHmac('sha256', secret()).update(exp).digest('base64url');
}

export function makeToken(): string {
  const exp = String(Math.floor(Date.now() / 1000) + 30 * DAY);
  return `${exp}.${sign(exp)}`;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function validToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) * 1000 < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}

export function isAuthenticated(request: Request): boolean {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)bcs=([^;]+)/);
  return validToken(m?.[1]);
}

export function passwordOk(input: unknown): boolean {
  return safeEqual(String(input ?? ''), password());
}

export function sessionCookie(): string {
  return `${COOKIE}=${makeToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * DAY}; Secure`;
}

export function clearCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
}

export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  });
}

export function json(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(data), { ...init, status: init?.status ?? 200, headers });
}

export function badRequest(msg: string): Response {
  return json({ error: msg }, { status: 400 });
}

export function serverError(e: unknown): Response {
  console.error('[badges-api]', e);
  return json({ error: 'server_error' }, { status: 500 });
}
