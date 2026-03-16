/**
 * Service Badge.
 *
 * Responsabilités :
 * - Génération du badge (QR Code inclus)
 * - Listing paginé des badges
 * - Mise à jour du statut (generated → printed)
 *
 * Le QR Code encode l'UUID de l'inscription, permettant de vérifier
 * l'authenticité du badge lors d'un scan à l'entrée.
 */

const { Badge, Inscription, Participant, Event, Category } = require("../models");
const { generateQRCode } = require("../utils/qrcode.util");

class BadgeService {
  /**
   * Génère un badge pour une inscription.
   * Appelé automatiquement lors de la confirmation d'une inscription.
   * @param {string} inscription_id - UUID de l'inscription
   */
  static async generate(inscription_id) {
    const inscription = await Inscription.findByPk(inscription_id);
    if (!inscription) throw new Error("Inscription introuvable");

    // Un seul badge par inscription
    const existing = await Badge.findOne({ where: { inscription_id } });
    if (existing) throw new Error("Un badge existe déjà pour cette inscription");

    // Le QR Code encode l'UUID de l'inscription (données lisibles par scanner)
    const qrData = `BADGE:${inscription_id}`;
    const qr_code = await generateQRCode(qrData);

    const badge = await Badge.create({
      inscription_id,
      qr_code,
      statut: "generated",
      date_generation: new Date(),
    });

    return badge;
  }

  static async getAll({ limit, offset, statut }) {
    const where = {};
    if (statut) where.statut = statut;

    return await Badge.findAndCountAll({
      where,
      include: [
        {
          model: Inscription,
          as: "inscription",
          include: [
            { model: Participant, as: "participant", attributes: ["id", "nom", "prenom", "email"] },
            { model: Event, as: "event", attributes: ["id", "title"] },
            { model: Category, as: "category", attributes: ["id", "name"] },
          ],
        },
      ],
      limit,
      offset,
      order: [["date_generation", "DESC"]],
      distinct: true,
    });
  }

  static async getById(id) {
    const badge = await Badge.findByPk(id, {
      include: [
        {
          model: Inscription,
          as: "inscription",
          include: [
            { model: Participant, as: "participant" },
            { model: Event, as: "event" },
            { model: Category, as: "category" },
          ],
        },
      ],
    });
    if (!badge) throw new Error("Badge introuvable");
    return badge;
  }

  /**
   * Marque un badge comme imprimé.
   */
  static async markAsPrinted(id) {
    const badge = await Badge.findByPk(id);
    if (!badge) throw new Error("Badge introuvable");
    if (badge.statut === "printed") throw new Error("Badge déjà marqué comme imprimé");

    return await badge.update({ statut: "printed" });
  }

  /**
   * Régénère le QR Code d'un badge existant (en cas d'erreur).
   */
  static async regenerate(id) {
    const badge = await Badge.findByPk(id);
    if (!badge) throw new Error("Badge introuvable");

    const qrData = `BADGE:${badge.inscription_id}`;
    const qr_code = await generateQRCode(qrData);

    return await badge.update({ qr_code, statut: "generated", date_generation: new Date() });
  }
}

module.exports = BadgeService;
