const EventTypeService = require("../services/event_type.service");
const { success, paginated, error } = require("../utils/response.util");
const { getPagination } = require("../utils/pagination.util");

class EventTypeController {
  static async create(req, res) {
    try {
      const eventType = await EventTypeService.create(req.body);
      return success(res, eventType, "Type d'événement créé", 201);
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getAll(req, res) {
    try {
      const { limit, offset, page } = getPagination(req.query);
      const { count, rows } = await EventTypeService.getAll({ limit, offset });
      return paginated(res, rows, count, { page, limit }, "Types d'événements");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async getOne(req, res) {
    try {
      const eventType = await EventTypeService.getById(req.params.id);
      return success(res, eventType, "Type d'événement récupéré");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }

  static async update(req, res) {
    try {
      const eventType = await EventTypeService.update(req.params.id, req.body);
      return success(res, eventType, "Type d'événement mis à jour");
    } catch (err) {
      return error(res, err.message);
    }
  }

  static async delete(req, res) {
    try {
      const result = await EventTypeService.delete(req.params.id);
      return success(res, result, "Type d'événement supprimé");
    } catch (err) {
      return error(res, err.message, 404);
    }
  }
}

module.exports = EventTypeController;
