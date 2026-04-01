const { EventField, Event } = require("../models");

class EventFieldService {
  static async getByEvent(event_id) {
    return EventField.findAll({
      where: { event_id },
      order: [["order", "ASC"]],
    });
  }

  static async create(event_id, data) {
    const event = await Event.findByPk(event_id);
    if (!event) throw new Error("Événement introuvable");

    // Vérifier que field_key est unique pour cet événement
    const existing = await EventField.findOne({ where: { event_id, field_key: data.field_key } });
    if (existing) throw new Error(`Un champ avec la clé "${data.field_key}" existe déjà pour cet événement`);

    return EventField.create({ ...data, event_id });
  }

  static async update(id, event_id, data) {
    const field = await EventField.findOne({ where: { id, event_id } });
    if (!field) throw new Error("Champ introuvable");

    // Si field_key change, vérifier l'unicité
    if (data.field_key && data.field_key !== field.field_key) {
      const existing = await EventField.findOne({ where: { event_id, field_key: data.field_key } });
      if (existing) throw new Error(`Un champ avec la clé "${data.field_key}" existe déjà`);
    }

    return field.update(data);
  }

  static async delete(id, event_id) {
    const field = await EventField.findOne({ where: { id, event_id } });
    if (!field) throw new Error("Champ introuvable");
    await field.destroy();
    return { message: "Champ supprimé" };
  }
}

module.exports = EventFieldService;
