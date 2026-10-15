/**
 * Inscription newsletter → Brevo.
 *
 * Variables d'environnement attendues (Vercel → Settings → Environment Variables) :
 *   BREVO_API_KEY  : clé API Brevo (« xkeysib-… »)
 *   BREVO_LIST_ID  : identifiant numérique de la liste Brevo cible
 */
const MIN_FILL_MS = 1200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cleanEmail(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, "").trim().slice(0, 200).toLowerCase();
}

async function addToBrevo(email) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("[newsletter] BREVO_API_KEY manquante");
    return false;
  }
  const listId = Number(process.env.BREVO_LIST_ID) || null;
  const payload = { email, updateEnabled: true };
  if (listId) payload.listIds = [listId];

  try {
    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) return true;

    const body = await res.text();
    // 400 « duplicate_parameter » = contact déjà inscrit → on considère que c'est bon.
    if (res.status === 400 && /duplicate/i.test(body)) return true;

    console.error("[newsletter] brevo", res.status, body);
    return false;
  } catch (err) {
    console.error("[newsletter] brevo error", err);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const body = req.body ?? {};
  const email = cleanEmail(body.email);
  const honeypot = typeof body.website === "string" ? body.website.trim() : "";
  const ts = Number(body.ts) || 0;

  // Bot : on répond « ok » sans rien faire.
  if (honeypot) {
    res.status(200).json({ ok: true, delivered: false });
    return;
  }

  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ ok: false, error: "Merci d'indiquer une adresse e-mail valide." });
    return;
  }

  if (!ts || Date.now() - ts < MIN_FILL_MS) {
    res.status(400).json({ ok: false, error: "Envoi trop rapide, merci de réessayer." });
    return;
  }

  const delivered = await addToBrevo(email);

  if (delivered) {
    res.status(200).json({ ok: true, delivered: true });
    return;
  }
  res.status(502).json({
    ok: false,
    error: "Inscription momentanément indisponible. Merci de réessayer plus tard."
  });
}
