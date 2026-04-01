/**
 * Génère un PDF de badge pour un participant.
 * Retourne un Buffer contenant le PDF.
 *
 * @param {object} params
 * @param {object} params.participant  - Objet participant (nom, prenom, email…)
 * @param {object} params.event        - Objet événement (title, start_date, end_date, lieu)
 * @param {object} params.category     - Objet catégorie (name)
 * @param {object} params.badge        - Objet badge (qr_code en data URL base64)
 * @returns {Promise<Buffer>}
 */

const PDFDocument = require("pdfkit");

function generateBadgePDF({ participant, event, category, badge }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [300, 420], margin: 20 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const displayName =
      participant.prenom && participant.nom
        ? `${participant.prenom} ${participant.nom}`
        : participant.nom || participant.prenom || participant.email;

    const startDate = new Date(event.start_date).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
    const endDate = new Date(event.end_date).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });

    // ── En-tête ─────────────────────────────────────────────────────────────
    doc.rect(0, 0, 300, 80).fill("#2563eb");
    doc.fillColor("#ffffff").fontSize(16).font("Helvetica-Bold")
      .text("BADGE D'ACCÈS", 20, 22, { width: 260, align: "center" });
    doc.fontSize(11).font("Helvetica")
      .text(event.title, 20, 46, { width: 260, align: "center" });

    // ── Infos participant ────────────────────────────────────────────────────
    doc.fillColor("#1e293b").fontSize(18).font("Helvetica-Bold")
      .text(displayName, 20, 100, { width: 260, align: "center" });

    doc.fillColor("#2563eb").fontSize(12).font("Helvetica-Bold")
      .text(category.name.toUpperCase(), 20, 126, { width: 260, align: "center" });

    // ── Séparateur ──────────────────────────────────────────────────────────
    doc.moveTo(20, 152).lineTo(280, 152).strokeColor("#e2e8f0").lineWidth(1).stroke();

    // ── Infos événement ─────────────────────────────────────────────────────
    doc.fillColor("#475569").fontSize(10).font("Helvetica");
    let y = 162;

    doc.text(`📅  ${startDate === endDate ? startDate : `${startDate} – ${endDate}`}`, 20, y, { width: 260 });
    y += 18;

    if (event.lieu) {
      doc.text(`📍  ${event.lieu}`, 20, y, { width: 260 });
      y += 18;
    }

    doc.text(`✉️  ${participant.email}`, 20, y, { width: 260 });
    y += 18;

    // ── QR Code ─────────────────────────────────────────────────────────────
    if (badge.qr_code) {
      const base64Data = badge.qr_code.replace(/^data:image\/\w+;base64,/, "");
      const qrBuffer = Buffer.from(base64Data, "base64");
      const qrY = y + 10;
      doc.image(qrBuffer, 90, qrY, { width: 120, height: 120 });
      y = qrY + 130;
    }

    // ── Pied de page ────────────────────────────────────────────────────────
    doc.rect(0, 390, 300, 30).fill("#f1f5f9");
    doc.fillColor("#94a3b8").fontSize(8).font("Helvetica")
      .text("Badges Système — badge officiel", 0, 398, { width: 300, align: "center" });

    doc.end();
  });
}

module.exports = { generateBadgePDF };
