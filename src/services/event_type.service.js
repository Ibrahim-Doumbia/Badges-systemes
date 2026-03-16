/**
 * Service EventType.
 * CRUD pour les types d'événements (conference, formation, salon, atelier).
 */

const { EventType } = require("../models");

class EventTypeService {
  static async create({ name, label, description }) {
    const existing = await EventType.findOne({ where: { name } });
    if (existing) throw new Error(`Le type '${name}' existe déjà`);

    return await EventType.create({ name, label, description });
  }

  static async getAll({ limit, offset }) {
    return await EventType.findAndCountAll({
      limit,
      offset,
      order: [["name", "ASC"]],
    });
  }

  static async getById(id) {
    const eventType = await EventType.findByPk(id);
    if (!eventType) throw new Error("Type d'événement introuvable");
    return eventType;
  }

  static async update(id, { label, description }) {
    const eventType = await EventType.findByPk(id);
    if (!eventType) throw new Error("Type d'événement introuvable");
    return await eventType.update({ label, description });
  }

  static async delete(id) {
    const eventType = await EventType.findByPk(id);
    if (!eventType) throw new Error("Type d'événement introuvable");
    await eventType.destroy();
    return { message: "Type d'événement supprimé" };
  }
}

module.exports = EventTypeService;
