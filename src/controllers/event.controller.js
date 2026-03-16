const EventService = require("../services/event.service");
const { success, paginated, error } = require("../utils/response.util");
const { getPagination } = require("../utils/pagination.util");

class EventController {
  static async create(req, res) {
    try {
      // L'ID du créateur provient du token JWT (req.user)
      const event = await EventService.create({
        ...req.body,
        created_by: req.user.id,
      });
      return success(res, event, "Événement créé", 201);
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getAll(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { search, event_type_id, isActive } = req.query;
      const { count, rows } = await EventService.getAll({
        limit, offset, search, event_type_id, isActive,
      });
      return paginated(res, rows, count, { page, limit }, "Liste des événements");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getOne(req, res) {
    try {
      const event = await EventService.getById(req.params.id);
      return success(res, event, "Événement récupéré");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }

  static async update(req, res) {
    try {
      const event = await EventService.update(req.params.id, req.body);
      return success(res, event, "Événement mis à jour");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async delete(req, res) {
    try {
      const result = await EventService.delete(req.params.id);
      return success(res, result, "Événement supprimé");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }
}

module.exports = EventController;
