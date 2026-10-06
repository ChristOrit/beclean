import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    const { name, phone, email, service, message } = data;

    if (!name || !phone || !service || !message) {
      return new Response(
        JSON.stringify({ error: 'Veuillez remplir tous les champs obligatoires.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const serviceLabels: Record<string, string> = {
      conception: 'Conception paysagère et modélisation 3D',
      creation: 'Création de jardins tropicaux',
      renovation: 'Rénovation de jardins',
      entretien: "Entretien d'espaces verts",
      traitement: 'Traitement phytosanitaire',
      autre: 'Autre',
    };

    const emailBody = `
Nouvelle demande de devis - Be Clean

Nom: ${name}
Téléphone: ${phone}
Email: ${email || 'Non renseigné'}
Service: ${serviceLabels[service] || service}

Message:
${message}
    `.trim();

    console.log('Nouvelle demande de devis:', emailBody);

    return new Response(
      JSON.stringify({ success: true, message: 'Votre demande de devis a été envoyée avec succès.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Une erreur est survenue. Veuillez réessayer.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
