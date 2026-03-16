/**
 * Service Category.
 * Gestion des catégories de participation d'un événement.
 */

const { Category, Event } = require("../models");

class CategoryService {
  static async create({ event_id, name, description, price }) {
    const event = await Event.findByPk(event_id);
    if (!event) throw new Error("Événement introuvable");

    return await Category.create({ event_id, name, description, price });
  }

  static async getByEvent(event_id, { limit, offset }) {
    const event = await Event.findByPk(event_id);
    if (!event) throw new Error("Événement introuvable");

    return await Category.findAndCountAll({
      where: { event_id },
      limit,
      offset,
      order: [["name", "ASC"]],
    });
  }

  static async getById(id) {
    const category = await Category.findByPk(id, {
      include: [{ model: Event, as: "event", attributes: ["id", "title"] }],
    });
    if (!category) throw new Error("Catégorie introuvable");
    return category;
  }

  static async update(id, { name, description, price }) {
    const category = await Category.findByPk(id);
    if (!category) throw new Error("Catégorie introuvable");
    return await category.update({ name, description, price });
  }

  static async delete(id) {
    const category = await Category.findByPk(id);
    if (!category) throw new Error("Catégorie introuvable");
    await category.destroy();
    return { message: "Catégorie supprimée" };
  }
}

module.exports = CategoryService;
