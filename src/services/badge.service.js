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

  static _validateColor(couleur) {
    if (couleur === undefined || couleur === null) return undefined;
    if (!/^#[0-9A-Fa-f]{6}$/.test(couleur)) {
      throw new Error("Format de couleur invalide. Utilisez un code hexadécimal (#RRGGBB)");
    }
    return couleur;
  }

  /**
   * Génère un badge pour une inscription.
   * Appelé automatiquement lors de la confirmation d'une inscription.
   * @param {string}  inscription_id
   * @param {string}  userId
   * @param {string}  [couleur]  - Couleur hex optionnelle (#RRGGBB), défaut #2563eb
   */
  static async generate(inscription_id, userId, couleur) {
    const inscription = await Inscription.findByPk(inscription_id);
    if (!inscription) throw new Error("Inscription introuvable");

    await this._checkEventOwnership(inscription.event_id, userId);

    const existing = await Badge.findOne({ where: { inscription_id } });
    if (existing) throw new Error("Un badge existe déjà pour cette inscription");

    const validColor = this._validateColor(couleur);
    const qrData  = `BADGE:${inscription_id}`;
    const qr_code = await generateQRCode(qrData);

    return await Badge.create({
      inscription_id,
      qr_code,
      statut: "generated",
      date_generation: new Date(),
      ...(validColor && { couleur: validColor }),
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
   * @param {string} [couleur] - Nouvelle couleur hex optionnelle (#RRGGBB)
   */
  static async regenerate(id, userId, couleur) {
    const badge = await Badge.findByPk(id, {
      include: [{ model: Inscription, as: "inscription", attributes: ["event_id"] }],
    });
    if (!badge) throw new Error("Badge introuvable");

    await this._checkEventOwnership(badge.inscription.event_id, userId);

    const validColor = this._validateColor(couleur);
    const qrData  = `BADGE:${badge.inscription_id}`;
    const qr_code = await generateQRCode(qrData);

    return await badge.update({
      qr_code,
      statut: "generated",
      date_generation: new Date(),
      ...(validColor && { couleur: validColor }),
    });
  }

  /**
   * Régénère (ou crée) le badge d'une inscription via son inscriptionId.
   * @param {string} [couleur] - Couleur hex optionnelle (#RRGGBB)
   */
  static async regenerateBadge(inscription_id, userId, couleur) {
    const inscription = await Inscription.findByPk(inscription_id);
    if (!inscription) throw new Error("Inscription introuvable");

    await this._checkEventOwnership(inscription.event_id, userId);

    const validColor = this._validateColor(couleur);
    const qrData  = `BADGE:${inscription_id}`;
    const qr_code = await generateQRCode(qrData);

    const existing = await Badge.findOne({ where: { inscription_id } });

    if (existing) {
      return existing.update({
        qr_code,
        statut: "generated",
        date_generation: new Date(),
        ...(validColor && { couleur: validColor }),
      });
    }

    return Badge.create({
      inscription_id,
      qr_code,
      statut: "generated",
      date_generation: new Date(),
      ...(validColor && { couleur: validColor }),
    });
  }

  /**
   * Met à jour uniquement la couleur d'un badge existant.
   * @param {string} id      - UUID du badge
   * @param {string} userId
   * @param {string} couleur - Couleur hex (#RRGGBB) obligatoire
   */
  static async updateColor(id, userId, couleur) {
    const badge = await Badge.findByPk(id, {
      include: [{ model: Inscription, as: "inscription", attributes: ["event_id"] }],
    });
    if (!badge) throw new Error("Badge introuvable");

    await this._checkEventOwnership(badge.inscription.event_id, userId);

    const validColor = this._validateColor(couleur);
    if (!validColor) throw new Error("La couleur est obligatoire");

    return await badge.update({ couleur: validColor });
  }
}

module.exports = BadgeService;
