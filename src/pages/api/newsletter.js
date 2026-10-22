/**
 * Inscription newsletter → Brevo.
 * Porté depuis l'ancien dossier `api/` (fonctions Vercel) vers les routes Astro.
 *
 * Variables d'environnement attendues (Vercel → Settings → Environment Variables) :
 *   BREVO_API_KEY  : clé API Brevo (« xkeysib-… »)
 *   BREVO_LIST_ID  : identifiant numérique de la liste Brevo cible
 */
export const prerender = false;

const MIN_FILL_MS = 1200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

/** Variable d'environnement : process.env (runtime Vercel) ou import.meta.env (dev Astro). */
function env(name) {
  if (typeof process !== 'undefined' && process.env && process.env[name]) return process.env[name];
  return import.meta.env?.[name];
}

function cleanEmail(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, '').trim().slice(0, 200).toLowerCase();
}

async function addToBrevo(email) {
  const apiKey = env('BREVO_API_KEY');
  if (!apiKey) {
    console.error('[newsletter] BREVO_API_KEY manquante');
    return false;
  }
  const listId = Number(env('BREVO_LIST_ID')) || null;
  const payload = { email, updateEnabled: true };
  if (listId) payload.listIds = [listId];

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) return true;

    const body = await res.text();
    // 400 « duplicate_parameter » = contact déjà inscrit → on considère que c'est bon.
    if (res.status === 400 && /duplicate/i.test(body)) return true;

    console.error('[newsletter] brevo', res.status, body);
    return false;
  } catch (err) {
    console.error('[newsletter] brevo error', err);
    return false;
  }
}

export const POST = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) ?? {};
  const email = cleanEmail(body.email);
  const honeypot = typeof body.website === 'string' ? body.website.trim() : '';
  const ts = Number(body.ts) || 0;

  // Bot : on répond « ok » sans rien faire.
  if (honeypot) return json({ ok: true, delivered: false });

  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: "Merci d'indiquer une adresse e-mail valide." }, 400);
  }

  if (!ts || Date.now() - ts < MIN_FILL_MS) {
    return json({ ok: false, error: 'Envoi trop rapide, merci de réessayer.' }, 400);
  }

  const delivered = await addToBrevo(email);

  if (delivered) return json({ ok: true, delivered: true });

  return json(
    { ok: false, error: 'Inscription momentanément indisponible. Merci de réessayer plus tard.' },
    502
  );
};

export const ALL = () => json({ ok: false, error: 'Method not allowed' }, 405);
