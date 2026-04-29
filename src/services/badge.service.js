/**
 * Service Badge.
 *
 * Responsabilités :
 * - Génération du badge (QR Code inclus)
 * - Listing paginé des badges d'un événement (event_id obligatoire pour non-admin)
 * - Mise à jour du statut (generated → printed)
 * - Toutes les opérations vérifient que l'utilisateur est propriétaire de l'événement
 *
 * Le QR Code encode l'UUID de l'inscription, permettant de vérifier
 * l'authenticité du badge lors d'un scan à l'entrée.
 */

const { Badge, Inscription, Participant, Event, Category, UserEvent } = require("../models");
const { generateQRCode } = require("../utils/qrcode.util");

class BadgeService {

  /**
   * Vérifie que userId est créateur ou membre de l'événement eventId.
   * Aucune exception — même l'admin doit être lié à l'événement pour accéder aux badges.
   */
  static async _checkEventOwnership(eventId, userId) {
    const event = await Event.findByPk(eventId);
    if (!event) throw new Error("Événement introuvable");
    const isCreator  = event.created_by === userId;
    const membership = await UserEvent.findOne({ where: { event_id: eventId, user_id: userId } });
    if (!isCreator && !membership) {
      throw new Error("Accès refusé : cet événement ne vous appartient pas");
    }
  }

  /**
   * Génère un badge pour une inscription.
   * Appelé automatiquement lors de la confirmation d'une inscription.
   * @param {string}  inscription_id
   * @param {string}  userId
   * @param {boolean} isAdmin
   */
  static async generate(inscription_id, userId) {
    const inscription = await Inscription.findByPk(inscription_id);
    if (!inscription) throw new Error("Inscription introuvable");

    await this._checkEventOwnership(inscription.event_id, userId);

    const existing = await Badge.findOne({ where: { inscription_id } });
    if (existing) throw new Error("Un badge existe déjà pour cette inscription");

    const qrData  = `BADGE:${inscription_id}`;
    const qr_code = await generateQRCode(qrData);

    return await Badge.create({
      inscription_id,
      qr_code,
      statut: "generated",
      date_generation: new Date(),
    });
  }

  /**
   * Liste les badges paginés.
   * - event_id obligatoire pour les non-admins.
   * - Vérifie que l'utilisateur est propriétaire de l'événement.
   * - Filtre optionnel par statut et par inscription_id.
   */
  static async getAll({ limit, offset, statut, event_id, inscription_id, userId }) {
    if (!event_id) {
      throw new Error("Le paramètre event_id est obligatoire pour lister les badges");
    }

    await this._checkEventOwnership(event_id, userId);

    const inscriptionWhere = {};
    if (event_id)       inscriptionWhere.event_id       = event_id;
    if (inscription_id) inscriptionWhere.id              = inscription_id;

    const where = {};
    if (statut) where.statut = statut;

    return await Badge.findAndCountAll({
      where,
      include: [
        {
          model: Inscription,
          as: "inscription",
          where: Object.keys(inscriptionWhere).length ? inscriptionWhere : undefined,
          required: Object.keys(inscriptionWhere).length > 0,
          include: [
            { model: Participant, as: "participant", attributes: ["id", "nom", "prenom", "email"] },
            { model: Event,       as: "event",       attributes: ["id", "title"] },
            { model: Category,    as: "category",    attributes: ["id", "name"] },
          ],
        },
      ],
      limit,
      offset,
      order: [["date_generation", "DESC"]],
      distinct: true,
    });
  }

  /**
   * Récupère un badge par son ID avec vérification de propriété.
   */
  static async getById(id, userId) {
    const badge = await Badge.findByPk(id, {
      include: [
        {
          model: Inscription,
          as: "inscription",
          include: [
            { model: Participant, as: "participant" },
            { model: Event,       as: "event"       },
            { model: Category,    as: "category"    },
          ],
        },
      ],
    });
    if (!badge) throw new Error("Badge introuvable");

    await this._checkEventOwnership(badge.inscription.event_id, userId);

    return badge;
  }

  /**
   * Marque un badge comme imprimé.
   */
  static async markAsPrinted(id, userId) {
    const badge = await Badge.findByPk(id, {
      include: [{ model: Inscription, as: "inscription", attributes: ["event_id"] }],
    });
    if (!badge) throw new Error("Badge introuvable");
    if (badge.statut === "printed") throw new Error("Badge déjà marqué comme imprimé");

    await this._checkEventOwnership(badge.inscription.event_id, userId);

    return await badge.update({ statut: "printed" });
  }

  /**
   * Régénère le QR Code d'un badge existant (en cas d'erreur).
   */
  static async regenerate(id, userId) {
    const badge = await Badge.findByPk(id, {
      include: [{ model: Inscription, as: "inscription", attributes: ["event_id"] }],
    });
    if (!badge) throw new Error("Badge introuvable");

    await this._checkEventOwnership(badge.inscription.event_id, userId);

    const qrData  = `BADGE:${badge.inscription_id}`;
    const qr_code = await generateQRCode(qrData);

    return await badge.update({ qr_code, statut: "generated", date_generation: new Date() });
  }

  /**
   * Régénère (ou crée) le badge d'une inscription via son inscriptionId.
   */
  static async regenerateBadge(inscription_id, userId) {
    const inscription = await Inscription.findByPk(inscription_id);
    if (!inscription) throw new Error("Inscription introuvable");

    await this._checkEventOwnership(inscription.event_id, userId);

    const qrData  = `BADGE:${inscription_id}`;
    const qr_code = await generateQRCode(qrData);

    const existing = await Badge.findOne({ where: { inscription_id } });

    if (existing) {
      return existing.update({ qr_code, statut: "generated", date_generation: new Date() });
    }

    return Badge.create({
      inscription_id,
      qr_code,
      statut: "generated",
      date_generation: new Date(),
    });
  }
}

module.exports = BadgeService;
