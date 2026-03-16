/**
 * Service Participant.
 * Gestion des participants (création, listing, mise à jour).
 * Un participant peut être inscrit à plusieurs événements.
 */

const { Participant, Inscription, Event, Category } = require("../models");
const { Op } = require("sequelize");

class ParticipantService {
  static async create({ nom, prenom, email, telephone, fonction, organisation, localite }) {
    const existing = await Participant.findOne({ where: { email } });
    if (existing) throw new Error("Un participant avec cet email existe déjà");

    return await Participant.create({ nom, prenom, email, telephone, fonction, organisation, localite });
  }

  static async getAll({ limit, offset, search }) {
    const where = {};

    if (search) {
      where[Op.or] = [
        { nom: { [Op.iLike]: `%${search}%` } },
        { prenom: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { organisation: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return await Participant.findAndCountAll({
      where,
      limit,
      offset,
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
