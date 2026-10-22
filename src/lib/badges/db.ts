/**
 * Studio badges — accès Postgres (Neon).
 * Schéma `badges` : members (agents) + company (identité commune, 1 ligne).
 */
import { neon } from '@neondatabase/serverless';

export interface Member {
  id: string;
  prenom: string;
  nom: string;
  role: string;
  matricule: string;
  whatsapp: string;
  photo: string | null;
  zoom: number;
  oy: number;
  ordre: number;
}

export interface Company {
  nom: string;
  sous: string;
  act: string;
  standard: string;
  adresse: string;
  ifu: string;
  site: string;
  slogan: string;
  serv1: string;
  serv2: string;
}

export const DEFAULT_COMPANY: Company = {
  nom: 'BECLEAN',
  sous: '& MULTISERVICES',
  act: 'PAYSAGISTE · COTONOU',
  standard: '01 67 59 23 19',
  adresse: 'Jéricho, Cotonou',
  ifu: 'IFU 0201910724958',
  site: 'https://beclean-benin.vercel.app/',
  slogan: '« Du rêve à la réalité, en toute harmonie. »',
  serv1: 'Conception 3D · Création de jardins',
  serv2: 'Rénovation · Entretien · Traitement',
};

/** Variable d'environnement : process.env (runtime Vercel) ou import.meta.env (dev Astro). */
export function env(name: string): string | undefined {
  const fromProc = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  if (fromProc) return fromProc;
  return (import.meta as any).env?.[name];
}

type SqlFn = ReturnType<typeof neon>;
let client: SqlFn | null = null;

function sql(): SqlFn {
  const url = env('DATABASE_URL');
  if (!url) throw new Error('DATABASE_URL manquant');
  if (!client) client = neon(url);
  return client;
}

function clampInt(v: unknown, lo: number, hi: number, dflt: number): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
}

/** Normalise un agent reçu du client : bornes, longueurs, types. */
export function sanitizeMember(input: any): Member {
  const str = (v: unknown, max: number) => String(v ?? '').slice(0, max);
  return {
    id: str(input?.id, 40),
    prenom: str(input?.prenom, 40),
    nom: str(input?.nom, 40),
    role: str(input?.role, 60),
    matricule: str(input?.matricule, 24),
    whatsapp: str(input?.whatsapp, 24),
    photo: input?.photo ? String(input.photo).slice(0, 800_000) : null,
    zoom: clampInt(input?.zoom, 80, 220, 100),
    oy: clampInt(input?.oy, 0, 100, 38),
    ordre: clampInt(input?.ordre, 0, 9999, 0),
  };
}

export async function listMembers(): Promise<Member[]> {
  const rows = await sql()`SELECT id, prenom, nom, role, matricule, whatsapp, photo, zoom, oy, ordre
                           FROM badges.members ORDER BY ordre, created_at`;
  return rows as unknown as Member[];
}

export async function saveMember(m: Member): Promise<Member> {
  const rows = await sql()`
    INSERT INTO badges.members (id, prenom, nom, role, matricule, whatsapp, photo, zoom, oy, ordre, updated_at)
    VALUES (${m.id}, ${m.prenom}, ${m.nom}, ${m.role}, ${m.matricule}, ${m.whatsapp},
            ${m.photo}, ${m.zoom}, ${m.oy}, ${m.ordre}, now())
    ON CONFLICT (id) DO UPDATE SET
      prenom = EXCLUDED.prenom, nom = EXCLUDED.nom, role = EXCLUDED.role,
      matricule = EXCLUDED.matricule, whatsapp = EXCLUDED.whatsapp, photo = EXCLUDED.photo,
      zoom = EXCLUDED.zoom, oy = EXCLUDED.oy, ordre = EXCLUDED.ordre, updated_at = now()
    RETURNING id, prenom, nom, role, matricule, whatsapp, photo, zoom, oy, ordre`;
  return rows[0] as unknown as Member;
}

export async function deleteMember(id: string): Promise<boolean> {
  const rows = await sql()`DELETE FROM badges.members WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function getCompany(): Promise<Company> {
  const rows = await sql()`SELECT data FROM badges.company WHERE id = 1`;
  if (!rows.length) {
    await sql()`INSERT INTO badges.company (id, data) VALUES (1, ${JSON.stringify(DEFAULT_COMPANY)}::jsonb)
                ON CONFLICT (id) DO NOTHING`;
    return DEFAULT_COMPANY;
  }
  return { ...DEFAULT_COMPANY, ...(rows[0] as any).data };
}

export async function setCompany(data: unknown): Promise<Company> {
  const merged = { ...DEFAULT_COMPANY, ...(data && typeof data === 'object' ? data : {}) };
  for (const k of Object.keys(merged) as (keyof Company)[]) {
    merged[k] = String(merged[k] ?? '').slice(0, 200);
  }
  await sql()`INSERT INTO badges.company (id, data, updated_at)
              VALUES (1, ${JSON.stringify(merged)}::jsonb, now())
              ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  return merged;
}
