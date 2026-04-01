/**
 * Service d'envoi d'emails.
 * Centralise toutes les notifications email de l'application.
 */

const transporter = require("../config/mailer");
const { generateBadgePDF } = require("../utils/badge-pdf.util");

class MailService {
  /**
   * Envoie un email de confirmation de création d'événement à l'organisateur.
   * @param {object} params
   * @param {string} params.to          - Email de l'organisateur
   * @param {string} params.prenom      - Prénom de l'organisateur
   * @param {string} params.nom         - Nom de l'organisateur
   * @param {object} params.event       - Objet événement créé
   */
  static async sendEventCreated({ to, prenom, nom, event }) {
    const startDate = new Date(event.start_date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const endDate = new Date(event.end_date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #2563eb; padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; color: #1e293b; margin-bottom: 16px; }
    .message { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 28px; }
    .card { background: #f1f5f9; border-left: 4px solid #2563eb; border-radius: 6px; padding: 20px 24px; margin-bottom: 28px; }
    .card-title { font-size: 18px; font-weight: bold; color: #1e293b; margin: 0 0 12px 0; }
    .info-row { display: flex; margin-bottom: 8px; font-size: 14px; color: #475569; }
    .info-label { font-weight: bold; min-width: 120px; color: #1e293b; }
    .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 20px; margin-top: 4px; }
    .footer { background: #f8fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Événement créé avec succès</h1>
    </div>
    <div class="body">
      <p class="greeting">Bonjour <strong>${prenom} ${nom}</strong>,</p>
      <p class="message">
        Félicitations ! Votre événement a bien été créé sur la plateforme.
        Vous êtes désormais l'<strong>organisateur</strong> de cet événement et pouvez
        gérer votre équipe en assignant des rôles à vos membres.
      </p>

      <div class="card">
        <p class="card-title">${event.title}</p>
        ${event.description ? `<p style="font-size:14px;color:#475569;margin:0 0 14px 0;">${event.description}</p>` : ""}
        <div class="info-row">
          <span class="info-label">📅 Début :</span>
          <span>${startDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Fin :</span>
          <span>${endDate}</span>
        </div>
        ${event.lieu ? `
        <div class="info-row">
          <span class="info-label">📍 Lieu :</span>
          <span>${event.lieu}</span>
        </div>` : ""}
        <div style="margin-top:12px;">
          <span class="badge">Organisateur</span>
        </div>
      </div>

      <p class="message">
        Vous pouvez dès maintenant ajouter des membres à votre équipe et leur assigner
        des rôles (Coordinateur, Accueil, Sécurité, Animateur, Logistique, Communication…).
      </p>
    </div>
    <div class="footer">
      Cet email a été envoyé automatiquement par la plateforme Badges Système.<br/>
      Ne pas répondre à cet email.
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Badges Système" <${process.env.MAIL_FROM}>`,
      to,
      subject: `🎉 Votre événement "${event.title}" a été créé`,
      html,
    });
  }
  /**
   * Envoie un email de confirmation d'inscription avec le badge en PDF.
   * @param {object} params
   * @param {string} params.to          - Email du participant
   * @param {object} params.participant - Objet participant
   * @param {object} params.event       - Objet événement
   * @param {object} params.category    - Objet catégorie
   * @param {object} params.badge       - Objet badge (avec qr_code)
   * @param {object} params.form_data   - Données du formulaire soumis
   */
  static async sendInscriptionConfirmed({ to, participant, event, category, badge, form_data = {} }) {
    const displayName =
      form_data.prenom && form_data.nom
        ? `${form_data.prenom} ${form_data.nom}`
        : form_data.nom || form_data.prenom || to;

    const startDate = new Date(event.start_date).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const endDate = new Date(event.end_date).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    // Générer le PDF du badge
    const pdfBuffer = await generateBadgePDF({ participant, event, category, badge, form_data });

    // Construire le tableau des infos du formulaire pour l'email
    const formRows = Object.entries(form_data)
      .filter(([key]) => key !== "email")
      .map(([key, val]) => `<tr><td style="padding:6px 12px;font-weight:bold;color:#1e293b;">${key}</td><td style="padding:6px 12px;color:#475569;">${val}</td></tr>`)
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #2563eb; padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; color: #1e293b; margin-bottom: 16px; }
    .message { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
    .card { background: #f1f5f9; border-left: 4px solid #2563eb; border-radius: 6px; padding: 20px 24px; margin-bottom: 24px; }
    .card-title { font-size: 17px; font-weight: bold; color: #1e293b; margin: 0 0 12px 0; }
    .info-row { display: flex; margin-bottom: 8px; font-size: 14px; color: #475569; }
    .info-label { font-weight: bold; min-width: 120px; color: #1e293b; }
    .badge-pill { display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 20px; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    table tr:nth-child(even) { background: #f8fafc; }
    .footer { background: #f8fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Inscription confirmée</h1>
    </div>
    <div class="body">
      <p class="greeting">Bonjour <strong>${displayName}</strong>,</p>
      <p class="message">
        Votre inscription à l'événement <strong>${event.title}</strong> a été confirmée.
        Votre badge d'accès est joint à cet email en pièce jointe (PDF). Présentez-le à l'entrée.
      </p>

      <div class="card">
        <p class="card-title">${event.title}</p>
        <div class="info-row">
          <span class="info-label">📅 Début :</span>
          <span>${startDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Fin :</span>
          <span>${endDate}</span>
        </div>
        ${event.lieu ? `<div class="info-row"><span class="info-label">📍 Lieu :</span><span>${event.lieu}</span></div>` : ""}
        <div class="badge-pill">${category.name}</div>
      </div>

      ${formRows ? `
      <p style="font-size:15px;font-weight:bold;color:#1e293b;margin-bottom:10px;">Vos informations d'inscription</p>
      <table>${formRows}</table>
      ` : ""}

      <p class="message" style="margin-top:24px;">
        Votre badge PDF est en pièce jointe. Vous pouvez l'imprimer ou le présenter depuis votre téléphone.
      </p>
    </div>
    <div class="footer">
      Cet email a été envoyé automatiquement par la plateforme Badges Système.<br/>
      Ne pas répondre à cet email.
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Badges Système" <${process.env.MAIL_FROM}>`,
      to,
      subject: `✅ Votre badge pour "${event.title}"`,
      html,
      attachments: [
        {
          filename: `badge-${event.title.replace(/\s+/g, "-").toLowerCase()}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  }
}

module.exports = MailService;
