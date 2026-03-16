/**
 * Service Inscription.
 *
 * Responsabilités :
 * - Création d'une inscription (participant + event + catégorie)
 * - Changement de statut
 * - Listing paginé
 *
 * Règles métier :
 * - Un participant ne peut être inscrit qu'une seule fois au même événement
 * - La catégorie doit appartenir à l'événement
 */

const { Inscription, Participant, Event, Category, Badge } = require("../models");
const BadgeService = require("./badge.service");
const { Op } = require("sequelize");

class InscriptionService {
  static async create({ participant_id, event_id, category_id }) {
    // Vérifications d'existence
    const participant = await Participant.findByPk(participant_id);
    if (!participant) throw new Error("Participant introuvable");

    const event = await Event.findByPk(event_id);
    if (!event) throw new Error("Événement introuvable");

    const category = await Category.findByPk(category_id);
    if (!category) throw new Error("Catégorie introuvable");

    // La catégorie doit appartenir à l'événement
    if (category.event_id !== event_id) {
      throw new Error("Cette catégorie n'appartient pas à cet événement");
    }

    // Un participant ne peut s'inscrire qu'une fois par événement
    const existing = await Inscription.findOne({
      where: { participant_id, event_id },
    });
    if (existing) throw new Error("Ce participant est déjà inscrit à cet événement");

    const inscription = await Inscription.create({
      participant_id,
      event_id,
      category_id,
      date_inscription: new Date(),
      statut: "pending",
    });

    return inscription;
  }

  static async getAll({ limit, offset, event_id, statut }) {
    const where = {};
    if (event_id) where.event_id = event_id;
    if (statut) where.statut = statut;

    return await Inscription.findAndCountAll({
      where,
      include: [
        { model: Participant, as: "participant" },
        { model: Event, as: "event", attributes: ["id", "title"] },
        { model: Category, as: "category", attributes: ["id", "name", "price"] },
        { model: Badge, as: "badge", attributes: ["id", "statut", "date_generation"] },
      ],
      limit,
      offset,
      order: [["date_inscription", "DESC"]],
      distinct: true,
    });
  }

  static async getById(id) {
    const inscription = await Inscription.findByPk(id, {
      include: [
        { model: Participant, as: "participant" },
        { model: Event, as: "event" },
        { model: Category, as: "category" },
        { model: Badge, as: "badge" },
      ],
    });
    if (!inscription) throw new Error("Inscription introuvable");
    return inscription;
  }

  /**
   * Met à jour le statut d'une inscription.
   * Si le statut passe à 'confirmed' et qu'il n'y a pas encore de badge, on en génère un.
   */
  static async updateStatus(id, statut) {
    const inscription = await Inscription.findByPk(id, {
      include: [{ model: Badge, as: "badge" }],
    });
    if (!inscription) throw new Error("Inscription introuvable");

    const validStatuts = ["pending", "confirmed", "cancelled"];
    if (!validStatuts.includes(statut)) throw new Error("Statut invalide");

    await inscription.update({ statut });

    // Génération automatique du badge à la confirmation
    if (statut === "confirmed" && !inscription.badge) {
      await BadgeService.generate(id);
    }

    return await InscriptionService.getById(id);
  }

  static async delete(id) {
    const inscription = await Inscription.findByPk(id);
    if (!inscription) throw new Error("Inscription introuvable");
    await inscription.destroy();
    return { message: "Inscription supprimée" };
  }
}

module.exports = InscriptionService;
