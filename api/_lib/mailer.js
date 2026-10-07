const NAP = {
  phone: "+229 01 67 59 23 19",
  whatsapp: "22967592319",
  to: "oritchrist@gmail.com"
};
const SERVICE_LABELS = {
  conception: "Conception paysagère et modélisation 3D",
  creation: "Création de jardins tropicaux",
  renovation: "Rénovation de jardins",
  entretien: "Entretien d'espaces verts",
  traitement: "Traitement phytosanitaire",
  arrosage: "Système d'arrosage automatique",
  autre: "Autre"
};
const MIN_FILL_MS = 2500;
const MAX = { name: 120, phone: 40, email: 200, service: 40, zone: 120, message: 5e3 };
function clean(value, limit) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}
function label(service) {
  return SERVICE_LABELS[service] || service || "Non précisé";
}
function whatsappUrl(lines) {
  return `https://wa.me/${NAP.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function row(heading, value) {
  if (!value) return "";
  return `<tr><td style="padding:8px 12px;background:#f5f7f5;color:#555;font:600 12px/1.4 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;vertical-align:top;width:170px">${heading}</td><td style="padding:8px 12px;font:15px/1.6 system-ui,sans-serif;color:#111;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`;
}
async function sendViaResend(subject, html, text) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Be Clean <onboarding@resend.dev>",
        to: [process.env.LEADS_TO_EMAIL || NAP.to],
        reply_to: NAP.to,
        subject,
        html,
        text
      })
    });
    if (!res.ok) {
      console.error("[lead] resend", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[lead] resend error", err);
    return false;
  }
}
async function handleLead(kind, body) {
  const name = clean(body.name, MAX.name);
  const phone = clean(body.phone, MAX.phone);
  const email = clean(body.email, MAX.email);
  const service = clean(body.service, MAX.service);
  const zone = clean(body.zone, MAX.zone);
  const message = clean(body.message, MAX.message);
  const honeypot = clean(body.website, 40);
  const ts = Number(body.ts) || 0;
  const wa = whatsappUrl([
    `Bonjour Be Clean, je vous contacte via votre site (${kind === "Devis" ? "demande de devis" : "page contact"}).`,
    "",
    `Nom : ${name || "—"}`,
    `Téléphone : ${phone || "—"}`,
    service ? `Service : ${label(service)}` : "",
    zone ? `Commune : ${zone}` : "",
    "",
    message || ""
  ].filter((line) => line !== void 0));
  if (honeypot) {
    console.warn("[lead] honeypot triggered", { kind, name, ip: "" });
    return { ok: true, delivered: false, whatsapp: wa };
  }
  if (!name || !message || kind === "Devis" && !phone) {
    return { ok: false, delivered: false, whatsapp: wa, error: "Champs obligatoires manquants." };
  }
  if (!ts || Date.now() - ts < MIN_FILL_MS) {
    return { ok: false, delivered: false, whatsapp: wa, error: "Envoi trop rapide, merci de réessayer." };
  }
  const subject = `[Be Clean] ${kind === "Devis" ? "Nouveau devis" : "Nouveau message"} — ${name}${zone ? ` (${zone})` : ""}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f2f4f2;padding:24px">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e4e8e4">
    <div style="background:#2f5d2a;padding:20px 24px">
      <p style="margin:0;font:700 18px/1.3 system-ui,sans-serif;color:#fff">Be Clean — ${kind === "Devis" ? "Demande de devis" : "Nouveau message"}</p>
      <p style="margin:6px 0 0;font:13px/1.4 system-ui,sans-serif;color:#c9e0c4">Reçu depuis ${escapeHtml(body.source || "beclean-benin.vercel.app")}</p>
    </div>
    <table style="width:100%;border-collapse:collapse">
      ${row("Nom", name)}
      ${row("Téléphone", phone)}
      ${row("E-mail", email)}
      ${row("Service", service ? label(service) : "")}
      ${row("Commune / zone", zone)}
      ${row("Message", message)}
    </table>
    <div style="padding:16px 24px;background:#fafbfa;border-top:1px solid #e4e8e4">
      <a href="${wa}" style="font:600 14px/1 system-ui,sans-serif;color:#2f5d2a">Répondre sur WhatsApp →</a>
    </div>
  </div>
</body></html>`;
  const text = [
    `Be Clean — ${kind === "Devis" ? "Demande de devis" : "Nouveau message"}`,
    `Nom : ${name}`,
    `Téléphone : ${phone}`,
    email ? `E-mail : ${email}` : "",
    service ? `Service : ${label(service)}` : "",
    zone ? `Commune : ${zone}` : "",
    "",
    message,
    "",
    `Répondre sur WhatsApp : ${wa}`
  ].filter(Boolean).join("\n");
  const delivered = await sendViaResend(subject, html, text);
  if (!delivered) console.warn("[lead] email non livré (RESEND_API_KEY manquante ou erreur)", { kind, name });
  return { ok: true, delivered, whatsapp: wa };
}
export {
  NAP,
  handleLead
};
