/**
 * Service Participant.
 * Gestion des participants (création, listing, mise à jour).
 * Un participant peut être inscrit à plusieurs événements.
 */

const { Participant, Inscription, Event, Category, UserEvent } = require("../models");
const { Op } = require("sequelize");

class ParticipantService {
  static async create({ nom, prenom, email, telephone, fonction, organisation, localite, event_id, category_id, userId }) {
    // Vérification de l'événement et des droits d'accès
    if (!event_id) throw new Error("L'identifiant de l'événement est requis");
    if (!category_id) throw new Error("L'identifiant de la catégorie est requis");

    const event = await Event.findByPk(event_id);
    if (!event) throw new Error("Événement introuvable");
    if (!event.isActive) throw new Error("Impossible d'ajouter un participant à un événement inactif ou expiré");

    const membership = await UserEvent.findOne({ where: { event_id, user_id: userId } });
    const isCreator = event.created_by === userId;
    if (!membership && !isCreator) {
      throw new Error("Accès refusé : cet événement ne vous appartient pas");
    }

    const category = await Category.findByPk(category_id);
    if (!category) throw new Error("Catégorie introuvable");
    if (category.event_id !== event_id) throw new Error("Cette catégorie n'appartient pas à cet événement");

    // Créer le participant s'il n'existe pas encore, sinon le réutiliser
    let participant = await Participant.findOne({ where: { email } });
    if (!participant) {
      participant = await Participant.create({ nom, prenom, email, telephone, fonction, organisation, localite });
    }

    // Vérifier qu'il n'est pas déjà inscrit à cet événement
    const existing = await Inscription.findOne({ where: { participant_id: participant.id, event_id } });
    if (existing) throw new Error("Ce participant est déjà inscrit à cet événement");

    // Créer l'inscription
    await Inscription.create({
      participant_id: participant.id,
      event_id,
      category_id,
      date_inscription: new Date(),
      statut: "pending",
    });

    return participant;
  }

  static async getAll({ limit, offset, search, event_id, userId, isAdmin }) {
    // Si event_id fourni, vérifier que l'utilisateur a accès à cet événement
    if (event_id) {
      const event = await Event.findByPk(event_id);
      if (!event) throw new Error("Événement introuvable");

      if (!isAdmin) {
        const membership = await UserEvent.findOne({ where: { event_id, user_id: userId } });
        const isCreator = event.created_by === userId;
        if (!membership && !isCreator) {
          throw new Error("Accès refusé : cet événement ne vous appartient pas");
        }
      }
    }

    const where = {};

    if (search) {
      where[Op.or] = [
        { nom: { [Op.iLike]: `%${search}%` } },
        { prenom: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { organisation: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const includeInscription = {
      model: Inscription,
      as: "inscriptions",
      required: !!event_id,
      ...(event_id && { where: { event_id } }),
      include: [
        { model: Event, as: "event", attributes: ["id", "title"] },
        { model: Category, as: "category", attributes: ["id", "name"] },
      ],
    };

    return await Participant.findAndCountAll({
      where,
      include: [includeInscription],
      limit,
      offset,
      distinct: true,
      order: [["nom", "ASC"], ["prenom", "ASC"]],
    });
  }

  static async getById(id) {
    const participant = await Participant.findByPk(id, {
      include: [
        {
          model: Inscription,
          as: "inscriptions",
          include: [
            { model: Event, as: "event", attributes: ["id", "title"] },
            { model: Category, as: "category", attributes: ["id", "name"] },
          ],
        },
      ],
    });
    if (!participant) throw new Error("Participant introuvable");
    return participant;
  }

  static async update(id, data) {
    const participant = await Participant.findByPk(id);
    if (!participant) throw new Error("Participant introuvable");

    if (data.email && data.email !== participant.email) {
      const existing = await Participant.findOne({ where: { email: data.email } });
      if (existing) throw new Error("Cet email est déjà utilisé par un autre participant");
    }

    return await participant.update(data);
  }

  static async delete(id) {
    const participant = await Participant.findByPk(id);
    if (!participant) throw new Error("Participant introuvable");
    await participant.destroy();
    return { message: "Participant supprimé" };
  }
}

module.exports = ParticipantService;
