/**
 * Service EventDay.
 * Gestion des journées d'un événement.
 */

const { EventDay, Event } = require("../models");

class EventDayService {
  static async create({ event_id, date, heure_debut, heure_fin, lieu }) {
    const event = await Event.findByPk(event_id);
    if (!event) throw new Error("Événement introuvable");

    return await EventDay.create({ event_id, date, heure_debut, heure_fin, lieu });
  }

  static async getByEvent(event_id, { limit, offset }) {
    const event = await Event.findByPk(event_id);
    if (!event) throw new Error("Événement introuvable");

    return await EventDay.findAndCountAll({
      where: { event_id },
      limit,
      offset,
      order: [["date", "ASC"], ["heure_debut", "ASC"]],
    });
  }

  static async getById(id) {
    const day = await EventDay.findByPk(id, {
      include: [{ model: Event, as: "event", attributes: ["id", "title"] }],
    });
    if (!day) throw new Error("Jour d'événement introuvable");
    return day;
  }

  static async update(id, { date, heure_debut, heure_fin, lieu }) {
    const day = await EventDay.findByPk(id);
    if (!day) throw new Error("Jour d'événement introuvable");
    return await day.update({ date, heure_debut, heure_fin, lieu });
  }

  static async delete(id) {
    const day = await EventDay.findByPk(id);
    if (!day) throw new Error("Jour d'événement introuvable");
    await day.destroy();
    return { message: "Jour supprimé" };
  }
}

module.exports = EventDayService;
