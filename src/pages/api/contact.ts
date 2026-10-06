import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    const { name, phone, email, subject, message } = data;

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Veuillez remplir tous les champs obligatoires.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailBody = `
Nouveau message - Be Clean

Nom: ${name}
Téléphone: ${phone || 'Non renseigné'}
Email: ${email}
Sujet: ${subject || 'Non renseigné'}

Message:
${message}
    `.trim();

    console.log('Nouveau message:', emailBody);

    return new Response(
      JSON.stringify({ success: true, message: 'Votre message a été envoyé avec succès.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Une erreur est survenue. Veuillez réessayer.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
